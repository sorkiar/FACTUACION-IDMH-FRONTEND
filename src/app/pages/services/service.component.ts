import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Subscription } from 'rxjs';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { ServiceResponse } from './../../dto/service.response';
import { ServiceRequest } from './../../dto/service.request';
import { ServiceService } from './../../services/service.service';
import { ModalComponent } from "../../shared/components/ui/modal/modal.component";
import { BadgeComponent } from "../../shared/components/ui/badge/badge.component";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import { DecimalPipe, NgClass } from '@angular/common';
import { LabelComponent } from "../../shared/components/form/label/label.component";
import { InputFieldComponent } from "../../shared/components/form/input/input-field.component";
import { Option, SelectComponent } from "../../shared/components/form/select/select.component";
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { UnitMeasureService } from '../../services/unit-measure.service';
import { FileInputComponent } from "../../shared/components/form/input/file-input.component";
import { TextAreaComponent } from "../../shared/components/form/input/text-area.component";
import { ServiceCategoryService } from '../../services/service-category.service';
import { ChargeUnitService } from '../../services/charge-unit.service';
import { SwitchComponent } from "../../shared/components/form/input/switch.component";
import { SkuSequenceService } from '../../services/sku-sequence.service';

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [
    PageBreadcrumbComponent,
    ModalComponent,
    BadgeComponent,
    ButtonComponent,
    NgClass,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    DecimalPipe,
    FormsModule,
    FileInputComponent,
    TextAreaComponent,
    SwitchComponent
],
  templateUrl: './service.component.html',
  styleUrl: './service.component.css',
})
export class ServiceComponent implements OnInit, OnDestroy {
  // UI
  loading = false;
  loadingTable = false;
  showForm = false;
  isEditMode = false;

  // Data
  services: ServiceResponse[] = [];
  selectedService?: ServiceResponse;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Subscriptions
  private sub = new Subscription();

  // ===== Form model =====
  sku = '';
  name = '';
  serviceCategoryId = '';
  chargeUnitId = '';
  price = 0;
  estimatedTime = '';
  expectedDelivery = '';
  requiresMaterials = false;
  requiresSpecification = false;
  includesDescription = '';
  excludesDescription = '';
  conditions = '';
  shortDescription = '';
  detailedDescription = '';
  status = 1;

  // Files
  mainImage?: File;
  technicalSheet?: File;

  // UI flags
  submitted = false;
  isSubmitting = false;

  // Toggle status
  showConfirmToggle = false;
  toggleTarget?: ServiceResponse;
  isToggleStatus = false;

  // Search
  searchTerm = '';

  serviceCategoryOptions: Option[] = [];
  chargeUnitOptions: Option[] = [];

  loadingServiceCategories = false;
  loadingChargeUnits = false;

