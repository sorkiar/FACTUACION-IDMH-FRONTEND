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

import { DriverService } from '../../services/driver.service';
import { DriverResponse } from '../../dto/driver.response';
import { DriverRequest } from '../../dto/driver.request';
import { DocumentLookupService } from '../../services/document-lookup.service';
import { DriverVehicleResponse } from '../../dto/driver-vehicle.response';

@Component({
    selector: 'app-driver',
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
    templateUrl: './driver.component.html',
})
export class DriverComponent implements OnInit, OnDestroy {

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
    drivers: DriverResponse[] = [];
    private sub = new Subscription();

    // Form modal
    showForm = false;
    isEditMode = false;
    selectedDriver?: DriverResponse;

    // Confirm toggle
    showConfirmToggle = false;
    toggleTarget?: DriverResponse;
    isToggleStatus = false;

    // Form state
    submitted = false;
    isSubmitting = false;
    isLookingUp = false;

    // Form model
    docType = 'DNI';
    docNumber = '';
    firstName = '';
    lastName = '';
    licenseNumber = '';

    readonly docTypeOptions: Option[] = [
        { value: 'DNI', label: 'DNI' },
        { value: 'CE', label: 'CE' },
        { value: 'PASAPORTE', label: 'Pasaporte' },
    ];

    // ── Vehicles sub-management ──────────────────────────

    // CREATE mode: local plate list submitted after driver creation
    createPlates: string[] = [];
    newCreatePlate = '';

    addCreatePlate(): void {
        const plate = this.newCreatePlate.trim().toUpperCase();
        if (!plate) return;
        this.createPlates.push(plate);
        this.newCreatePlate = '';
    }

    removeCreatePlate(idx: number): void {
        this.createPlates.splice(idx, 1);
    }

    // EDIT mode: sub-resource endpoints
    vehicles: DriverVehicleResponse[] = [];
    loadingVehicles = false;

    // New plate input (edit)
    newPlate = '';
    isAddingPlate = false;

    // Edit plate
    editingVehicleId: number | null = null;
    editingPlate = '';
    isSavingPlate = false;

    // Delete plate
    showConfirmDeleteVehicle = false;
    deleteVehicleTarget?: DriverVehicleResponse;
    isDeletingVehicle = false;

    constructor(
        private driverService: DriverService,
        private documentLookupService: DocumentLookupService,
        private notify: NotificationService,
    ) { }

    ngOnInit(): void { this.loadDrivers(); }
    ngOnDestroy(): void { this.sub.unsubscribe(); }

    loadDrivers(): void {
        this.loading = true;
        this.loadingTable = true;
        const s = this.driverService.getAll().subscribe({
            next: res => {
                this.drivers = res?.data ?? [];
                this.currentPage = 1;
                this.loading = false;
                this.loadingTable = false;
            },
            error: err => {
                this.loading = false;
                this.loadingTable = false;
                this.drivers = [];
                this.notify.error(err?.error?.message ?? 'Error al listar conductores.');
            },
        });
        this.sub.add(s);
    }

    setSearchTerm(value: string): void {
        this.searchTerm = (value ?? '').trim().toLowerCase();
        this.currentPage = 1;
    }

    private matchesSearch(d: DriverResponse): boolean {
        if (!this.searchTerm) return true;
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
        return (
            fullName.includes(this.searchTerm) ||
            d.docNumber.toLowerCase().includes(this.searchTerm) ||
            (d.licenseNumber ?? '').toLowerCase().includes(this.searchTerm)
        );
    }

