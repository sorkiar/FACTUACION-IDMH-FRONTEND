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

import { CarrierService } from '../../services/carrier.service';
import { CarrierResponse } from '../../dto/carrier.response';
import { CarrierRequest } from '../../dto/carrier.request';

@Component({
    selector: 'app-carrier',
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
    templateUrl: './carrier.component.html',
})
export class CarrierComponent implements OnInit, OnDestroy {

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
    searchTerm = '';

    // Data
    carriers: CarrierResponse[] = [];
    private sub = new Subscription();

    // Form modal
    showForm = false;
    isEditMode = false;
    selectedCarrier?: CarrierResponse;

    // Confirm toggle
    showConfirmToggle = false;
    toggleTarget?: CarrierResponse;
    isToggleStatus = false;

    // Form state
    submitted = false;
    isSubmitting = false;

    // Form model
    docType = 'RUC';
    docNumber = '';
    businessName = '';

    readonly docTypeOptions: Option[] = [
        { value: 'RUC', label: 'RUC' },
    ];

    constructor(
        private carrierService: CarrierService,
        private notify: NotificationService,
    ) { }

    ngOnInit(): void { this.loadCarriers(); }
    ngOnDestroy(): void { this.sub.unsubscribe(); }

    loadCarriers(): void {
        this.loading = true;
        this.loadingTable = true;
        const s = this.carrierService.getAll().subscribe({
            next: res => {
                this.carriers = res?.data ?? [];
                this.currentPage = 1;
                this.loading = false;
                this.loadingTable = false;
            },
            error: err => {
                this.loading = false;
                this.loadingTable = false;
                this.carriers = [];
                this.notify.error(err?.error?.message ?? 'Error al listar transportistas.');
            },
        });
        this.sub.add(s);
    }

    setSearchTerm(value: string): void {
        this.searchTerm = (value ?? '').trim().toLowerCase();
        this.currentPage = 1;
    }

    private matchesSearch(c: CarrierResponse): boolean {
        if (!this.searchTerm) return true;
        return (
            c.businessName.toLowerCase().includes(this.searchTerm) ||
            c.docNumber.toLowerCase().includes(this.searchTerm)
        );
    }

    get filteredCarriers(): CarrierResponse[] {
        let list = this.carriers.filter(c => this.matchesSearch(c));
        if (this.sortColumn === 'nombre') {
            list = [...list].sort((a, b) =>
                this.sortDir === 'asc'
                    ? a.businessName.localeCompare(b.businessName, 'es')
                    : b.businessName.localeCompare(a.businessName, 'es')
            );
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredCarriers.length / this.itemsPerPage));
    }

    get currentItems(): CarrierResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredCarriers.slice(start, start + this.itemsPerPage);
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

    getBadgeColor(status: number): 'success' | 'error' {
        return status === 1 ? 'success' : 'error';
    }

    getBadgeText(status: number): string {
        return status === 1 ? 'Activo' : 'Inactivo';
    }

    // ── Form ──────────────────────────────────────────────

    onCreateCarrier(): void {
        this.isEditMode = false;
        this.selectedCarrier = undefined;
        this.resetForm();
        this.showForm = true;
    }

    onEditCarrier(c: CarrierResponse): void {
        this.isEditMode = true;
        this.selectedCarrier = c;
        this.resetForm();
        this.docType = c.docType ?? 'RUC';
        this.docNumber = c.docNumber ?? '';
        this.businessName = c.businessName ?? '';
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
        this.businessName = '';
    }

    get docNumberError(): string {
        if (!this.docNumber.trim()) return 'El número de documento es obligatorio';
        if (this.docType === 'RUC' && !/^\d{11}$/.test(this.docNumber.trim())) return 'El RUC debe tener exactamente 11 dígitos';
        return '';
    }

    private isFormValid(): boolean {
        if (this.docNumberError) return false;
        if (!this.businessName.trim()) return false;
        return true;
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;
        this.isSubmitting = true;

        const payload: CarrierRequest = {
            docType: this.docType,
            docNumber: this.docNumber.trim(),
            businessName: this.businessName.trim(),
        };

        const request$ = this.isEditMode && this.selectedCarrier?.id
            ? this.carrierService.update(this.selectedCarrier.id, payload)
            : this.carrierService.create(payload);

        const s = request$.subscribe({
            next: res => {
                this.isSubmitting = false;
                this.showForm = false;
                this.resetForm();
                this.loadCarriers();
                this.notify.success(res?.message ?? 'Guardado correctamente');
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo guardar el transportista.');
            },
        });
        this.sub.add(s);
    }

    // ── Toggle status ──────────────────────────────────────

    openToggleConfirm(c: CarrierResponse): void {
        this.toggleTarget = c;
        this.showConfirmToggle = true;
    }

    closeToggleConfirm(): void {
        this.showConfirmToggle = false;
        this.toggleTarget = undefined;
    }

    get toggleActionLabel(): string {
        return this.toggleTarget?.status === 1 ? 'Inactivar' : 'Activar';
    }

    get toggleConfirmText(): string {
        if (!this.toggleTarget) return '';
        const action = this.toggleTarget.status === 1 ? 'inactivar' : 'activar';
        return `¿Deseas ${action} a ${this.toggleTarget.businessName}?`;
    }

    confirmToggleStatus(): void {
        if (!this.toggleTarget) return;
        this.isToggleStatus = true;
        const c = this.toggleTarget;
        const newStatus = c.status === 1 ? 0 : 1;

        const s = this.carrierService.updateStatus(c.id, newStatus).subscribe({
            next: res => {
                this.notify.success(res?.message ?? 'Estado actualizado');
                this.closeToggleConfirm();
                this.loadCarriers();
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
