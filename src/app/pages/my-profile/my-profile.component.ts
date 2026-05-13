import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
    templateUrl: './my-profile.component.html',
})
export class MyProfileComponent implements OnInit {

    // Profile info
    firstName = '';
    lastName = '';
    username = '';
    private originalUsername = '';
    documentType = '';
    documentNumber = '';
    profile = '';

    savingProfile = false;
    profileSubmitted = false;

    // Password change
    newPassword = '';
    confirmPassword = '';
    savingPassword = false;
    passwordSubmitted = false;
    showNewPassword = false;
    showConfirmPassword = false;

    get profileError(): string {
        return '';
    }

    get passwordError(): string {
        if (!this.newPassword) return 'La contraseña es obligatoria';
        if (this.newPassword.length < 6) return 'Debe tener al menos 6 caracteres';
        if (this.newPassword !== this.confirmPassword) return 'Las contraseñas no coinciden';
        return '';
    }

    get userInitials(): string {
        const f = this.firstName.charAt(0).toUpperCase();
        const l = this.lastName.charAt(0).toUpperCase();
        return (f + l) || this.username.charAt(0).toUpperCase() || '?';
    }

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private notify: NotificationService,
    ) {}

    ngOnInit(): void {
        const user = this.authService.user;
        if (user) {
            this.firstName = user.firstName ?? '';
            this.lastName = user.lastName ?? '';
            this.username = user.username ?? '';
            this.originalUsername = this.username;
            this.documentType = user.documentType ?? '';
            this.documentNumber = user.documentNumber ?? '';
            this.profile = user.profile ?? '';
        }
    }

    saveProfile(): void {
        this.profileSubmitted = true;
        if (this.profileError) return;
        this.savingProfile = true;

        const user = this.authService.user;
        if (!user) return;

        this.userService.update(user.id, {
            documentTypeId: 1,
            profileId: 1,
            documentNumber: this.documentNumber,
            firstName: this.firstName.trim() || undefined,
            lastName: this.lastName.trim() || undefined,
            username: this.originalUsername,
        }).subscribe({
            next: res => {
                this.savingProfile = false;
                this.profileSubmitted = false;
                const stored = this.authService.user;
                if (stored) {
                    stored.firstName = this.firstName;
                    stored.lastName = this.lastName;
                    stored.username = this.username;
                    localStorage.setItem('auth_user', JSON.stringify(stored));
                }
                this.notify.success(res?.message ?? 'Perfil actualizado correctamente');
            },
            error: err => {
                this.savingProfile = false;
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar el perfil');
            }
        });
    }

    savePassword(): void {
        this.passwordSubmitted = true;
        if (this.passwordError) return;
        this.savingPassword = true;

        this.userService.setPassword(this.newPassword).subscribe({
            next: res => {
                this.savingPassword = false;
                this.passwordSubmitted = false;
                this.newPassword = '';
                this.confirmPassword = '';
                this.notify.success(res?.message ?? 'Contraseña actualizada correctamente');
            },
            error: err => {
                this.savingPassword = false;
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar la contraseña');
            }
        });
    }

    resetPassword(): void {
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordSubmitted = false;
    }
}
