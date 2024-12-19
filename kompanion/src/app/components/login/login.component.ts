import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  popupMessage: string = ''; // Voor pop-up meldingen
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.popupMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error?.message === 'Account niet gevonden') {
            this.popupMessage = 'Deze account bestaat niet.';
          } else if (error.error?.message === 'Fout wachtwoord') {
            this.popupMessage = 'Het ingevoerde wachtwoord is onjuist.';
          } else {
            this.errorMessage = error.message || 'Er is een fout opgetreden.';
          }
          this.clearPopupMessage();
        },
      });
    }
  }

  private clearPopupMessage(): void {
    setTimeout(() => {
      this.popupMessage = '';
    }, 3000); // Pop-up verdwijnt na 3 seconden
  }
}
