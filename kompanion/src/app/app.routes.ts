import { Routes } from '@angular/router';
import { CardGameComponent } from './components/card-game/card-game.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'registreren',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'video-call/:id',
    loadComponent: () =>
      import('./components/video-call/video-call.component').then(
        (m) => m.VideoCallComponent
      ),
  },
  {
    path: 'video-call',
    loadComponent: () =>
      import('./components/video-call/video-call.component').then(
        (m) => m.VideoCallComponent
      ),
  },
  {
    path: 'games/cards',
    component: CardGameComponent,
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
