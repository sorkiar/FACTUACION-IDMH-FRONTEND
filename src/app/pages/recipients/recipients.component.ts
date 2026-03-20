import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { Option, SelectComponent } from '../../shared/components/form/select/select.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

import { RecipientService } from '../../services/recipient.service';
import { RecipientResponse } from '../../dto/recipient.response';
import { RecipientRequest } from '../../dto/recipient.request';

@Component({
    selector: 'app-recipients',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NgClass,
        PageBreadcrumbComponent,
        ButtonComponent,
        BadgeComponent,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
    ],
    templateUrl: './recipients.component.html',
    styleUrl: './recipients.component.css',
})
export class RecipientsComponent implements OnInit, OnDestroy {

    // Pagination
    currentPage = 1;
    itemsPerPage = 5;
    readonly pageSizeOptions = [5, 10, 15, 20, 50];

    // Sort
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // UI
    loading = false;
    loadingTable = false;

    // Search
    searchTerm = '';

    // Data
    recipients: RecipientResponse[] = [];

    private sub = new Subscription();

    // Form modal
    showForm = false;
    isEditMode = false;
    selectedRecipient?: RecipientResponse;

    // Confirm modal
    showConfirmToggle = false;
    toggleTarget?: RecipientResponse;
    isToggleStatus = false;

    // Form state
    submitted = false;
    isSubmitting = false;

    // Form model
    docType = 'RUC';
    docNumber = '';
    name = '';
    address = '';

    readonly docTypeOptions: Option[] = [
        { value: 'RUC', label: 'RUC' },
        { value: 'DNI', label: 'DNI' },
    ];

    constructor(
        private recipientService: RecipientService,
        private notify: NotificationService,
    ) { }

    ngOnInit(): void {
        this.loadRecipients();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    loadRecipients(): void {
        this.loading = true;
        this.loadingTable = true;
        const s = this.recipientService.getAll().subscribe({
            next: res => {
                this.recipients = res?.data ?? [];
                this.currentPage = 1;
                this.loading = false;
                this.loadingTable = false;
            },
            error: err => {
                this.loading = false;
                this.loadingTable = false;
                this.recipients = [];
                this.notify.error(err?.error?.message ?? 'Ocurrió un error al listar destinatarios.');
            },
        });
        this.sub.add(s);
    }

    setSearchTerm(value: string): void {
        this.searchTerm = (value ?? '').trim().toLowerCase();
        this.currentPage = 1;
    }

    private matchesSearch(r: RecipientResponse): boolean {
        if (!this.searchTerm) return true;
        return (
            r.name.toLowerCase().includes(this.searchTerm) ||
            r.docNumber.toLowerCase().includes(this.searchTerm) ||
            r.docType.toLowerCase().includes(this.searchTerm) ||
            (r.address ?? '').toLowerCase().includes(this.searchTerm)
        );
    }

    get filteredRecipients(): RecipientResponse[] {
        let list = (this.recipients ?? []).filter(r => this.matchesSearch(r));
        if (this.sortColumn === 'nombre') {
            list = [...list].sort((a, b) =>
                this.sortDir === 'asc'
                    ? a.name.localeCompare(b.name, 'es')
                    : b.name.localeCompare(a.name, 'es')
            );
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredRecipients.length / this.itemsPerPage));
    }

    get currentItems(): RecipientResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredRecipients.slice(start, start + this.itemsPerPage);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }

    toggleSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDir = 'asc';
        }
    }

    onPageSizeChange(size: number): void {
        this.itemsPerPage = size;
        this.currentPage = 1;
    }

    getBadgeColor(status: number): 'success' | 'warning' | 'error' {
        if (status === 1) return 'success';
        if (status === 0) return 'error';
        return 'warning';
    }

    getBadgeText(status: number): 'Activo' | 'Inactivo' | 'Error' {
        if (status === 1) return 'Activo';
        if (status === 0) return 'Inactivo';
        return 'Error';
    }

    onCreateRecipient(): void {
        this.isEditMode = false;
        this.selectedRecipient = undefined;
        this.resetForm();
        this.showForm = true;
    }

    onEditRecipient(r: RecipientResponse): void {
        this.isEditMode = true;
        this.selectedRecipient = r;
        this.resetForm();
        this.patchToForm(r);
        this.showForm = true;
    }

    onCloseForm(): void {
        this.showForm = false;
        this.submitted = false;
    }

    private resetForm(): void {
        this.submitted = false;
        this.isSubmitting = false;
        this.docType = 'RUC';
        this.docNumber = '';
        this.name = '';
        this.address = '';
    }

    private patchToForm(r: RecipientResponse): void {
        this.docType = r.docType ?? 'RUC';
        this.docNumber = r.docNumber ?? '';
        this.name = r.name ?? '';
        this.address = r.address ?? '';
    }

    get docNumberError(): string {
        if (!this.docNumber.trim()) return 'El número de documento es obligatorio';
        const len = this.docNumber.trim().length;
        if (this.docType === 'RUC' && len !== 11) return 'El RUC debe tener exactamente 11 dígitos';
        if (this.docType === 'DNI' && len !== 8) return 'El DNI debe tener exactamente 8 dígitos';
        return '';
    }

    private isFormValid(): boolean {
        if (!this.docType) return false;
        if (this.docNumberError) return false;
        if (!this.name.trim()) return false;
        return true;
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;
        this.isSubmitting = true;

        const payload: RecipientRequest = {
            docType: this.docType,
            docNumber: this.docNumber.trim(),
            name: this.name.trim(),
            address: this.address.trim() || undefined,
        };

        const request$ = this.isEditMode && this.selectedRecipient?.id
            ? this.recipientService.update(this.selectedRecipient.id, payload)
            : this.recipientService.create(payload);

        const s = request$.subscribe({
            next: res => {
                this.isSubmitting = false;
                this.showForm = false;
                this.resetForm();
                this.loadRecipients();
                this.notify.success(res?.message ?? 'Guardado correctamente');
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo guardar el destinatario.');
            },
        });
        this.sub.add(s);
    }

    openToggleConfirm(r: RecipientResponse): void {
        this.toggleTarget = r;
        this.showConfirmToggle = true;
    }

    closeToggleConfirm(): void {
        this.showConfirmToggle = false;
        this.toggleTarget = undefined;
    }

    get toggleActionLabel(): string {
        if (!this.toggleTarget) return '';
        return this.toggleTarget.status === 1 ? 'Inactivar' : 'Activar';
    }

    get toggleConfirmText(): string {
        if (!this.toggleTarget) return '';
        const action = this.toggleTarget.status === 1 ? 'inactivar' : 'activar';
        return `¿Deseas ${action} a ${this.toggleTarget.name}?`;
    }

    confirmToggleStatus(): void {
        if (!this.toggleTarget) return;
        this.isToggleStatus = true;
        const r = this.toggleTarget;
        const newStatus = r.status === 1 ? 0 : 1;

        const s = this.recipientService.updateStatus(r.id, newStatus).subscribe({
            next: res => {
                this.notify.success(res?.message ?? 'Estado actualizado');
                this.closeToggleConfirm();
                this.loadRecipients();
                this.isToggleStatus = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar el estado.');
                this.isToggleStatus = false;
            },
        });
        this.sub.add(s);
    }
}
