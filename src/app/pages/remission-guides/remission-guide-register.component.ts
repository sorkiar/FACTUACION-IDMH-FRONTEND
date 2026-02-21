import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

import { ProductService } from '../../services/product.service';
import { RemissionGuideService } from '../../services/remission-guide.service';

import { ProductResponse } from '../../dto/product.response';
import { RemissionGuideResponse } from '../../dto/remission-guide.response';
import { RemissionGuideItemRequest } from '../../dto/remission-guide-item.request';
import { RemissionGuideDriverRequest } from '../../dto/remission-guide-driver.request';
import { RemissionGuideRequest } from '../../dto/remission-guide.request';

@Component({
    selector: 'app-remission-guide-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DecimalPipe,
        DatePipe,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
        TextAreaComponent,
        DatePickerComponent,
    ],
    templateUrl: './remission-guide-register.component.html',
})
export class RemissionGuideRegisterComponent implements OnChanges {

    @Input() isOpen = false;
    @Input() selectedGuide?: RemissionGuideResponse;
    @Output() onClose = new EventEmitter<void>();
    @Output() onSaved = new EventEmitter<void>();

    isViewMode = false;
    isSubmitting = false;

    readonly todayStr: string = new Date().toISOString().split('T')[0];

    // ============================
    // OPCIONES DE SELECT
    // ============================
    readonly transferReasonOptions = [
        { value: 'VENTA', label: 'Venta' },
        { value: 'COMPRA', label: 'Compra' },
        { value: 'TRASLADO_ENTRE_ESTABLECIMIENTOS', label: 'Traslado entre establecimientos' },
        { value: 'DEVOLUCION', label: 'Devolución' },
        { value: 'OTROS', label: 'Otros' },
    ];

    readonly transportModeOptions = [
        { value: 'TRANSPORTE_PUBLICO', label: 'Transporte Público' },
        { value: 'TRANSPORTE_PRIVADO', label: 'Transporte Privado' },
    ];

    readonly docTypeOptions = [
        { value: 'RUC', label: 'RUC' },
        { value: 'DNI', label: 'DNI' },
    ];

    // ============================
    // DATOS GENERALES
    // ============================
    transferDate = '';
    transferReason = '';
    transferReasonDescription = '';
    transportMode = 'TRANSPORTE_PUBLICO';
    grossWeight: number = 0;
    weightUnit = 'KGM';
    packageCount: number = 1;
    minorVehicleTransfer = false;
    observations = '';

    // ============================
    // TRANSPORTISTA (PÚBLICO)
    // ============================
    carrierDocType = 'RUC';
    carrierDocNumber = '';
    carrierName = '';

    // ============================
    // CONDUCTORES (PRIVADO)
    // ============================
    drivers: RemissionGuideDriverRequest[] = [];

    // ============================
    // DESTINATARIO
    // ============================
    recipientDocType = 'RUC';
    recipientDocNumber = '';
    recipientName = '';
    recipientAddress = '';

    // ============================
    // PUNTO DE PARTIDA
    // ============================
    originAddress = 'CAL.ACUARIO NRO. 860 DPTO. 301 URB. MERCURIO LIMA - LIMA - LOS OLIVOS';
    originUbigeo = '150117';

    // ============================
    // PUNTO DE LLEGADA
    // ============================
    destinationAddress = '';
    destinationUbigeo = '';

    // ============================
    // ÍTEMS
    // ============================
    items: RemissionGuideItemRequest[] = [];

    // ============================
    // MODAL: BUSCAR PRODUCTO
    // ============================
    showProductModal = false;
    productSearchTerm = '';
    allProducts: ProductResponse[] = [];
    productResults: ProductResponse[] = [];
    loadingProducts = false;
    productCurrentPage = 1;
    readonly productPageSize = 5;

    get pagedProductResults(): ProductResponse[] {
        const start = (this.productCurrentPage - 1) * this.productPageSize;
        return this.productResults.slice(start, start + this.productPageSize);
    }
    get productTotalPages(): number {
        return Math.max(1, Math.ceil(this.productResults.length / this.productPageSize));
    }
    get productPageEnd(): number {
        return Math.min(this.productCurrentPage * this.productPageSize, this.productResults.length);
    }

    // ============================
    // MODAL: ÍTEM PERSONALIZADO
    // ============================
    showCustomItemModal = false;
    customDescription = '';
    customQuantity: number = 1;
    customUnitMeasure = 'NIU';
    customUnitPrice: number = 0;

