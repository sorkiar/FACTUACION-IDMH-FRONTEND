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
import { SwitchComponent } from '../../shared/components/form/input/switch.component';
import { ServiceService } from '../../services/service.service';
import { ServiceCategoryService } from '../../services/service-category.service';
import { ChargeUnitService } from '../../services/charge-unit.service';
import { DetractionCodeService } from '../../services/detraction-code.service';
import { SkuSequenceService } from '../../services/sku-sequence.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { ServiceRequest } from '../../dto/service.request';
import { ServiceResponse } from '../../dto/service.response';

@Component({
    selector: 'app-quick-service-register',
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
        SwitchComponent,
    ],
    templateUrl: './quick-service-register.component.html',
})
export class QuickServiceRegisterComponent implements OnChanges, OnDestroy {

    @Input() isOpen = false;
    @Output() onClose = new EventEmitter<void>();
    @Output() onCreated = new EventEmitter<ServiceResponse>();

    @ViewChildren(FileInputComponent) fileInputs!: QueryList<FileInputComponent>;

    private sub = new Subscription();

    // UI
    submitted = false;
    isSubmitting = false;

    // Form model
    sku = '';
    name = '';
    serviceCategoryId = '';
    chargeUnitId = '';
    pricePen: number = 0;
    priceUsd: number = 0;
    shortDescription = '';
    detailedDescription = '';
    detractionCodeId = '';
    requiresMaterials = false;
    requiresSpecification = false;

    // Files
    mainImage?: File;
    technicalSheet?: File;

    // Options
    serviceCategoryOptions: Option[] = [];
    chargeUnitOptions: Option[] = [];
    detractionOptions: Option[] = [];
    loadingServiceCategories = false;
    loadingChargeUnits = false;
    loadingDetractions = false;

    constructor(
        private serviceService: ServiceService,
        private serviceCategoryService: ServiceCategoryService,
        private chargeUnitService: ChargeUnitService,
        private detractionCodeService: DetractionCodeService,
        private skuSequenceService: SkuSequenceService,
        private notify: NotificationService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen) {
            this.reset();
            this.loadSkuPreview();
            this.loadServiceCategories();
            this.loadChargeUnits();
            this.loadDetractionCodes();
        }
    }

    ngOnDestroy(): void { this.sub.unsubscribe(); }

    private loadSkuPreview(): void {
        this.skuSequenceService.preview('SRV').subscribe({
            next: res => { this.sku = res?.data ?? ''; },
            error: () => { this.sku = ''; },
        });
    }

    private loadServiceCategories(): void {
        this.loadingServiceCategories = true;
        const s = this.serviceCategoryService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.serviceCategoryOptions = (res.data ?? []).map(c => ({ value: String(c.id), label: c.name }));
                this.serviceCategoryId = this.serviceCategoryOptions[0]?.value ?? '';
                this.loadingServiceCategories = false;
            },
            error: () => { this.loadingServiceCategories = false; },
        });
        this.sub.add(s);
    }

    private loadChargeUnits(): void {
        this.loadingChargeUnits = true;
        const s = this.chargeUnitService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.chargeUnitOptions = (res.data ?? []).map(u => ({ value: String(u.id), label: u.name }));
                this.chargeUnitId = this.chargeUnitOptions[0]?.value ?? '';
                this.loadingChargeUnits = false;
            },
            error: () => { this.loadingChargeUnits = false; },
        });
        this.sub.add(s);
    }

    private loadDetractionCodes(): void {
        this.loadingDetractions = true;
        const s = this.detractionCodeService.getAll({ category: 'SERVICIO', status: 1 }).subscribe({
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
        if (!this.serviceCategoryId) return false;
        if (!this.chargeUnitId) return false;
        if (!(this.pricePen > 0) && !(this.priceUsd > 0)) return false;
        if (!this.shortDescription) return false;
        if (!this.detailedDescription) return false;
        return true;
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;

        this.isSubmitting = true;

        const payload: ServiceRequest = {
            name: this.name.trim(),
            serviceCategoryId: Number(this.serviceCategoryId),
            chargeUnitId: Number(this.chargeUnitId),
            detractionCodeId: this.detractionCodeId ? Number(this.detractionCodeId) : undefined,
            pricePen: this.pricePen || undefined,
            priceUsd: this.priceUsd || undefined,
            requiresMaterials: this.requiresMaterials,
            requiresSpecification: this.requiresSpecification,
            shortDescription: this.shortDescription.trim(),
            detailedDescription: this.detailedDescription.trim(),
        };

        const s = this.serviceService.create(payload, this.mainImage, this.technicalSheet).subscribe({
            next: res => {
                this.isSubmitting = false;
                this.notify.success(res?.message ?? 'Servicio registrado correctamente');
                this.onCreated.emit(res.data!);
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'Error al registrar servicio');
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
        this.serviceCategoryId = '';
        this.chargeUnitId = '';
        this.pricePen = 0;
        this.priceUsd = 0;
        this.shortDescription = '';
        this.detailedDescription = '';
        this.detractionCodeId = '';
        this.requiresMaterials = false;
        this.requiresSpecification = false;
        this.mainImage = undefined;
        this.technicalSheet = undefined;
        this.fileInputs?.forEach(fi => fi.reset());
    }
}
