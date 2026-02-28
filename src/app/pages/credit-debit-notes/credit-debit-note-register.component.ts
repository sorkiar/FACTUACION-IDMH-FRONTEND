import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { TextAreaComponent } from '../../shared/components/form/input/text-area.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { ServiceService } from '../../services/service.service';
import { CreditDebitNoteService } from '../../services/credit-debit-note.service';
import { CreditDebitNoteTypeService } from '../../services/credit-debit-note-type.service';
import { DocumentSeriesService } from '../../services/document-series.service';

import { SaleResponse } from '../../dto/sale.response';
import { ProductResponse } from '../../dto/product.response';
import { ServiceResponse } from '../../dto/service.response';
import { CreditDebitNoteResponse } from '../../dto/credit-debit-note.response';
import { CreditDebitNoteTypeResponse } from '../../dto/credit-debit-note-type.response';
import { CreditDebitNoteItemRequest } from '../../dto/credit-debit-note-item.request';
import { CreditDebitNoteRequest } from '../../dto/credit-debit-note.request';

@Component({
    selector: 'app-credit-debit-note-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DecimalPipe,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
        TextAreaComponent,
    ],
    templateUrl: './credit-debit-note-register.component.html',
})
export class CreditDebitNoteRegisterComponent implements OnChanges {

    // =============================
    // INPUTS / OUTPUTS
    // =============================
    @Input() isOpen = false;
    @Input() selectedNote?: CreditDebitNoteResponse;
    @Output() onClose = new EventEmitter<void>();
    @Output() onSaved = new EventEmitter<void>();

    // =============================
    // MODO VISTA
    // =============================
    isViewMode = false;

    // =============================
    // VENTA REFERENCIA
    // =============================
    selectedSale?: SaleResponse;
    saleSearchTerm = '';
    allSales: SaleResponse[] = [];
    saleResults: SaleResponse[] = [];
    showSaleModal = false;
    loadingSales = false;
    saleCurrentPage = 1;
    readonly salePageSize = 5;

    get pagedSaleResults(): SaleResponse[] {
        const start = (this.saleCurrentPage - 1) * this.salePageSize;
        return this.saleResults.slice(start, start + this.salePageSize);
    }
    get saleTotalPages(): number {
        return Math.max(1, Math.ceil(this.saleResults.length / this.salePageSize));
    }
    get salePageEnd(): number {
        return Math.min(this.saleCurrentPage * this.salePageSize, this.saleResults.length);
    }

    // =============================
    // TIPO DE NOTA
    // =============================
    noteTypes: CreditDebitNoteTypeResponse[] = [];
    selectedNoteType?: CreditDebitNoteTypeResponse;
    loadingNoteTypes = false;

    get noteTypeOptions(): { value: string; label: string }[] {
        return this.noteTypes.map(t => ({
            value: t.code,
            label: `${t.noteCategory === 'CREDITO' ? 'NC' : 'ND'} - ${t.name}`
        }));
    }

    selectedNoteTypeCode = '';

    // =============================
    // RAZÓN
    // =============================
    reason = '';

    // =============================
    // COMPROBANTE
    // =============================
    documentSeriesId: number = 0;
    documentSeries?: string;
    documentSequence?: number;
    loadingSeries = false;

    get formattedDocument(): string {
        if (this.loadingSeries) return 'Cargando...';
        if (!this.documentSeries || !this.documentSequence) return '';
        return `${this.documentSeries}-${this.documentSequence.toString().padStart(8, '0')}`;
    }

    // =============================
    // ITEMS
    // =============================
    items: CreditDebitNoteItemRequest[] = [];

    // =============================
    // PRODUCTOS
    // =============================
    productSearchTerm = '';
    allProducts: ProductResponse[] = [];
    productResults: ProductResponse[] = [];
    showProductModal = false;
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

    // =============================
    // SERVICIOS
    // =============================
    serviceSearchTerm = '';
    allServices: ServiceResponse[] = [];
    serviceResults: ServiceResponse[] = [];
    showServiceModal = false;
    loadingServices = false;
    serviceCurrentPage = 1;
    readonly servicePageSize = 5;

    get pagedServiceResults(): ServiceResponse[] {
        const start = (this.serviceCurrentPage - 1) * this.servicePageSize;
        return this.serviceResults.slice(start, start + this.servicePageSize);
    }
    get serviceTotalPages(): number {
        return Math.max(1, Math.ceil(this.serviceResults.length / this.servicePageSize));
    }
    get servicePageEnd(): number {
        return Math.min(this.serviceCurrentPage * this.servicePageSize, this.serviceResults.length);
    }

