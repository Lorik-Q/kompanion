import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  constructor(private router: Router) {}
  private socket: Socket | null = null;

connectSocket() {
  if (!this.socket) {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => console.log('Connected to socket server'));
    this.socket.on('matchFound', (data: { roomId: string }) => {
      this.router.navigate(['/video-call', data.roomId]);
    });
  }
}

findRandomMatch() {
  this.connectSocket();
  this.socket?.emit('findMatch');
}

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
