import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { Option, SelectComponent } from '../../../shared/components/form/select/select.component';
import { NotificationService } from '../../../shared/components/ui/notification/notification.service';
import { UserService } from '../../../services/user.service';
import { ProfileService } from '../../../services/profile.service';
import { DocumentTypeService } from '../../../services/document-type.service';
import { AuthService } from '../../../services/auth.service';
import { UserResponse } from '../../../dto/user.response';
import { ProfileResponse } from '../../../dto/profile.response';
import { DocumentTypeResponse } from '../../../dto/document-type.response';

@Component({
    selector: 'app-security-users',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PageBreadcrumbComponent,
        BadgeComponent,
        ButtonComponent,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
    ],
    templateUrl: './security-users.component.html',
})
export class SecurityUsersComponent implements OnInit {

    users: UserResponse[] = [];
    profiles: ProfileResponse[] = [];
    documentTypes: DocumentTypeResponse[] = [];

    loadingTable = false;

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    readonly pageSizeOptions = [10, 20, 50];

    // Search
    searchTerm = '';

    // Form modal
    showForm = false;
    isEditing = false;
    submitting = false;
    formSubmitted = false;
    editingId: number | null = null;

    documentTypeId = '';
    profileId = '';
    documentNumber = '';
    firstName = '';
    lastName = '';
    username = '';
    password = '';
    showPassword = false;

    // Confirm toggle modal
    showConfirmToggle = false;
    toggleTarget: UserResponse | null = null;
    isToggling = false;

    // Reset password modal
    showResetPassword = false;
    resetTarget: UserResponse | null = null;
    resetNewPassword = '';
    showResetPasswordInput = false;
    resetSubmitted = false;
    resettingPassword = false;

    // Options
    documentTypeOptions: Option[] = [];
    profileOptions: Option[] = [];

