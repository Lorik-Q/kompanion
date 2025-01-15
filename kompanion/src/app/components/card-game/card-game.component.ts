import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer-light';

interface Card {
  suit: string;
  value: string;
  imageUrl: string;
}

@Component({
  selector: 'app-card-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-game.component.html',
  styleUrls: ['./card-game.component.css'],
})
export class CardGameComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  playerHand: Card[] = [];
  cpuHand: Card[] = [];
  topCard?: Card;
  deck: Card[] = [];
  isPlayerTurn: boolean = true;
  gameStarted: boolean = false;
  private socket!: Socket;
  private peer: SimplePeer | null = null;
  private localStream!: MediaStream;
  private videoTrack: MediaStreamTrack | null = null;

  constructor() {}

  ngOnInit() {
    this.initGame();
    this.setupSocket();
    this.setupLocalStream();
  }

  private initGame() {
    this.deck = this.createDeck();
    this.dealCards();
  }

  private createDeck(): Card[] {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'jack',
      'queen',
      'king',
      'ace',
    ];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          suit,
          value,
          imageUrl: `/assets/images/cards/${value}_of_${suit}.png`,
        });
      }
    }

    return this.shuffle(deck);
  }

  private shuffle(array: Card[]): Card[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private dealCards() {
    this.playerHand = this.deck.splice(0, 7);
    this.cpuHand = this.deck.splice(0, 7);
    this.topCard = this.deck.splice(0, 1)[0];
    this.isPlayerTurn = true;
    this.gameStarted = true;
  }

  private setupSocket(): void {
    this.socket = io('http://localhost:3000');

    this.socket.on(
      'matchFound',
      async (data: { roomId: string; isInitiator: boolean }) => {
        console.log('Match gevonden. Room ID:', data.roomId);

        if (!this.localStream) {
          await this.setupLocalStream();
        }

        this.initializePeerConnection(data.roomId, data.isInitiator);
      }
    );

    this.socket.emit('findMatch');
  }

  private async setupLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      this.videoTrack = this.localStream.getVideoTracks()[0];
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  private initializePeerConnection(roomId: string, isInitiator: boolean): void {
    if (!this.localStream) {
      console.error('No local stream available');
      return;
    }

    this.peer = new SimplePeer({
      initiator: isInitiator,
      stream: this.localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:165.22.21.74:3478',
            username: 'user',
            credential: 'uiopuiop',
          },
        ],
      },
    });

    this.peer.on('signal', (data: any) => {
      console.log('Sending signal:', data);
      this.socket.emit('signal', { signal: data, roomId });
    });

    this.peer.on('stream', (stream: MediaStream) => {
      console.log('Received remote stream');
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    });

    this.peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
    });

    this.socket.on('signal', (data: { signal: any }) => {
      console.log('Received signal:', data.signal);
      if (this.peer) {
        this.peer.signal(data.signal);
      }
    });
  }

  toggleCamera(): void {
    if (this.videoTrack) {
      this.videoTrack.enabled = !this.videoTrack.enabled;
    }
  }

  ngOnDestroy() {
    if (this.peer) {
      this.peer.destroy();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  canPlayCard(card: Card): boolean {
    if (!this.topCard) return true;
    return card.suit === this.topCard.suit || card.value === this.topCard.value;
  }

  playCard(card: Card) {
    if (this.isPlayerTurn && this.canPlayCard(card)) {
      this.topCard = card;
      this.playerHand = this.playerHand.filter(
        (c) => c.suit !== card.suit || c.value !== card.value
      );

      if (this.playerHand.length === 0) {
        setTimeout(() => {
          alert('Gefeliciteerd! Je hebt gewonnen!');
          this.initGame();
        }, 500);
        return;
      }

      this.isPlayerTurn = false;
      setTimeout(() => this.cpuTurn(), 1000);
    }
  }

  drawCard() {
    if (!this.isPlayerTurn || this.deck.length === 0) return;

    const card = this.deck.pop()!;
    this.playerHand.push(card);

    this.isPlayerTurn = false;
    setTimeout(() => this.cpuTurn(), 1000);
  }

  private cpuTurn() {
    const playableCard = this.cpuHand.find((card) => this.canPlayCard(card));

    if (playableCard) {
      this.topCard = playableCard;
      this.cpuHand = this.cpuHand.filter(
        (c) => c.suit !== playableCard.suit || c.value !== playableCard.value
      );

      if (this.cpuHand.length === 0) {
        setTimeout(() => {
          alert('De computer heeft gewonnen!');
          this.initGame();
        }, 500);
        return;
      }
    } else if (this.deck.length > 0) {
      const card = this.deck.pop()!;
      this.cpuHand.push(card);
    }

    this.isPlayerTurn = true;
  }

  getCardTransform(index: number, total: number): string {
    const spread = Math.min(20, 40 / total);
    const rotation = (index - (total - 1) / 2) * spread;
    const translateY = Math.abs(rotation) * 1.5;
    return `translateY(${translateY}px) rotate(${rotation}deg)`;
  }

  startNewGame() {
    this.initGame();
  }
}