    // =============================
    // SERVICIO RÁPIDO
    // =============================
    showQuickServiceModal = false;
    quickServiceName = '';
    quickServicePrice: number = 0;

    // =============================
    // SUBMIT
    // =============================
    isSubmitting = false;

    constructor(
        private saleService: SaleService,
        private productService: ProductService,
        private serviceService: ServiceService,
        private noteService: CreditDebitNoteService,
        private noteTypeService: CreditDebitNoteTypeService,
        private documentSeriesService: DocumentSeriesService,
        private notify: NotificationService,
        private sanitizer: DomSanitizer
    ) { }

    // =========================================================
    // GETTERS — tipo de nota
    // =========================================================
    /** C01 y D02 cargan automáticamente los ítems del comprobante */
    get isAutoLoadType(): boolean {
        return this.selectedNoteTypeCode === 'C01' || this.selectedNoteTypeCode === 'D02';
    }

    /** C01 = anulación → ítems bloqueados; D02 → editables */
    get isItemsLocked(): boolean {
        return this.selectedNoteTypeCode === 'C01';
    }

    /** URL del PDF a previsualizar (comprobante original en creación, PDF de la NC/ND en vista) */
    get pdfPreviewUrl(): string | undefined {
        if (this.isViewMode) return this.selectedNote?.pdfUrl;
        return this.selectedSale?.document?.pdfUrl;
    }

    get safePdfUrl(): SafeResourceUrl | null {
        let url = this.pdfPreviewUrl;
        if (!url) return null;
        // Google Drive: /view → /preview para permitir embed en iframe
        if (url.includes('drive.google.com')) {
            url = url.replace(/\/view(\?.*)?$/, '/preview');
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // =========================================================
    // LIFECYCLE
    // =========================================================
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedNote']) {
            if (this.selectedNote && this.isOpen) {
                this.loadNoteForView(this.selectedNote);
            } else if (!this.selectedNote) {
                this.isViewMode = false;
            }
        } else if (changes['isOpen'] && this.isOpen && !this.selectedNote) {
            this.resetForm();
            this.loadNoteTypes();
        }
    }

    private loadNoteForView(note: CreditDebitNoteResponse): void {
        this.resetForm();
        this.isViewMode = true;

        this.reason = note.reason;
        this.selectedNoteTypeCode = note.creditDebitNoteType?.code ?? '';
        this.selectedNoteType = note.creditDebitNoteType;

        this.items = note.items.map(i => ({
            itemType: i.itemType as 'PRODUCTO' | 'SERVICIO' | 'PERSONALIZADO',
            productId: i.productId,
            serviceId: i.serviceId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercentage: i.discountPercentage
        }));
    }

