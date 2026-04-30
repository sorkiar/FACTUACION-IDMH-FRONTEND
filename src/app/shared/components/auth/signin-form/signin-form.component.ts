import { Component, AfterViewInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { AuthService } from '../../../../services/auth.service';
import { AuthLoginRequest } from '../../../../dto/auth-login.request';
import { environment } from '../../../../../environments/environment';

declare const grecaptcha: {
  ready: (cb: () => void) => void;
  render: (container: string, opts: { sitekey: string }) => number;
  getResponse: (widgetId: number) => string;
  reset: (widgetId: number) => void;
};

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
export class SigninFormComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // ===== modelo =====
  username = '';
  password = '';

  private widgetId: number | null = null;

  // ===== ui =====
  showPassword = false;
  submitted = false;
  isSubmitting = false;
  errorMessage = '';
  recaptchaError = '';

  ngAfterViewInit(): void {
    const render = () => {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(() => {
          this.widgetId = grecaptcha.render('recaptcha-container', {
            sitekey: environment.recaptchaSiteKey,
          });
        });
      } else {
        setTimeout(render, 200);
      }
    };
    render();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.recaptchaError = '';

    const token = this.widgetId != null ? grecaptcha.getResponse(this.widgetId) : '';

    if (!this.username || !this.password || !token) {
      if (!token) this.recaptchaError = 'Completa el reCAPTCHA';
      return;
    }

    this.isSubmitting = true;

    const payload: AuthLoginRequest = {
      username: this.username,
      password: this.password,
      recaptchaToken: token,
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.errorMessage = msg ?? 'Usuario o contraseña incorrectos';
        this.isSubmitting = false;
        if (this.widgetId != null) grecaptcha.reset(this.widgetId);
      },
    });
  }
}