  // Pagination
  get filteredServices(): ServiceResponse[] {
    if (!this.searchTerm) return this.services;

    return this.services.filter(p =>
      p.sku.toLowerCase().includes(this.searchTerm) ||
      p.name.toLowerCase().includes(this.searchTerm)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredServices.length / this.itemsPerPage));
  }

  get currentItems(): ServiceResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredServices.slice(start, start + this.itemsPerPage);
  }

  constructor(
    private serviceService: ServiceService,
    private serviceCategoryService: ServiceCategoryService,
    private chargeUnitService: ChargeUnitService,
    private skuSequenceService: SkuSequenceService,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadServices(): void {
    this.loadingTable = true;

    const s = this.serviceService.getAll().subscribe({
      next: res => {
        this.services = res?.data ?? [];
        this.loadingTable = false;
      },
      error: err => {
        this.services = [];
        this.loadingTable = false;
        this.notify.error(err?.error?.message ?? 'Error al listar serviceos');
      }
    });

    this.sub.add(s);
  }

  private loadServiceCategories(selectedId?: string): void {
    this.loadingServiceCategories = true;

    const s = this.serviceCategoryService.getAll({ status: 1 }).subscribe({
      next: res => {
        this.serviceCategoryOptions = (res.data ?? []).map(c => ({
          value: String(c.id),
          label: c.name,
        }));

        this.serviceCategoryId =
          selectedId && this.serviceCategoryOptions.some(o => o.value === selectedId)
            ? selectedId
            : this.serviceCategoryOptions[0]?.value ?? '';

        this.loadingServiceCategories = false;
      },
      error: () => {
        this.loadingServiceCategories = false;
        this.notify.error('No se pudieron cargar las categorías de servicio');
      }
    });

    this.sub.add(s);
  }

  private loadChargeUnits(selectedId?: string): void {
    this.loadingChargeUnits = true;

    const s = this.chargeUnitService.getAll({ status: 1 }).subscribe({
      next: res => {
        this.chargeUnitOptions = (res.data ?? []).map(u => ({
          value: String(u.id),
          label: u.name,
        }));

        this.chargeUnitId =
          selectedId && this.chargeUnitOptions.some(o => o.value === selectedId)
            ? selectedId
            : this.chargeUnitOptions[0]?.value ?? '';

        this.loadingChargeUnits = false;
      },
      error: () => {
        this.loadingChargeUnits = false;
        this.notify.error('No se pudieron cargar las unidades de cobro');
      }
    });

    this.sub.add(s);
  }

  private loadSkuPreview(): void {
    this.skuSequenceService.preview('SRV').subscribe({
      next: res => {
        this.sku = res?.data ?? '';
      },
      error: err => {
        this.sku = '';
        this.notify.error(err?.error?.message ?? 'No se pudo generar el SKU');
      }
    });
  }

  onCreateService(): void {
    this.isEditMode = false;
    this.selectedService = undefined;
    this.resetForm();
    this.showForm = true;

    this.loadSkuPreview();
    this.loadServiceCategories();
    this.loadChargeUnits();
  }

  onEditService(service: ServiceResponse): void {
    this.isEditMode = true;
    this.selectedService = service;
    this.resetForm();
    this.patchForm(service);
    this.showForm = true;

    this.loadServiceCategories(String(service.serviceCategoryId));
    this.loadChargeUnits(String(service.chargeUnitId));
  }

  handleSwitchChange(checked: boolean) {
    console.log('Switch is now:', checked ? 'ON' : 'OFF');
  }

  private resetForm(): void {
    this.sku = '';
    this.name = '';
    this.serviceCategoryId = '';
    this.chargeUnitId = '';
    this.price = 0;
    this.estimatedTime = '';
    this.expectedDelivery = '';
    this.requiresMaterials = false;
    this.requiresSpecification = false;
    this.includesDescription = '';
    this.excludesDescription = '';
    this.conditions = '';
    this.shortDescription = '';
    this.detailedDescription = '';
    this.mainImage = undefined;
    this.technicalSheet = undefined;
    this.status = 1;
  }

  private patchForm(s: ServiceResponse): void {
    this.sku = s.sku;
    this.name = s.name;
    this.serviceCategoryId = String(s.serviceCategoryId);
    this.chargeUnitId = String(s.chargeUnitId);
    this.price = s.price;
    this.estimatedTime = s.estimatedTime;
    this.expectedDelivery = s.expectedDelivery;
    this.requiresMaterials = s.requiresMaterials;
    this.requiresSpecification = s.requiresSpecification;
    this.includesDescription = s.includesDescription;
    this.excludesDescription = s.excludesDescription;
    this.conditions = s.conditions;
    this.shortDescription = s.shortDescription;
    this.detailedDescription = s.detailedDescription;
    this.mainImage = undefined;
    this.technicalSheet = undefined;
    this.status = s.status;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSubmitService(): void {
    this.submitted = true;
    if (!this.isFormValid()) return;

    this.isSubmitting = true;

    const payload: ServiceRequest = {
      name: this.name.trim(),
      serviceCategoryId: Number(this.serviceCategoryId),
      chargeUnitId: Number(this.chargeUnitId),
      price: this.price,
      estimatedTime: this.estimatedTime || undefined,
      expectedDelivery: this.expectedDelivery || undefined,
      requiresMaterials: this.requiresMaterials,
      requiresSpecification: this.requiresSpecification,
      includesDescription: this.includesDescription || undefined,
      excludesDescription: this.excludesDescription || undefined,
      conditions: this.conditions || undefined,
      shortDescription: this.shortDescription.trim(),
      detailedDescription: this.detailedDescription.trim(),
    };

    const request$ = this.isEditMode && this.selectedService
      ? this.serviceService.update(this.selectedService.id, payload, this.mainImage, this.technicalSheet)
      : this.serviceService.create(payload, this.mainImage, this.technicalSheet);

    const s = request$.subscribe({
      next: res => {
        this.notify.success(res?.message ?? 'Servicio guardado');
        this.showForm = false;
        this.resetForm();
        this.loadServices();
        this.isSubmitting = false;
      },
      error: err => {
        this.notify.error(err?.error?.message ?? 'Error al guardar servicio');
        this.isSubmitting = false;
      }
    });

    this.sub.add(s);
  }

  private isFormValid(): boolean {
    if (!this.sku || this.sku.length < 3) return false;
    if (!this.name) return false;
    if (!this.serviceCategoryId) return false;
    if (!this.chargeUnitId) return false;
    if (!this.shortDescription) return false;
    if (!this.detailedDescription) return false;
    return true;
  }

  setSearchTerm(value: string): void {
    this.searchTerm = (value ?? '').trim().toLowerCase();
    this.currentPage = 1;
  }

  openToggleConfirm(service: ServiceResponse): void {
    this.toggleTarget = service;
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

  confirmToggleStatus(): void {
    if (!this.toggleTarget) return;

    this.isToggleStatus = true;

    const newStatus = this.toggleTarget.status === 1 ? 0 : 1;

    const s = this.serviceService
      .updateStatus(this.toggleTarget.id, newStatus)
      .subscribe({
        next: res => {
          this.notify.success(res?.message ?? 'Estado actualizado');
          this.closeToggleConfirm();
          this.loadServices();
          this.isToggleStatus = false;
        },
        error: err => {
          this.notify.error(err?.error?.message ?? 'No se pudo actualizar el estado');
          this.isToggleStatus = false;
        }
      });

    this.sub.add(s);
  }

  getBadgeColor(status: number): 'success' | 'error' | 'warning' {
    if (status === 1) return 'success';
    if (status === 0) return 'error';
    return 'warning';
  }

  getBadgeText(status: number): string {
    return status === 1 ? 'Activo' : 'Inactivo';
  }

  onMainImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.mainImage = file;
    }
  }

  onTechnicalSheetChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.technicalSheet = file;
    }
  }

  onCloseForm(): void { this.showForm = false; }
}
