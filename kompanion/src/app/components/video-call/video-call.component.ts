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

interface Friend {
  name: string;
  photo: string;
  age?: number;
  city?: string;
  online?: boolean;
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

  isWaitingForMatch = true;
  friendToAdd: Friend | null = null; // Eigenschap voor vriend om toe te voegen

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.setupSocket();
      await this.setupLocalStream();
    }
  }

  private setupSocket(): void {
    this.socket = io("http://localhost:3000");
  
    this.socket.on("matchFound", async (data: { roomId: string; isInitiator: boolean }) => {
      console.log("Match gevonden. Room ID:", data.roomId);
      this.isWaitingForMatch = false;
  
      if (!this.localStream) {
        await this.setupLocalStream();
      }
  
      this.initializePeerConnection(data.roomId, data.isInitiator);
    });
  
    this.socket.emit("findMatch"); // Start zoeken naar een match
  }

  private async setupLocalStream(): Promise<void> {
    try {
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
  
        if (this.localVideo?.nativeElement) {
          this.localVideo.nativeElement.srcObject = this.localStream;
        }
        console.log("Local stream opgezet.");
      }
    } catch (error) {
      console.error("Fout bij het openen van camera en microfoon:", error);
    }
  }

  private initializePeerConnection(roomId: string, isInitiator: boolean): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  
    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  
    this.peerConnection.ontrack = (event) => {
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = event.streams[0];
        console.log("Remote stream ontvangen.");
        // Verberg de wachttekst
        const waitingMessage = document.querySelector('.waiting-message');
        if (waitingMessage) {
          waitingMessage.classList.add('hidden');
        }
      }
    };
  
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("iceCandidate", { candidate: event.candidate, roomId });
      }
    };
  
    // Als initiator, maak een offer
    if (isInitiator) {
      this.createAndSendOffer(roomId);
    }
  
    // Luister naar signaling events
    this.socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit("answer", { answer, roomId });
    });
  
    this.socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });
  
    this.socket.on("iceCandidate", async (candidate: RTCIceCandidate) => {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
  
  private async createAndSendOffer(roomId: string): Promise<void> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit("offer", { offer, roomId });
  }

  toggleCamera(): void {
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  toggleAudio(): void {
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  nextPerson(): void {
    console.log('Volgende persoon zoeken...');
    this.isWaitingForMatch = true;
    this.friendToAdd = null; // Reset vriend
    this.socket.emit('findMatch');
  }

  addFriendFromVideoCall() {
    if (this.friendToAdd) {
      const existingFriends = JSON.parse(localStorage.getItem('friends') || '[]');
      if (!existingFriends.some((f: Friend) => f.name === this.friendToAdd!.name)) {
        existingFriends.push(this.friendToAdd);
        localStorage.setItem('friends', JSON.stringify(existingFriends));
        alert(`${this.friendToAdd.name} is toegevoegd als vriend!`);
      } else {
        alert(`${this.friendToAdd.name} staat al in je vriendenlijst.`);
      }
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
    this.endCall();
  }
}