    get filteredUsers(): UserResponse[] {
        const t = this.searchTerm.trim().toLowerCase();
        if (!t) return this.users;
        return this.users.filter(u =>
            u.username.toLowerCase().includes(t) ||
            u.documentNumber.toLowerCase().includes(t) ||
            `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(t)
        );
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));
    }
    get pageItems(): (number | '...')[] {
        const total = this.totalPages;
        const current = this.currentPage;
        const pages = new Set<number>();
        for (let i = 1; i <= Math.min(3, total); i++) pages.add(i);
        for (let i = Math.max(1, total - 2); i <= total; i++) pages.add(i);
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
        const sorted = Array.from(pages).sort((a, b) => a - b);
        const result: (number | '...')[] = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
            result.push(sorted[i]);
        }
        return result;
    }

    get currentItems(): UserResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredUsers.slice(start, start + this.itemsPerPage);
    }

    get formError(): string {
        if (!this.documentTypeId) return 'Tipo de documento requerido';
        if (!this.documentNumber.trim()) return 'Número de documento requerido';
        if (!this.profileId) return 'Perfil requerido';
        if (!this.username.trim()) return 'Usuario requerido';
        if (!this.isEditing && !this.password.trim()) return 'Contraseña requerida';
        if (!this.isEditing && this.password.length < 6) return 'Contraseña mínimo 6 caracteres';
        return '';
    }

    get toggleActionLabel(): string {
        return this.toggleTarget?.status === 1 ? 'Inactivar' : 'Activar';
    }

    get isAdmin(): boolean {
        return this.authService.user?.profile === 'Administrador';
    }

    constructor(
        private userService: UserService,
        private profileService: ProfileService,
        private documentTypeService: DocumentTypeService,
        private authService: AuthService,
        private notify: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadSelects();
    }

    loadUsers(): void {
        this.loadingTable = true;
        this.userService.getAll().subscribe({
            next: res => { this.users = res.data ?? []; this.loadingTable = false; },
            error: () => { this.notify.error('Error al cargar usuarios'); this.loadingTable = false; }
        });
    }

    private loadSelects(): void {
        this.documentTypeService.getAll(1).subscribe({
            next: res => {
                this.documentTypeOptions = (res.data ?? [])
                    .filter(d => d.name?.toUpperCase() !== 'RUC')
                    .map(d => ({ value: String(d.id), label: d.name }));
            },
            error: () => {}
        });
        this.profileService.getAll().subscribe({
            next: res => {
                this.profileOptions = (res.data ?? [])
                    .filter(p => p.status === 1)
                    .map(p => ({ value: String(p.id), label: p.name }));
            },
            error: () => {}
        });
    }

    setSearchTerm(val: string): void {
        this.searchTerm = val;
        this.currentPage = 1;
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
    }

    onPageSizeChange(size: number): void {
        this.itemsPerPage = size;
        this.currentPage = 1;
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingId = null;
        this.formSubmitted = false;
        this.documentTypeId = '1';
        this.profileId = '';
        this.documentNumber = '';
        this.firstName = '';
        this.lastName = '';
        this.username = '';
        this.password = '';
        this.showPassword = false;
        this.showForm = true;
    }

    openEdit(user: UserResponse): void {
        this.isEditing = true;
        this.editingId = user.id;
        this.formSubmitted = false;
        this.documentTypeId = String(user.documentTypeId);
        this.profileId = String(user.profileId);
        this.documentNumber = user.documentNumber;
        this.firstName = user.firstName ?? '';
        this.lastName = user.lastName ?? '';
        this.username = user.username;
        this.password = '';
        this.showForm = true;
    }

    closeForm(): void {
        this.showForm = false;
    }

    save(): void {
        this.formSubmitted = true;
        if (this.formError) return;
        this.submitting = true;

        const req = {
            documentTypeId: Number(this.documentTypeId),
            profileId: Number(this.profileId),
            documentNumber: this.documentNumber.trim(),
            firstName: this.firstName.trim() || undefined,
            lastName: this.lastName.trim() || undefined,
            username: this.username.trim(),
            ...(this.isEditing ? {} : { password: this.password }),
        };

        const op$ = this.isEditing
            ? this.userService.update(this.editingId!, req)
            : this.userService.create(req);

        op$.subscribe({
            next: res => {
                this.notify.success(res.message ?? 'Guardado correctamente');
                this.submitting = false;
                this.showForm = false;
                this.loadUsers();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al guardar');
                this.submitting = false;
            }
        });
    }

    openToggleConfirm(user: UserResponse): void {
        this.toggleTarget = user;
        this.showConfirmToggle = true;
    }

    closeToggleConfirm(): void {
        this.showConfirmToggle = false;
        this.toggleTarget = null;
    }

    confirmToggle(): void {
        if (!this.toggleTarget) return;
        const newStatus = this.toggleTarget.status === 1 ? 0 : 1;
        this.isToggling = true;
        this.userService.updateStatus(this.toggleTarget.id, newStatus).subscribe({
            next: () => {
                this.toggleTarget!.status = newStatus;
                this.notify.success(`Usuario ${newStatus === 1 ? 'activado' : 'desactivado'}`);
                this.isToggling = false;
                this.closeToggleConfirm();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al cambiar estado');
                this.isToggling = false;
            }
        });
    }

    fullName(user: UserResponse): string {
        return [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
    }

    openResetPassword(user: UserResponse): void {
        this.resetTarget = user;
        this.resetNewPassword = '';
        this.showResetPasswordInput = false;
        this.resetSubmitted = false;
        this.showResetPassword = true;
    }

    closeResetPassword(): void {
        this.showResetPassword = false;
        this.resetTarget = null;
    }

    submitResetPassword(): void {
        this.resetSubmitted = true;
        if (!this.resetNewPassword.trim() || this.resetNewPassword.length < 6) return;
        this.resettingPassword = true;
        this.userService.resetPassword(this.resetTarget!.id, this.resetNewPassword).subscribe({
            next: res => {
                this.notify.success(res?.message ?? 'Contraseña restablecida correctamente');
                this.resettingPassword = false;
                this.closeResetPassword();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al restablecer contraseña');
                this.resettingPassword = false;
            }
        });
    }
}
