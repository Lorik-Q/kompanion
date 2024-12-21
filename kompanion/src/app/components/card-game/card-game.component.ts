import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class CardGameComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  playerHand: Card[] = [];
  cpuHand: Card[] = [];
  topCard?: Card;
  deck: Card[] = [];
  isPlayerTurn: boolean = true;
  gameStarted: boolean = false;

  ngOnInit() {
    this.initGame();
    this.setupVideo();
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

  private setupVideo() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (this.localVideo?.nativeElement) {
          this.localVideo.nativeElement.srcObject = stream;
        }
        // Voor demo doeleinden gebruiken we dezelfde stream
        if (this.remoteVideo?.nativeElement) {
          this.remoteVideo.nativeElement.srcObject = stream;
        }
      })
      .catch((error) => console.error('Error accessing media devices:', error));
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
