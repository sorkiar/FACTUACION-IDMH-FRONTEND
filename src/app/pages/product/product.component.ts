import { SkuSequenceService } from './../../services/sku-sequence.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ProductResponse } from '../../dto/product.response';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { ProductRequest } from '../../dto/product.request';
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

@Component({
  selector: 'app-product',
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
    TextAreaComponent
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent implements OnInit, OnDestroy {

  // UI
  loading = false;
  loadingTable = false;
  showForm = false;
  isEditMode = false;

  // Data
  products: ProductResponse[] = [];
  selectedProduct?: ProductResponse;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Subscriptions
  private sub = new Subscription();

  // ===== Form model =====
  sku = '';
  name = '';
  categoryId = '';
  unitMeasureId = '';
  salePrice: number = 0;
  estimatedCost: number = 0;
  brand = '';
  model = '';
  shortDescription = '';
  technicalSpec = '';
  status = 1;

  // Files
  mainImage?: File;
  technicalSheet?: File;

  // UI flags
  submitted = false;
  isSubmitting = false;

  // Toggle status
  showConfirmToggle = false;
  toggleTarget?: ProductResponse;
  isToggleStatus = false;

  // Search
  searchTerm = '';

  categoryOptions: Option[] = [];
  unitMeasureOptions: Option[] = [];
  loadingCategories = false;
  loadingUnitMeasures = false;

  // Pagination
  get filteredProducts(): ProductResponse[] {
    if (!this.searchTerm) return this.products;

    return this.products.filter(p =>
      p.sku.toLowerCase().includes(this.searchTerm) ||
      p.name.toLowerCase().includes(this.searchTerm)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
  }

  get currentItems(): ProductResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private unitMeasureService: UnitMeasureService,
    private skuSequenceService: SkuSequenceService,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadProducts(): void {
    this.loadingTable = true;

    const s = this.productService.getAll().subscribe({
      next: res => {
        this.products = res?.data ?? [];
        this.loadingTable = false;
      },
      error: err => {
        this.products = [];
        this.loadingTable = false;
        this.notify.error(err?.error?.message ?? 'Error al listar productos');
      }
    });

    this.sub.add(s);
  }

  private loadCategories(selectedId?: string): void {
    this.loadingCategories = true;

    const s = this.categoryService.getAll({ status: 1 }).subscribe({
      next: (res) => {
        this.categoryOptions = (res?.data ?? []).map(c => ({
          value: String(c.id),
          label: c.name,
        }));

        if (selectedId && this.categoryOptions.some(o => o.value === selectedId)) {
          this.categoryId = selectedId;
        } else {
          this.categoryId = this.categoryOptions[0]?.value ?? '';
        }

        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
        this.categoryOptions = [];
        this.notify.error('No se pudieron cargar las categorías');
      }
    });

    this.sub.add(s);
  }

  private loadUnitMeasures(selectedId?: string): void {
    this.loadingUnitMeasures = true;

    const s = this.unitMeasureService.getAll({ status: 1 }).subscribe({
      next: (res) => {
        this.unitMeasureOptions = (res?.data ?? []).map(u => ({
          value: String(u.id),
          label: u.code, // o u.name si tu backend lo expone
        }));

        if (selectedId && this.unitMeasureOptions.some(o => o.value === selectedId)) {
          this.unitMeasureId = selectedId;
        } else {
          this.unitMeasureId = this.unitMeasureOptions[0]?.value ?? '';
        }

        this.loadingUnitMeasures = false;
      },
      error: () => {
        this.loadingUnitMeasures = false;
        this.unitMeasureOptions = [];
        this.notify.error('No se pudieron cargar las unidades de medida');
      }
    });

    this.sub.add(s);
  }

  private loadSkuPreview(): void {
    this.skuSequenceService.preview('PRD').subscribe({
      next: res => {
        this.sku = res?.data ?? '';
      },
      error: err => {
        this.sku = '';
        this.notify.error(err?.error?.message ?? 'No se pudo generar el SKU');
      }
    });
  }

  onCreateProduct(): void {
    this.isEditMode = false;
    this.selectedProduct = undefined;
    this.resetForm();
    this.showForm = true;

    this.loadSkuPreview();
    this.loadCategories();
    this.loadUnitMeasures();
  }

  onEditProduct(product: ProductResponse): void {
    this.isEditMode = true;
    this.selectedProduct = product;
    this.resetForm();
    this.patchForm(product);
    this.showForm = true;

    this.loadCategories(String(product.categoryId));
    this.loadUnitMeasures(String(product.unitMeasureId));
  }

  private resetForm(): void {
    this.sku = '';
    this.name = '';
    this.categoryId = '';
    this.unitMeasureId = '';
    this.salePrice = 0;
    this.estimatedCost = 0;
    this.brand = '';
    this.model = '';
    this.shortDescription = '';
    this.technicalSpec = '';
    this.mainImage = undefined;
    this.technicalSheet = undefined;
    this.status = 1;
  }

  private patchForm(p: ProductResponse): void {
    this.sku = p.sku;
    this.name = p.name;
    this.categoryId = String(p.categoryId);
    this.unitMeasureId = String(p.unitMeasureId);
    this.salePrice = p.salePrice;
    this.estimatedCost = p.estimatedCost ?? 0;
    this.brand = p.brand ?? '';
    this.model = p.model ?? '';
    this.shortDescription = p.shortDescription;
    this.technicalSpec = p.technicalSpec;
    this.status = p.status;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSubmitProduct(): void {
    this.submitted = true;

    if (!this.isFormValid()) return;

    this.isSubmitting = true;

    const payload: ProductRequest = {
      sku: this.sku.trim(),
      name: this.name.trim(),
      categoryId: Number(this.categoryId),
      unitMeasureId: Number(this.unitMeasureId),
      salePrice: this.salePrice!,
      estimatedCost: this.estimatedCost,
      brand: this.brand || undefined,
      model: this.model || undefined,
      shortDescription: this.shortDescription.trim(),
      technicalSpec: this.technicalSpec.trim(),
    };

    const request$ = this.isEditMode && this.selectedProduct
      ? this.productService.update(this.selectedProduct.id, payload, this.mainImage, this.technicalSheet)
      : this.productService.create(payload, this.mainImage!, this.technicalSheet);

    const s = request$.subscribe({
      next: res => {
        this.notify.success(res?.message ?? 'Producto guardado');
        this.showForm = false;
        this.resetForm();
        this.loadProducts();
        this.isSubmitting = false;
      },
      error: err => {
        this.notify.error(err?.error?.message ?? 'Error al guardar producto');
        this.isSubmitting = false;
      }
    });

    this.sub.add(s);
  }

  private isFormValid(): boolean {
    if (!this.sku || this.sku.length < 3) return false;
    if (!this.name) return false;
    if (!this.categoryId) return false;
    if (!this.unitMeasureId) return false;
    if (!this.salePrice || this.salePrice <= 0) return false;
    if (!this.shortDescription) return false;
    if (!this.technicalSpec) return false;

    // Imagen obligatoria solo en create
    if (!this.isEditMode && !this.mainImage) return false;

    return true;
  }

  setSearchTerm(value: string): void {
    this.searchTerm = (value ?? '').trim().toLowerCase();
    this.currentPage = 1;
  }

  openToggleConfirm(product: ProductResponse): void {
    this.toggleTarget = product;
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

    const s = this.productService
      .updateStatus(this.toggleTarget.id, newStatus)
      .subscribe({
        next: res => {
          this.notify.success(res?.message ?? 'Estado actualizado');
          this.closeToggleConfirm();
          this.loadProducts();
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
