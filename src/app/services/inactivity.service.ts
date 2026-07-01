import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class InactivityService {

    private timer: ReturnType<typeof setTimeout> | null = null;
    private readonly TIMEOUT_MS = 10 * 60 * 1000;
    private readonly EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    private readonly boundReset = this.reset.bind(this);

    constructor(private authService: AuthService, private router: Router) {}

    start(): void {
        this.EVENTS.forEach(e => window.addEventListener(e, this.boundReset, { passive: true }));
        this.schedule();
    }

    stop(): void {
        this.EVENTS.forEach(e => window.removeEventListener(e, this.boundReset));
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    private reset(): void {
        if (this.timer) clearTimeout(this.timer);
        this.schedule();
    }

    private schedule(): void {
        this.timer = setTimeout(() => {
            this.stop();
            this.authService.logout();
            this.router.navigateByUrl('/signin', { replaceUrl: true });
        }, this.TIMEOUT_MS);
    }
}
