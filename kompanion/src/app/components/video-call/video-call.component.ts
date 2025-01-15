import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import SimplePeer from 'simple-peer-light';

interface Friend {
  name: string;
  photo: string;
  age: number;
  city: string;
  online: boolean;
}

interface SignalData {
  type: string;
  sdp: string;
}

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css'],
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private socket!: Socket;
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  private peer: SimplePeer | null = null;
  private videoTrack: MediaStreamTrack | null = null;

  isWaitingForMatch = true;
  friendToAdd: Friend | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.setupSocket();
      await this.setupLocalStream();
    }
  }

  private setupSocket(): void {
    this.socket = io('http://localhost:3000');

    this.socket.on(
      'matchFound',
      async (data: { roomId: string; isInitiator: boolean }) => {
        console.log('Match gevonden. Room ID:', data.roomId);
        this.isWaitingForMatch = false;

        if (!this.localStream) {
          await this.setupLocalStream();
        }

        this.initializePeerConnection(data.roomId, data.isInitiator);
      }
    );

    this.socket.emit('findMatch');
    this.isWaitingForMatch = true;
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

    this.peer.on('signal', (data: SignalData) => {
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

    this.socket.on('signal', (data: { signal: SignalData }) => {
      console.log('Received signal:', data.signal);
      if (this.peer) {
        this.peer.signal(data.signal);
      }
    });
  }

  toggleCamera(): void {
    if (this.videoTrack) {
      this.videoTrack.enabled = !this.videoTrack.enabled;

      const toggleButton = document.querySelector('.toggle-camera');
      if (toggleButton) {
        toggleButton.classList.toggle('disabled', !this.videoTrack.enabled);
      }
    }
  }

  toggleAudio(): void {
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  nextPerson(): void {
    console.log('Looking for the next person...');
    this.isWaitingForMatch = true;
    this.friendToAdd = null;

    if (this.peer) {
      this.peer.destroy();
    }

    this.socket.emit('findMatch');
  }

  addFriendFromVideoCall() {
    const defaultAvatarPath = 'assets/images/deafult-avatar.png';

    const newFriend: Friend = {
      name: `Lorik`,
      photo: defaultAvatarPath,
      age: 65,
      city: 'Amsterdam',
      online: true,
    };

    try {
      const existingFriends = JSON.parse(
        localStorage.getItem('friends') || '[]'
      );

      if (!existingFriends.some((f: Friend) => f.name === newFriend.name)) {
        existingFriends.push(newFriend);
        localStorage.setItem('friends', JSON.stringify(existingFriends));

        console.log('Friend added:', newFriend);
        console.log('Avatar path:', defaultAvatarPath);

        alert(`${newFriend.name} is toegevoegd aan je vriendenlijst!`);
      } else {
        alert(`${newFriend.name} staat al in je vriendenlijst.`);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Er is een fout opgetreden bij het toevoegen van de vriend.');
    }
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  ngOnDestroy(): void {
    if (this.peer) {
      this.peer.destroy();
    }
    this.endCall();
  }
}