    // =========================================================
    // TIPOS DE NOTA
    // =========================================================
    loadNoteTypes(): void {
        if (this.noteTypes.length > 0) return;
        this.loadingNoteTypes = true;
        this.noteTypeService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.noteTypes = res.data ?? [];
                this.loadingNoteTypes = false;
            },
            error: () => {
                this.loadingNoteTypes = false;
            }
        });
    }

    onNoteTypeChange(): void {
        const found = this.noteTypes.find(t => t.code === this.selectedNoteTypeCode);
        this.selectedNoteType = found;

        if (found && this.selectedSale) {
            this.previewCorrelativeById(this.getSeriesIdForNote());
        }

        if (this.isAutoLoadType && this.selectedSale) {
            this.loadItemsFromSale();
        } else if (!this.isAutoLoadType) {
            this.items = [];
        }
    }

    // =========================================================
    // SERIES
    // =========================================================
    private getSeriesIdForNote(): number {
        const isFactura = this.selectedSale?.document?.series?.startsWith('F') ?? false;
        const isNC = this.selectedNoteType?.noteCategory === 'CREDITO';
        if (isFactura) return isNC ? 4 : 6;
        return isNC ? 3 : 5;
    }

    previewCorrelativeById(seriesId: number): void {
        this.loadingSeries = true;
        this.documentSeriesService.getNextSequenceById(seriesId).subscribe({
            next: res => {
                this.documentSeriesId = res.data?.id ?? 0;
                this.documentSeries = res.data?.series;
                this.documentSequence = res.data?.sequence;
                this.loadingSeries = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo obtener correlativo');
                this.loadingSeries = false;
            }
        });
    }

    // =========================================================
    // VENTAS (referencia)
    // =========================================================
    openSaleModal(): void {
        this.showSaleModal = true;
        this.saleSearchTerm = '';
        this.saleCurrentPage = 1;
        if (this.allSales.length === 0) {
            this.loadAllSales();
        } else {
            this.saleResults = this.allSales;
        }
    }

    loadAllSales(): void {
        this.loadingSales = true;
        this.saleService.getAll().subscribe({
            next: res => {
                // Solo ventas emitidas (que tienen documento)
                this.allSales = (res.data ?? []).filter(s => !!s.document);
                this.saleResults = this.allSales;
                this.loadingSales = false;
            },
            error: () => {
                this.allSales = [];
                this.saleResults = [];
                this.loadingSales = false;
            }
        });
    }

    searchSales(): void {
        const term = this.saleSearchTerm.trim().toLowerCase();
        if (!term) {
            this.saleResults = this.allSales;
        } else {
            this.saleResults = this.allSales.filter(s =>
                s.document?.series?.toLowerCase().includes(term) ||
                s.document?.sequence?.toLowerCase().includes(term) ||
                s.client?.businessName?.toLowerCase().includes(term) ||
                s.client?.firstName?.toLowerCase().includes(term) ||
                s.client?.lastName?.toLowerCase().includes(term)
            );
        }
        this.saleCurrentPage = 1;
    }

    selectSale(sale: SaleResponse): void {
        this.selectedSale = sale;
        this.showSaleModal = false;
        this.saleSearchTerm = '';
        this.documentSeriesId = 0;
        this.documentSeries = undefined;
        this.documentSequence = undefined;
        if (this.selectedNoteType) {
            this.previewCorrelativeById(this.getSeriesIdForNote());
        }
        if (this.isAutoLoadType) {
            this.loadItemsFromSale();
        }
    }

    clearSale(): void {
        this.selectedSale = undefined;
        this.documentSeriesId = 0;
        this.documentSeries = undefined;
        this.documentSequence = undefined;
        if (this.isAutoLoadType) {
            this.items = [];
        }
    }

    private loadItemsFromSale(): void {
        if (!this.selectedSale) return;
        this.items = this.selectedSale.items.map(i => ({
            itemType: i.itemType as 'PRODUCTO' | 'SERVICIO' | 'PERSONALIZADO',
            productId:  i.productId  || undefined,
            serviceId:  i.serviceId  || undefined,
            description: i.description,
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            discountPercentage: i.discountPercentage,
        }));
    }

    getSaleDoc(sale: SaleResponse): string {
        if (!sale.document) return 'Sin comprobante';
        return `${sale.document.series}-${sale.document.sequence}`;
    }

    getClientName(sale: SaleResponse): string {
        if (!sale.client) return '-';
        if (sale.client.businessName) return sale.client.businessName;
        return `${sale.client.firstName} ${sale.client.lastName}`.trim();
    }

    salePrevPage(): void { if (this.saleCurrentPage > 1) this.saleCurrentPage--; }
    saleNextPage(): void { if (this.saleCurrentPage < this.saleTotalPages) this.saleCurrentPage++; }

    // =========================================================
    // PRODUCTOS
    // =========================================================
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
                this.allProducts = [];
                this.productResults = [];
                this.loadingProducts = false;
            }
        });
    }

    searchProducts(): void {
        const term = this.productSearchTerm.trim().toLowerCase();
        if (!term) {
            this.productResults = this.allProducts;
        } else {
            this.productResults = this.allProducts.filter(p =>
                p.sku.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term) ||
                (p.categoryName || '').toLowerCase().includes(term)
            );
        }
        this.productCurrentPage = 1;
    }

    addProduct(product: ProductResponse): void {
        this.items.push({
            itemType: 'PRODUCTO',
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: product.salePrice
        });
        this.showProductModal = false;
        this.notify.success(`"${product.name}" agregado`, 'Producto agregado', 2500);
    }

    productPrevPage(): void { if (this.productCurrentPage > 1) this.productCurrentPage--; }
    productNextPage(): void { if (this.productCurrentPage < this.productTotalPages) this.productCurrentPage++; }

    // =========================================================
    // SERVICIOS
    // =========================================================
    openServiceModal(): void {
        this.showServiceModal = true;
        this.serviceSearchTerm = '';
        this.serviceCurrentPage = 1;
        if (this.allServices.length === 0) {
            this.loadAllServices();
        } else {
            this.serviceResults = this.allServices;
        }
    }

    loadAllServices(): void {
        this.loadingServices = true;
        this.serviceService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allServices = res.data ?? [];
                this.serviceResults = this.allServices;
                this.loadingServices = false;
            },
            error: () => {
                this.allServices = [];
                this.serviceResults = [];
                this.loadingServices = false;
            }
        });
    }

    searchServices(): void {
        const term = this.serviceSearchTerm.trim().toLowerCase();
        if (!term) {
            this.serviceResults = this.allServices;
        } else {
            this.serviceResults = this.allServices.filter(s =>
                s.sku.toLowerCase().includes(term) ||
                s.name.toLowerCase().includes(term) ||
                (s.serviceCategoryName || '').toLowerCase().includes(term)
            );
        }
        this.serviceCurrentPage = 1;
    }

    addService(service: ServiceResponse): void {
        this.items.push({
            itemType: 'SERVICIO',
            serviceId: service.id,
            description: service.name,
            quantity: 1,
            unitPrice: service.price
        });
        this.showServiceModal = false;
        this.notify.success(`"${service.name}" agregado`, 'Servicio agregado', 2500);
    }

    servicePrevPage(): void { if (this.serviceCurrentPage > 1) this.serviceCurrentPage--; }
    serviceNextPage(): void { if (this.serviceCurrentPage < this.serviceTotalPages) this.serviceCurrentPage++; }

    // =========================================================
    // SERVICIO RÁPIDO
    // =========================================================
    openQuickServiceModal(): void {
        this.showQuickServiceModal = true;
        this.quickServiceName = '';
        this.quickServicePrice = 0;
    }

    submitQuickService(): void {
        if (!this.quickServiceName.trim()) {
            this.notify.warning('El nombre del servicio es requerido');
            return;
        }
        if (!this.quickServicePrice || this.quickServicePrice <= 0) {
            this.notify.warning('El precio debe ser mayor a 0');
            return;
        }
        this.items.push({
            itemType: 'PERSONALIZADO',
            description: this.quickServiceName.trim(),
            quantity: 1,
            unitPrice: this.quickServicePrice
        });
        this.showQuickServiceModal = false;
        this.notify.success(`"${this.quickServiceName.trim()}" agregado`, 'Servicio rápido agregado', 2500);
    }

    removeItem(index: number): void {
        this.items.splice(index, 1);
    }

    // =========================================================
    // TOTALES
    // =========================================================
    get total(): number {
        return this.items.reduce((sum, i) => {
            const discount = (i.discountPercentage || 0) / 100;
            return sum + (i.quantity * i.unitPrice * (1 - discount));
        }, 0);
    }

    get subtotal(): number {
        return this.total / 1.18;
    }

    get igv(): number {
        return this.total - this.subtotal;
    }

    // =========================================================
    // SUBMIT
    // =========================================================
    submitNote(): void {
        if (!this.selectedSale) {
            this.notify.warning('Debe seleccionar una venta de referencia', 'Validación');
            return;
        }
        if (!this.selectedSale.document) {
            this.notify.warning('La venta seleccionada no tiene comprobante emitido', 'Validación');
            return;
        }
        if (!this.selectedNoteTypeCode) {
            this.notify.warning('Debe seleccionar un tipo de nota', 'Validación');
            return;
        }
        if (!this.reason.trim()) {
            this.notify.warning('Debe ingresar un motivo', 'Validación');
            return;
        }
        if (this.items.length === 0) {
            this.notify.warning('Debe agregar al menos un item', 'Validación');
            return;
        }
        if (!this.documentSeriesId) {
            this.notify.warning('No se pudo obtener la serie del comprobante', 'Validación');
            return;
        }

        this.isSubmitting = true;

        const request: CreditDebitNoteRequest = {
            saleId: this.selectedSale.id,
            originalDocumentId: this.selectedSale.document.id,
            noteTypeCode: this.selectedNoteTypeCode,
            reason: this.reason.trim(),
            documentSeriesId: this.documentSeriesId,
            items: this.items
        };

        this.noteService.create(request).subscribe({
            next: () => {
                this.notify.success('Nota de crédito/débito registrada correctamente', 'Éxito');
                this.resetForm();
                this.isSubmitting = false;
                this.onSaved.emit();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al registrar nota');
                this.isSubmitting = false;
            }
        });
    }

    // =========================================================
    // RESET
    // =========================================================
    resetForm(): void {
        this.selectedSale = undefined;
        this.selectedNoteType = undefined;
        this.selectedNoteTypeCode = '';
        this.reason = '';
        this.items = [];
        this.documentSeriesId = 0;
        this.documentSeries = undefined;
        this.documentSequence = undefined;
        this.isViewMode = false;
    }

    closeModal(): void {
        this.onClose.emit();
    }
}
