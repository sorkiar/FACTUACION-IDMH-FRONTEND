import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { UbigeoPickerComponent } from '../../shared/components/form/ubigeo-picker/ubigeo-picker.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

import { ProductService } from '../../services/product.service';
import { RemissionGuideService } from '../../services/remission-guide.service';
import { UbigeoService } from '../../services/ubigeo.service';
import { RecipientService } from '../../services/recipient.service';

import { ProductResponse } from '../../dto/product.response';
import { QuickProductRegisterComponent } from '../sales/quick-product-register.component';
import { RecipientResponse } from '../../dto/recipient.response';
import { RemissionGuideResponse } from '../../dto/remission-guide.response';
import { RemissionGuideItemRequest } from '../../dto/remission-guide-item.request';
import { RemissionGuideDriverRequest } from '../../dto/remission-guide-driver.request';
import { RemissionGuideRequest } from '../../dto/remission-guide.request';
import { UbigeoResponse } from '../../dto/ubigeo.response';

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
        UbigeoPickerComponent,
        QuickProductRegisterComponent,
    ],
    templateUrl: './remission-guide-register.component.html',
})
export class RemissionGuideRegisterComponent implements OnInit, OnChanges {

    @Input() isOpen = false;
    @Input() selectedGuide?: RemissionGuideResponse;
    @Output() onClose = new EventEmitter<void>();
    @Output() onSaved = new EventEmitter<void>();

    isViewMode = false;
    isSubmitting = false;

    readonly todayStr: string = new Date().toISOString().split('T')[0];

    // ============================
    // UBIGEOS
    // ============================
    allUbigeos: UbigeoResponse[] = [];
    loadingUbigeos = false;

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
    // DESTINATARIO (maestro)
    // ============================
    selectedRecipient?: RecipientResponse;

    showRecipientModal = false;
    recipientSearchTerm = '';
    allRecipients: RecipientResponse[] = [];
    recipientResults: RecipientResponse[] = [];
    loadingRecipients = false;
    recipientCurrentPage = 1;
    readonly recipientPageSize = 5;

    get pagedRecipientResults(): RecipientResponse[] {
        const start = (this.recipientCurrentPage - 1) * this.recipientPageSize;
        return this.recipientResults.slice(start, start + this.recipientPageSize);
    }
    get recipientTotalPages(): number {
        return Math.max(1, Math.ceil(this.recipientResults.length / this.recipientPageSize));
    }
    get recipientPageEnd(): number {
        return Math.min(this.recipientCurrentPage * this.recipientPageSize, this.recipientResults.length);
    }

    // ============================
    // PUNTO DE PARTIDA
    // ============================
    private readonly defaultOriginAddress = 'CAL.ACUARIO NRO. 860 DPTO. 301 URB. MERCURIO LIMA - LIMA - LOS OLIVOS';
    private readonly defaultOriginUbigeo = '150117';

    originAddress = this.defaultOriginAddress;
    originUbigeo = this.defaultOriginUbigeo;

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

    showQuickProductRegister = false;

    onProductCreated(product: ProductResponse): void {
        this.showQuickProductRegister = false;
        this.allProducts = [product, ...this.allProducts];
        this.addProduct(product);
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
        private ubigeoService: UbigeoService,
        private recipientService: RecipientService,
        private notify: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadUbigeos();
    }

    private loadUbigeos(): void {
        this.loadingUbigeos = true;
        this.ubigeoService.listActive().subscribe({
            next: res => {
                this.allUbigeos = res.data ?? [];
                this.loadingUbigeos = false;
            },
            error: () => { this.loadingUbigeos = false; }
        });
    }

    getUbigeoLabel(code: string): string {
        if (!code) return '';
        const u = this.allUbigeos.find(u => u.ubigeo === code);
        if (u) return `${u.ubigeo} — ${u.department} / ${u.province} / ${u.distrit}`;
        return code;
    }

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
        this.carrierDocType = 'RUC';
        this.carrierDocNumber = guide.carrierDocNumber ?? '';
        this.carrierName = guide.carrierName ?? '';
        this.selectedRecipient = guide.recipient ?? undefined;
        this.originAddress = guide.originAddress;
        this.originUbigeo = guide.originUbigeo;
        this.destinationAddress = guide.destinationAddress;
        this.destinationUbigeo = guide.destinationUbigeo;
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
    // DESTINATARIO MODAL
    // ============================
    openRecipientModal(): void {
        this.showRecipientModal = true;
        this.recipientSearchTerm = '';
        this.recipientCurrentPage = 1;
        if (this.allRecipients.length === 0) {
            this.loadAllRecipients();
        } else {
            this.recipientResults = this.allRecipients;
        }
    }

    loadAllRecipients(): void {
        this.loadingRecipients = true;
        this.recipientService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allRecipients = res.data ?? [];
                this.recipientResults = this.allRecipients;
                this.loadingRecipients = false;
            },
            error: () => {
                this.allRecipients = [];
                this.recipientResults = [];
                this.loadingRecipients = false;
            }
        });
    }

    searchRecipients(): void {
        const term = this.recipientSearchTerm.trim().toLowerCase();
        this.recipientResults = term
            ? this.allRecipients.filter(r =>
                r.name.toLowerCase().includes(term) ||
                r.docNumber.toLowerCase().includes(term) ||
                r.docType.toLowerCase().includes(term)
            )
            : this.allRecipients;
        this.recipientCurrentPage = 1;
    }

    selectRecipient(r: RecipientResponse): void {
        this.selectedRecipient = r;
        this.showRecipientModal = false;
    }

    clearRecipient(): void {
        this.selectedRecipient = undefined;
    }

    recipientPrevPage(): void { if (this.recipientCurrentPage > 1) this.recipientCurrentPage--; }
    recipientNextPage(): void { if (this.recipientCurrentPage < this.recipientTotalPages) this.recipientCurrentPage++; }

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
            unitPrice: product.salePricePen ?? 0,
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
        if (!this.selectedRecipient) {
            this.notify.warning('Debe seleccionar un destinatario', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PUBLICO' && !this.carrierDocNumber.trim()) {
            this.notify.warning('Debe ingresar el documento del transportista', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PUBLICO' && this.carrierDocNumber.trim().length !== 11) {
            this.notify.warning('El RUC del transportista debe tener exactamente 11 dígitos', 'Validación');
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
        if (this.transportMode === 'TRANSPORTE_PRIVADO' && this.drivers.some(d => !/[a-zA-Z]/.test(d.licenseNumber) || !/[0-9]/.test(d.licenseNumber))) {
            this.notify.warning('El número de licencia de conducir debe contener al menos una letra y un número', 'Validación');
            return;
        }
        if (this.transportMode === 'TRANSPORTE_PRIVADO' && this.drivers.some(d => d.licenseNumber.trim().length > 10)) {
            this.notify.warning('El número de licencia de conducir no puede exceder los 10 caracteres', 'Validación');
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
            recipientId: this.selectedRecipient.id,
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
        this.selectedRecipient = undefined;
        this.originAddress = this.defaultOriginAddress;
        this.originUbigeo = this.defaultOriginUbigeo;
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