    constructor(
        private guideService: RemissionGuideService,
        private productService: ProductService,
        private notify: NotificationService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedGuide']) {
            if (this.selectedGuide && this.isOpen) {
                this.loadGuideForView(this.selectedGuide);
            } else if (!this.selectedGuide) {
                this.isViewMode = false;
            }
        } else if (changes['isOpen'] && this.isOpen && !this.selectedGuide) {
            this.resetForm();
        }
    }

    private loadGuideForView(guide: RemissionGuideResponse): void {
        this.resetForm();
        this.isViewMode = true;
        this.transferDate = guide.transferDate;
        this.transferReason = guide.transferReason;
        this.transferReasonDescription = guide.transferReasonDescription ?? '';
        this.transportMode = guide.transportMode;
        this.grossWeight = guide.grossWeight;
        this.weightUnit = guide.weightUnit ?? 'KGM';
        this.packageCount = guide.packageCount ?? 1;
        this.minorVehicleTransfer = guide.minorVehicleTransfer ?? false;
        this.observations = guide.observations ?? '';
        this.carrierDocType = guide.carrierDocType ?? 'RUC';
        this.carrierDocNumber = guide.carrierDocNumber ?? '';
        this.carrierName = guide.carrierName ?? '';
        this.recipientDocType = guide.recipientDocType;
        this.recipientDocNumber = guide.recipientDocNumber;
        this.recipientName = guide.recipientName;
        this.recipientAddress = guide.recipientAddress ?? '';
        this.originAddress = guide.originAddress;
        this.originUbigeo = guide.originUbigeo;
        this.destinationAddress = guide.destinationAddress;
        this.destinationUbigeo = guide.destinationUbigeo;
        this.observations = guide.observations ?? '';
        this.items = guide.items.map(i => ({
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unitMeasureSunat: i.unitMeasureSunat ?? 'NIU',
            unitPrice: i.unitPrice,
        }));
        this.drivers = (guide.drivers ?? []).map(d => ({
            docType: d.driverDocType,
            docNumber: d.driverDocNumber,
            firstName: d.driverFirstName,
            lastName: d.driverLastName,
            licenseNumber: d.driverLicenseNumber,
            vehiclePlate: d.vehiclePlate,
        }));
    }

    onTransferDateChange(event: { dateStr: string }): void {
        this.transferDate = event.dateStr;
    }

    onTransportModeChange(): void {
        if (this.transportMode === 'TRANSPORTE_PUBLICO') {
            this.drivers = [];
        } else {
            this.carrierDocNumber = '';
            this.carrierName = '';
        }
    }

    // ============================
    // CONDUCTORES
    // ============================
    addDriver(): void {
        this.drivers.push({
            docType: 'DNI',
            docNumber: '',
            firstName: '',
            lastName: '',
            licenseNumber: '',
            vehiclePlate: '',
        });
    }

    removeDriver(index: number): void {
        this.drivers.splice(index, 1);
    }

    // ============================
    // PRODUCTOS MODAL
    // ============================
    openProductModal(): void {
        this.showProductModal = true;
        this.productSearchTerm = '';
        this.productCurrentPage = 1;
        if (this.allProducts.length === 0) {
            this.loadAllProducts();
        } else {
            this.productResults = this.allProducts;
        }
    }

    loadAllProducts(): void {
        this.loadingProducts = true;
        this.productService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allProducts = res.data ?? [];
                this.productResults = this.allProducts;
                this.loadingProducts = false;
            },
            error: () => {
                this.loadingProducts = false;
            }
        });
    }

    searchProducts(): void {
        const term = this.productSearchTerm.trim().toLowerCase();
        this.productResults = term
            ? this.allProducts.filter(p =>
                p.sku.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term)
            )
            : this.allProducts;
        this.productCurrentPage = 1;
    }

    addProduct(product: ProductResponse): void {
        this.items.push({
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitMeasureSunat: product.unitMeasureCode ?? 'NIU',
            unitPrice: product.salePrice,
        });
        this.showProductModal = false;
        this.notify.success(`"${product.name}" agregado`, 'Producto agregado', 2500);
    }

    productPrevPage(): void { if (this.productCurrentPage > 1) this.productCurrentPage--; }
    productNextPage(): void { if (this.productCurrentPage < this.productTotalPages) this.productCurrentPage++; }

    // ============================
    // ÍTEM PERSONALIZADO MODAL
    // ============================
    openCustomItemModal(): void {
        this.showCustomItemModal = true;
        this.customDescription = '';
        this.customQuantity = 1;
        this.customUnitMeasure = 'NIU';
        this.customUnitPrice = 0;
    }

    submitCustomItem(): void {
        if (!this.customDescription.trim()) {
            this.notify.warning('La descripción es requerida');
            return;
        }
        if (!this.customQuantity || this.customQuantity <= 0) {
            this.notify.warning('La cantidad debe ser mayor a 0');
            return;
        }
        this.items.push({
            description: this.customDescription.trim(),
            quantity: this.customQuantity,
            unitMeasureSunat: this.customUnitMeasure || 'NIU',
            unitPrice: this.customUnitPrice || 0,
        });
        this.showCustomItemModal = false;
        this.notify.success(`"${this.customDescription.trim()}" agregado`, 'Ítem agregado', 2500);
    }

    removeItem(index: number): void {
        this.items.splice(index, 1);
    }

    // ============================
    // SUBMIT
    // ============================
    submitGuide(): void {
        if (!this.transferDate) {
            this.notify.warning('Debe ingresar la fecha de traslado', 'Validación');
            return;
        }
        if (!this.transferReason) {
            this.notify.warning('Debe seleccionar un motivo de traslado', 'Validación');
            return;
        }
        if (this.transferReason === 'OTROS' && !this.transferReasonDescription.trim()) {
            this.notify.warning('Debe ingresar la descripción del motivo', 'Validación');
            return;
        }
        if (!this.grossWeight || this.grossWeight <= 0) {
            this.notify.warning('El peso bruto debe ser mayor a 0', 'Validación');
            return;
        }
        if (!this.originAddress.trim()) {
            this.notify.warning('Debe ingresar la dirección de partida', 'Validación');
            return;
        }
        if (!this.originUbigeo.trim()) {
            this.notify.warning('Debe ingresar el ubigeo de partida', 'Validación');
            return;
        }
        if (!this.destinationAddress.trim()) {
            this.notify.warning('Debe ingresar la dirección de llegada', 'Validación');
            return;
        }
        if (!this.destinationUbigeo.trim()) {
            this.notify.warning('Debe ingresar el ubigeo de llegada', 'Validación');
            return;
        }
        if (!this.recipientDocNumber.trim()) {
            this.notify.warning('Debe ingresar el número de documento del destinatario', 'Validación');
            return;
        }
        if (!this.recipientName.trim()) {
            this.notify.warning('Debe ingresar el nombre del destinatario', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PUBLICO' && !this.carrierDocNumber.trim()) {
            this.notify.warning('Debe ingresar el documento del transportista', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PUBLICO' && !this.carrierName.trim()) {
            this.notify.warning('Debe ingresar la razón social del transportista', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PRIVADO' && this.drivers.length === 0) {
            this.notify.warning('Debe agregar al menos un conductor', 'Validación');
            return;
        }
        if (this.items.length === 0) {
            this.notify.warning('Debe agregar al menos un ítem', 'Validación');
            return;
        }

        this.isSubmitting = true;

        const request: RemissionGuideRequest = {
            transferDate: this.transferDate,
            transferReason: this.transferReason,
            transferReasonDescription: this.transferReasonDescription.trim() || undefined,
            transportMode: this.transportMode,
            grossWeight: this.grossWeight,
            weightUnit: this.weightUnit,
            packageCount: this.packageCount,
            minorVehicleTransfer: this.minorVehicleTransfer,
            observations: this.observations.trim() || undefined,
            originAddress: this.originAddress.trim(),
            originUbigeo: this.originUbigeo.trim(),
            destinationAddress: this.destinationAddress.trim(),
            destinationUbigeo: this.destinationUbigeo.trim(),
            recipientDocType: this.recipientDocType,
            recipientDocNumber: this.recipientDocNumber.trim(),
            recipientName: this.recipientName.trim(),
            recipientAddress: this.recipientAddress.trim() || undefined,
            carrierDocType: this.transportMode === 'TRANSPORTE_PUBLICO' ? this.carrierDocType : undefined,
            carrierDocNumber: this.transportMode === 'TRANSPORTE_PUBLICO' ? this.carrierDocNumber.trim() : undefined,
            carrierName: this.transportMode === 'TRANSPORTE_PUBLICO' ? this.carrierName.trim() : undefined,
            items: this.items,
            drivers: this.transportMode === 'TRANSPORTE_PRIVADO' ? this.drivers : undefined,
        };

        this.guideService.create(request).subscribe({
            next: () => {
                this.notify.success('Guía de remisión registrada correctamente', 'Éxito');
                this.resetForm();
                this.isSubmitting = false;
                this.onSaved.emit();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al registrar guía de remisión');
                this.isSubmitting = false;
            }
        });
    }

    // ============================
    // RESET / CLOSE
    // ============================
    resetForm(): void {
        this.transferDate = '';
        this.transferReason = '';
        this.transferReasonDescription = '';
        this.transportMode = 'TRANSPORTE_PUBLICO';
        this.grossWeight = 0;
        this.weightUnit = 'KGM';
        this.packageCount = 1;
        this.minorVehicleTransfer = false;
        this.observations = '';
        this.carrierDocType = 'RUC';
        this.carrierDocNumber = '';
        this.carrierName = '';
        this.drivers = [];
        this.recipientDocType = 'RUC';
        this.recipientDocNumber = '';
        this.recipientName = '';
        this.recipientAddress = '';
        this.originAddress = '';
        this.originUbigeo = '';
        this.destinationAddress = '';
        this.destinationUbigeo = '';
        this.items = [];
        this.isViewMode = false;
    }

    closeModal(): void {
        this.onClose.emit();
    }

    // ============================
    // HELPERS VISTA
    // ============================
    getTransferReasonLabel(reason: string): string {
        return this.transferReasonOptions.find(o => o.value === reason)?.label ?? reason;
    }

    getTransportModeLabel(mode: string): string {
        return mode === 'TRANSPORTE_PUBLICO' ? 'Transporte Público' : 'Transporte Privado';
    }
}
