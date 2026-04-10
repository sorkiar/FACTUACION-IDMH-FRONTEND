import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { Option, SelectComponent } from '../../shared/components/form/select/select.component';
import { FileInputComponent } from '../../shared/components/form/input/file-input.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { UnitMeasureService } from '../../services/unit-measure.service';
import { DetractionCodeService } from '../../services/detraction-code.service';
import { SkuSequenceService } from '../../services/sku-sequence.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { ProductRequest } from '../../dto/product.request';
import { ProductResponse } from '../../dto/product.response';

@Component({
    selector: 'app-quick-product-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
        FileInputComponent,
        TextAreaComponent,
    ],
    templateUrl: './quick-product-register.component.html',
})
export class QuickProductRegisterComponent implements OnChanges, OnDestroy {

    @Input() isOpen = false;
    @Output() onClose = new EventEmitter<void>();
    @Output() onCreated = new EventEmitter<ProductResponse>();

    @ViewChildren(FileInputComponent) fileInputs!: QueryList<FileInputComponent>;

    private sub = new Subscription();

    // UI
    submitted = false;
    isSubmitting = false;

    // Form model
    sku = '';
    name = '';
    categoryId = '';
    unitMeasureId = '';
    salePricePen: number = 0;
    estimatedCostPen: number = 0;
    salePriceUsd: number = 0;
    estimatedCostUsd: number = 0;
    brand = '';
    model = '';
    shortDescription = '';
    technicalSpec = '';
    detractionCodeId = '';

    // Files
    mainImage?: File;
    technicalSheet?: File;

    // Options
    categoryOptions: Option[] = [];
    unitMeasureOptions: Option[] = [];
    detractionOptions: Option[] = [];
    loadingCategories = false;
    loadingUnitMeasures = false;
    loadingDetractions = false;

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        private unitMeasureService: UnitMeasureService,
        private detractionCodeService: DetractionCodeService,
        private skuSequenceService: SkuSequenceService,
        private notify: NotificationService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen) {
            this.reset();
            this.loadSkuPreview();
            this.loadCategories();
            this.loadUnitMeasures();
            this.loadDetractionCodes();
        }
    }

    ngOnDestroy(): void { this.sub.unsubscribe(); }

    private loadSkuPreview(): void {
        this.skuSequenceService.preview('PRD').subscribe({
            next: res => { this.sku = res?.data ?? ''; },
            error: () => { this.sku = ''; },
        });
    }

    private loadCategories(): void {
        this.loadingCategories = true;
        const s = this.categoryService.getAll({ status: 1 }).subscribe({
            next: (res) => {
                this.categoryOptions = (res?.data ?? []).map(c => ({ value: String(c.id), label: c.name }));
                this.categoryId = this.categoryOptions[0]?.value ?? '';
                this.loadingCategories = false;
            },
            error: () => { this.loadingCategories = false; this.categoryOptions = []; },
        });
        this.sub.add(s);
    }

    private loadUnitMeasures(): void {
        this.loadingUnitMeasures = true;
        const s = this.unitMeasureService.getAll({ status: 1 }).subscribe({
            next: (res) => {
                this.unitMeasureOptions = (res?.data ?? []).map(u => ({ value: String(u.id), label: u.code }));
                this.unitMeasureId = this.unitMeasureOptions[0]?.value ?? '';
                this.loadingUnitMeasures = false;
            },
            error: () => { this.loadingUnitMeasures = false; this.unitMeasureOptions = []; },
        });
        this.sub.add(s);
    }

    private loadDetractionCodes(): void {
        this.loadingDetractions = true;
        const s = this.detractionCodeService.getAll({ category: 'BIEN', status: 1 }).subscribe({
            next: res => {
                this.detractionOptions = [
                    { value: '', label: 'Sin detracción' },
                    ...(res?.data ?? []).map(d => ({
                        value: String(d.id),
                        label: `${d.code} - ${d.description} (${d.percentage}%)`
                    }))
                ];
                this.loadingDetractions = false;
            },
            error: () => {
                this.detractionOptions = [{ value: '', label: 'Sin detracción' }];
                this.loadingDetractions = false;
            },
        });
        this.sub.add(s);
    }

    private isFormValid(): boolean {
        if (!this.name) return false;
        if (!this.categoryId) return false;
        if (!this.unitMeasureId) return false;
        if (!(this.salePricePen > 0) && !(this.salePriceUsd > 0)) return false;
        if (!this.shortDescription) return false;
        if (!this.technicalSpec) return false;
        return true;
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;

        this.isSubmitting = true;

        const payload: ProductRequest = {
            name: this.name.trim(),
            categoryId: Number(this.categoryId),
            unitMeasureId: Number(this.unitMeasureId),
            detractionCodeId: this.detractionCodeId ? Number(this.detractionCodeId) : undefined,
            salePricePen: this.salePricePen || undefined,
            estimatedCostPen: this.estimatedCostPen || undefined,
            salePriceUsd: this.salePriceUsd || undefined,
            estimatedCostUsd: this.estimatedCostUsd || undefined,
            brand: this.brand || undefined,
            model: this.model || undefined,
            shortDescription: this.shortDescription.trim(),
            technicalSpec: this.technicalSpec.trim(),
        };

        const s = this.productService.create(payload, this.mainImage!, this.technicalSheet).subscribe({
            next: res => {
                this.isSubmitting = false;
                this.notify.success(res?.message ?? 'Producto registrado correctamente');
                this.onCreated.emit(res.data!);
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'Error al registrar producto');
            },
        });
        this.sub.add(s);
    }

    onMainImageChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.mainImage = file;
    }

    onTechnicalSheetChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.technicalSheet = file;
    }

    close(): void { this.onClose.emit(); }

    private reset(): void {
        this.submitted = false;
        this.isSubmitting = false;
        this.sku = '';
        this.name = '';
        this.categoryId = '';
        this.unitMeasureId = '';
        this.salePricePen = 0;
        this.estimatedCostPen = 0;
        this.salePriceUsd = 0;
        this.estimatedCostUsd = 0;
        this.brand = '';
        this.model = '';
        this.shortDescription = '';
        this.technicalSpec = '';
        this.detractionCodeId = '';
        this.mainImage = undefined;
        this.technicalSheet = undefined;
        this.fileInputs?.forEach(fi => fi.reset());
    }
}
