import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { AuthService } from '../../../../services/auth.service';
import { AuthLoginRequest } from '../../../../dto/auth-login.request';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    LabelComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
})
export class SigninFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // ===== modelo =====
  username = '';
  password = '';

  // ===== ui =====
  showPassword = false;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    this.submitted = true;
    this.errorMessage = '';

    // validación simple (frontend)
    if (!this.username || !this.password) {
      return;
    }

    this.isSubmitting = true;

    const payload: AuthLoginRequest = {
      username: this.username,
      password: this.password,
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error login', err);
        this.errorMessage = 'Usuario o contraseña incorrectos';
        this.isSubmitting = false;
      },
    });
  }
}