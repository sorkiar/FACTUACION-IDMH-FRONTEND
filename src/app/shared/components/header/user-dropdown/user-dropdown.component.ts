import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { AuthService } from '../../../../services/auth.service';
import { NavStateService } from '../../../../services/nav-state.service';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DropdownComponent,
  ],
  templateUrl: './user-dropdown.component.html',
})
export class UserDropdownComponent {
  private authService = inject(AuthService);
  private navState = inject(NavStateService);
  private router = inject(Router);

  isOpen = false;

  get userName(): string {
    return this.authService.userName;
  }

  get hasConfiguration(): boolean {
    return this.navState.hasPath('/configuration');
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();

    // navegación limpia (evita volver atrás)
    this.router.navigateByUrl('/signin', { replaceUrl: true });
  }
}
