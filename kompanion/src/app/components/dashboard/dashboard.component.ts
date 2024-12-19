import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

interface Friend {
  name: string;
  photo: string;
  age: number;
  city: string;
  online: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [VideoService],
})
export class DashboardComponent implements OnInit {
  friends: Friend[] = [
    {
      name: 'Ilona De Bakker',
      photo: 'assets/images/ilona.jpg',
      age: 68,
      city: 'Amsterdam',
      online: true,
    },
    {
      name: 'peter De metser',
      photo: 'assets/images/peter.png',
      age: 68,
      city: 'Amsterdam',
      online: true,
    }
  ];
  showModal: boolean = false;
  modalFriend: Friend | null = null;
  
  openDeleteDialog(friend: Friend) {
    this.modalFriend = friend;
    this.showModal = true;
  }
  
  closeModal() {
    this.showModal = false;
    this.modalFriend = null;
  }
  
  deleteFriend(friend: Friend) {
    this.friends = this.friends.filter(f => f !== friend);
    this.closeModal();
    console.log(`${friend.name} is verwijderd.`);
  }
  confirmDelete(friend: Friend) {
    const confirmDelete = window.confirm(`Ben je zeker dat je ${friend.name} wilt verwijderen als vriend?`);
    if (confirmDelete) {
      this.deleteFriend(friend);
    }
  }
  currentDate: Date = new Date(); // Dynamische datum en tijd

  hasMoreFriends = false; // Controleer of de knop nodig is
  visibleFriendsCount = 0; // Houd het aantal zichtbare vrienden bij

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router, private videoService: VideoService) {}

  ngOnInit() {
    this.updateVisibleFriends(); // Controleer direct na het laden
    setInterval(() => {
      this.currentDate = new Date();
    }, 1000); // Update elke seconde (pas aan naar elke minuut als nodig) 
    if (isPlatformBrowser(this.platformId)) {
      this.updateVisibleFriends();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateVisibleFriends(); // Update bij schermgrootte-aanpassing
  }

  // Bereken het aantal zichtbare vrienden en update de status van de knop
  updateVisibleFriends() {
    // Zorg dat alle document-gerelateerde code hier komt
    console.log('Document is beschikbaar. Voer browser-specifieke code uit.');
    const visibleFriends = document.querySelectorAll('.friend-card');
    console.log(visibleFriends);
  }

  startRandomCall() {
    this.videoService.findRandomMatch();
  }

  startVideoCall(friend: Friend) {
    this.router.navigate(['/video-call', encodeURIComponent(friend.name)]);
  }

  startCall(friend: Friend) {
    console.log(`Starting call with ${friend.name}`);
  }

  startChat(friend: Friend) {
    console.log(`Opening chat with ${friend.name}`);
  }

  playGames() {
    this.router.navigate(['/games/cards']);
  }

  openBlog() {
    console.log('Opening blog section...');
  }
}