    get filteredDrivers(): DriverResponse[] {
        let list = this.drivers.filter(d => this.matchesSearch(d));
        if (this.sortColumn === 'nombre') {
            list = [...list].sort((a, b) => {
                const na = `${a.firstName} ${a.lastName}`;
                const nb = `${b.firstName} ${b.lastName}`;
                return this.sortDir === 'asc' ? na.localeCompare(nb, 'es') : nb.localeCompare(na, 'es');
            });
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredDrivers.length / this.itemsPerPage));
    }

    get currentItems(): DriverResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredDrivers.slice(start, start + this.itemsPerPage);
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

    onCreateDriver(): void {
        this.isEditMode = false;
        this.selectedDriver = undefined;
        this.resetForm();
        this.showForm = true;
    }

    onEditDriver(d: DriverResponse): void {
        this.isEditMode = true;
        this.selectedDriver = d;
        this.resetForm();
        this.docType = d.docType ?? 'DNI';
        this.docNumber = d.docNumber ?? '';
        this.firstName = d.firstName ?? '';
        this.lastName = d.lastName ?? '';
        this.licenseNumber = d.licenseNumber ?? '';
        this.showForm = true;
        this.loadVehicles(d.id);
    }

    onCloseForm(): void {
        this.showForm = false;
        this.submitted = false;
        this.editingVehicleId = null;
        this.newPlate = '';
    }

    private resetForm(): void {
        this.submitted = false;
        this.isSubmitting = false;
        this.docType = 'DNI';
        this.docNumber = '';
        this.firstName = '';
        this.lastName = '';
        this.licenseNumber = '';
        this.createPlates = [];
        this.newCreatePlate = '';
        this.vehicles = [];
        this.newPlate = '';
        this.editingVehicleId = null;
        this.editingPlate = '';
    }

    private isFormValid(): boolean {
        if (!this.docNumber.trim()) return false;
        if (!this.firstName.trim()) return false;
        if (!this.lastName.trim()) return false;
        if (!this.licenseNumber.trim()) return false;
        return true;
    }

    get canLookup(): boolean {
        return this.docType === 'DNI' && /^\d{8}$/.test(this.docNumber.trim());
    }

    lookupDocument(): void {
        if (!this.canLookup || this.isLookingUp) return;
        this.isLookingUp = true;
        
        const s = this.documentLookupService.queryDni(this.docNumber.trim()).subscribe({
            next: res => {
                const d = res.data;
                if (d) {
                    this.firstName = d.firstName ?? '';
                    this.lastName = [d.lastNamePaternal, d.lastNameMaternal].filter(Boolean).join(' ');
                }
                this.isLookingUp = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo consultar el DNI');
                this.isLookingUp = false;
            },
        });
        this.sub.add(s);
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;
        this.isSubmitting = true;

        const payload: DriverRequest = {
            docType: this.docType,
            docNumber: this.docNumber.trim(),
            firstName: this.firstName.trim(),
            lastName: this.lastName.trim(),
            licenseNumber: this.licenseNumber.trim(),
        };

        const isCreate = !(this.isEditMode && this.selectedDriver?.id);
        const request$ = isCreate
            ? this.driverService.create(payload)
            : this.driverService.update(this.selectedDriver!.id, payload);

        const s = request$.subscribe({
            next: res => {
                const driverId = res.data?.id ?? this.selectedDriver?.id;

                if (isCreate && this.createPlates.length > 0 && driverId) {
                    // Add each plate sequentially after creation
                    const addNext = (idx: number) => {
                        if (idx >= this.createPlates.length) {
                            this.isSubmitting = false;
                            this.showForm = false;
                            this.resetForm();
                            this.loadDrivers();
                            this.notify.success(res?.message ?? 'Conductor registrado correctamente');
                            return;
                        }
                        this.driverService.addVehicle(driverId, this.createPlates[idx]).subscribe({
                            next: () => addNext(idx + 1),
                            error: () => addNext(idx + 1), // continue even if one plate fails
                        });
                    };
                    addNext(0);
                } else {
                    this.isSubmitting = false;
                    this.showForm = false;
                    this.resetForm();
                    this.loadDrivers();
                    this.notify.success(res?.message ?? 'Guardado correctamente');
                }
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo guardar el conductor.');
            },
        });
        this.sub.add(s);
    }

    // ── Vehicles ──────────────────────────────────────────

    private loadVehicles(driverId: number): void {
        this.loadingVehicles = true;
        const s = this.driverService.findById(driverId).subscribe({
            next: res => {
                this.vehicles = res.data?.vehicles ?? [];
                this.loadingVehicles = false;
            },
            error: () => {
                this.vehicles = [];
                this.loadingVehicles = false;
            },
        });
        this.sub.add(s);
    }

    addPlate(): void {
        const plate = this.newPlate.trim().toUpperCase();
        if (!plate) return;
        if (!this.selectedDriver?.id) return;
        this.isAddingPlate = true;

        const s = this.driverService.addVehicle(this.selectedDriver.id, plate).subscribe({
            next: res => {
                if (res.data) this.vehicles = [...this.vehicles, res.data];
                this.newPlate = '';
                this.isAddingPlate = false;
                this.notify.success('Placa agregada');
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo agregar la placa');
                this.isAddingPlate = false;
            },
        });
        this.sub.add(s);
    }

    startEditPlate(v: DriverVehicleResponse): void {
        this.editingVehicleId = v.id;
        this.editingPlate = v.plate;
    }

    cancelEditPlate(): void {
        this.editingVehicleId = null;
        this.editingPlate = '';
    }

    savePlate(v: DriverVehicleResponse): void {
        const plate = this.editingPlate.trim().toUpperCase();
        if (!plate || !this.selectedDriver?.id) return;
        this.isSavingPlate = true;

        const s = this.driverService.updateVehicle(this.selectedDriver.id, v.id, plate).subscribe({
            next: res => {
                if (res.data) {
                    this.vehicles = this.vehicles.map(vv => vv.id === v.id ? res.data! : vv);
                }
                this.editingVehicleId = null;
                this.editingPlate = '';
                this.isSavingPlate = false;
                this.notify.success('Placa actualizada');
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar la placa');
                this.isSavingPlate = false;
            },
        });
        this.sub.add(s);
    }

    openDeleteVehicle(v: DriverVehicleResponse): void {
        this.deleteVehicleTarget = v;
        this.showConfirmDeleteVehicle = true;
    }

    closeDeleteVehicle(): void {
        this.showConfirmDeleteVehicle = false;
        this.deleteVehicleTarget = undefined;
    }

    confirmDeleteVehicle(): void {
        if (!this.deleteVehicleTarget || !this.selectedDriver?.id) return;
        this.isDeletingVehicle = true;

        const s = this.driverService.deleteVehicle(this.selectedDriver.id, this.deleteVehicleTarget.id).subscribe({
            next: () => {
                this.vehicles = this.vehicles.filter(v => v.id !== this.deleteVehicleTarget!.id);
                this.closeDeleteVehicle();
                this.isDeletingVehicle = false;
                this.notify.success('Placa eliminada');
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo eliminar la placa');
                this.isDeletingVehicle = false;
            },
        });
        this.sub.add(s);
    }

    // ── Toggle status ──────────────────────────────────────

    openToggleConfirm(d: DriverResponse): void {
        this.toggleTarget = d;
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
        return `¿Deseas ${action} a ${this.toggleTarget.firstName} ${this.toggleTarget.lastName}?`;
    }

    confirmToggleStatus(): void {
        if (!this.toggleTarget) return;
        this.isToggleStatus = true;
        const d = this.toggleTarget;
        const newStatus = d.status === 1 ? 0 : 1;

        const s = this.driverService.updateStatus(d.id, newStatus).subscribe({
            next: res => {
                this.notify.success(res?.message ?? 'Estado actualizado');
                this.closeToggleConfirm();
                this.loadDrivers();
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
