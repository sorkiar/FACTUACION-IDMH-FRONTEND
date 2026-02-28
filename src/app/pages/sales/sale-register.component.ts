import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';

import { ClientService } from '../../services/client.service';
import { ProductService } from '../../services/product.service';
import { ServiceService } from '../../services/service.service';
import { SaleService } from '../../services/sale.service';

import { SaleRequest } from '../../dto/sale.request';
import { SaleItemRequest } from '../../dto/sale-item.request';
import { ClientResponse } from '../../dto/client.response';
import { ProductResponse } from '../../dto/product.response';
import { ServiceResponse } from '../../dto/service.response';
import { SaleResponse } from '../../dto/sale.response';
import { ModalComponent } from "../../shared/components/ui/modal/modal.component";
import { FileInputComponent } from "../../shared/components/form/input/file-input.component";
import { LabelComponent } from "../../shared/components/form/label/label.component";
import { InputFieldComponent } from "../../shared/components/form/input/input-field.component";
import { SelectComponent } from "../../shared/components/form/select/select.component";
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { DocumentSeriesService } from '../../services/document-series.service';

@Component({
    selector: 'app-sale-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DecimalPipe,
        ModalComponent,
        FileInputComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
    ],
    templateUrl: './sale-register.component.html',
})
export class SaleRegisterComponent implements OnChanges {

    // =============================
    // INPUTS / OUTPUTS
    // =============================
    @Input() isOpen = false;
    @Input() selectedSale?: SaleResponse;
    @Output() onClose = new EventEmitter<void>();
    @Output() onSaved = new EventEmitter<void>();

    // =============================
    // CLIENTE
    // =============================
    selectedClient?: ClientResponse;
    clientSearchTerm = '';
    allClients: ClientResponse[] = [];
    clientResults: ClientResponse[] = [];
    showClientModal = false;
    loadingClients = false;
    clientCurrentPage = 1;
    readonly clientPageSize = 5;

    get pagedClientResults(): ClientResponse[] {
        const start = (this.clientCurrentPage - 1) * this.clientPageSize;
        return this.clientResults.slice(start, start + this.clientPageSize);
    }

    get clientTotalPages(): number {
        return Math.max(1, Math.ceil(this.clientResults.length / this.clientPageSize));
    }

    get clientPageEnd(): number {
        return Math.min(this.clientCurrentPage * this.clientPageSize, this.clientResults.length);
    }

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
    // ITEMS
    // =============================
    items: SaleItemRequest[] = [];

    // =============================
    // PAGOS
    // =============================
    payments: {
        paymentMethodId: string;
        amountPaid: number;
        paymentReference: string;
        file?: File;
    }[] = [];

    paymentMethodOptions: { value: string; label: string }[] = [
        { value: '6', label: 'Efectivo' },
        { value: '7', label: 'Transferencia' },
        { value: '8', label: 'Tarjeta' },
        { value: '9', label: 'Yape/Plin' }
    ];

    // =============================
    // COMPROBANTE
    // =============================
    documentTypeCode: string = '03'; // 03 = BOLETA (default)
    documentSeriesId: number = 0;

    documentSeries?: string;
    documentSequence?: number;
    loadingSeries = false;
    documentTypeLocked = false;

    // =============================
    // MODO VISTA
    // =============================
    isViewMode = false;
    loadingDetail = false;

    isSubmitting = false;
    isGeneratingQuotation = false;

    constructor(
        private clientService: ClientService,
        private productService: ProductService,
        private serviceService: ServiceService,
        private saleService: SaleService,
        private documentSeriesService: DocumentSeriesService,
        private notify: NotificationService
    ) { }


    previewCorrelative(typeCode: string) {

        this.loadingSeries = true;

        this.documentSeriesService.getNextSequence(typeCode)
            .subscribe({
                next: res => {

                    this.documentSeriesId = res.data?.id ?? 0;
                    this.documentSeries = res.data?.series;
                    this.documentSequence = res.data?.sequence;

                    this.loadingSeries = false;
                },
                error: err => {
                    this.notify.error(
                        err?.error?.message ?? 'No se pudo obtener correlativo'
                    );
                    this.loadingSeries = false;
                }
            });
    }

    private applyDocumentTypeByClient(): void {

        if (!this.selectedClient) {
            this.documentTypeLocked = false;
            return;
        }

        if (Number(this.selectedClient.documentTypeId) === 2) {
            // RUC → FACTURA
            this.documentTypeCode = '01';
        } else {
            // DNI u otro → BOLETA
            this.documentTypeCode = '03';
        }

        this.documentTypeLocked = true;

        this.previewCorrelative(this.documentTypeCode);
    }

    onDocumentTypeChange() {
        if (!this.documentTypeCode) return;
        this.previewCorrelative(this.documentTypeCode);
    }

    get formattedDocument(): string {

        if (this.loadingSeries) {
            return 'Cargando...';
        }

        if (!this.documentSeries || !this.documentSequence) {
            return '';
        }

        return `${this.documentSeries}-${this.documentSequence
            .toString()
            .padStart(8, '0')}`;
    }

    // =========================================================
    // LIFECYCLE
    // =========================================================

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedSale']) {
            if (this.selectedSale && this.isOpen) {
                this.loadSaleForEdit(this.selectedSale);
            } else if (!this.selectedSale) {
                this.isViewMode = false;
            }
        } else if (changes['isOpen'] && this.isOpen && !this.selectedSale) {
            this.resetSale();

            this.previewCorrelative(this.documentTypeCode);
        }
    }

    private loadSaleForEdit(sale: SaleResponse): void {
        this.resetSale();
        this.isViewMode = sale.saleStatus !== 'BORRADOR';

        // Mapear items
        this.items = sale.items.map(i => ({
            itemType: i.itemType as 'PRODUCTO' | 'SERVICIO' | 'PERSONALIZADO',
            productId: i.productId,
            serviceId: i.serviceId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercentage: i.discountPercentage
        }));

        // Cargar cliente completo por ID
        this.loadingDetail = true;
        this.clientService.getAll({ id: sale.client.id }).subscribe({
            next: res => {
                this.selectedClient = res.data?.[0];
                this.applyDocumentTypeByClient();
                this.loadingDetail = false;
            },
            error: () => {
                // Fallback: construir cliente mínimo con los datos disponibles
                this.selectedClient = {
                    id: sale.client.id,
                    businessName: sale.client.businessName ? sale.client.businessName : sale.client.firstName + " " + sale.client.lastName,
                    documentType: '', documentNumber: '',
                    firstName: '', lastName: ''
                } as ClientResponse;
                this.loadingDetail = false;
            }
        });
    }

    // =========================================================
    // CLIENTES
    // =========================================================

    loadAllClients() {
        this.loadingClients = true;
        this.clientService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allClients = res.data ?? [];
                this.clientResults = this.allClients;
                this.loadingClients = false;
            },
            error: () => {
                this.allClients = [];
                this.clientResults = [];
                this.loadingClients = false;
            }
        });
    }

    searchClients() {
        const term = this.clientSearchTerm.trim().toLowerCase();

        if (!term) {
            this.clientResults = this.allClients;
        } else {
            // Filtrar en frontend por documento, nombre o razón social
            this.clientResults = this.allClients.filter(client => {
                const fullName = this.getClientFullName(client).toLowerCase();
                const doc = client.documentNumber.toLowerCase();
                const businessName = (client.businessName || '').toLowerCase();

                return doc.includes(term) || fullName.includes(term) || businessName.includes(term);
            });
        }

        // Reset a la primera página cuando cambia la búsqueda
        this.clientCurrentPage = 1;
    }

    getClientFullName(client: ClientResponse): string {
        if (client.firstName) {
            return `${client.firstName} ${client.lastName}`.trim();
        }
        return client.businessName || '';
    }

    getClientDisplay(client: ClientResponse): string {
        const name = this.getClientFullName(client);
        return `${client.documentType} - ${name}`;
    }

    openClientModal() {
        this.showClientModal = true;
        this.clientSearchTerm = '';
        this.clientCurrentPage = 1;
        if (this.allClients.length === 0) {
            this.loadAllClients();
        } else {
            this.clientResults = this.allClients;
        }
    }

    clientPrevPage() {
        if (this.clientCurrentPage > 1) this.clientCurrentPage--;
    }

    clientNextPage() {
        if (this.clientCurrentPage < this.clientTotalPages) this.clientCurrentPage++;
    }

    selectClient(client: ClientResponse) {
        this.selectedClient = client;
        this.showClientModal = false;
        this.clientSearchTerm = '';

        this.applyDocumentTypeByClient();
    }

    clearClient() {
        this.selectedClient = undefined;
    }

    // =========================================================
    // PRODUCTOS
    // =========================================================

    openProductModal() {
        this.showProductModal = true;
        this.productSearchTerm = '';
        this.productCurrentPage = 1;
        if (this.allProducts.length === 0) {
            this.loadAllProducts();
        } else {
            this.productResults = this.allProducts;
        }
    }

    loadAllProducts() {
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

    searchProducts() {
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

    addProduct(product: ProductResponse) {
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

    productPrevPage() { if (this.productCurrentPage > 1) this.productCurrentPage--; }
    productNextPage() { if (this.productCurrentPage < this.productTotalPages) this.productCurrentPage++; }

    // =========================================================
    // SERVICIOS
    // =========================================================

    openServiceModal() {
        this.showServiceModal = true;
        this.serviceSearchTerm = '';
        this.serviceCurrentPage = 1;
        if (this.allServices.length === 0) {
            this.loadAllServices();
        } else {
            this.serviceResults = this.allServices;
        }
    }

    loadAllServices() {
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

    searchServices() {
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

    addService(service: ServiceResponse) {
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

    servicePrevPage() { if (this.serviceCurrentPage > 1) this.serviceCurrentPage--; }
    serviceNextPage() { if (this.serviceCurrentPage < this.serviceTotalPages) this.serviceCurrentPage++; }

    // =========================================================
    // SERVICIO RÁPIDO
    // =========================================================

    openQuickServiceModal() {
        this.showQuickServiceModal = true;
        this.quickServiceName = '';
        this.quickServicePrice = 0;
    }

    submitQuickService() {
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

    addQuickService(name: string, price: number) {
        if (!name || !price) return;
        this.items.push({
            itemType: 'PERSONALIZADO',
            description: name,
            quantity: 1,
            unitPrice: price
        });
    }

    removeItem(index: number) {
        this.items.splice(index, 1);
    }

    // =========================================================
    // PAGOS
    // =========================================================

    addPayment() {
        this.payments.push({
            paymentMethodId: '6',
            amountPaid: 0,
            paymentReference: ''
        });
    }

    removePayment(index: number) {
        this.payments.splice(index, 1);
    }

    onPaymentFileChange(index: number, event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            this.payments[index].file = file;
        }
    }

    // =========================================================
    // TOTALES
    // =========================================================

    // TOTAL REAL = suma de los items
    get total(): number {
        return this.items.reduce((sum, i) => {
            const discount = (i.discountPercentage || 0) / 100;
            return sum + (i.quantity * i.unitPrice * (1 - discount));
        }, 0);
    }

    // Subtotal SIN IGV
    get subtotal(): number {
        return this.total / 1.18;
    }

    // IGV calculado desde el total
    get igv(): number {
        return this.total - this.subtotal;
    }

    get totalPaid(): number {
        return this.payments.reduce((sum, p) =>
            sum + Number(p.amountPaid || 0), 0
        );
    }

    get change(): number {
        return this.totalPaid - this.total;
    }

    // =========================================================
    // VALIDACIONES
    // =========================================================

    private validateBeforeSubmit(finalize: boolean): string | null {

        if (!this.selectedClient)
            return 'Debe seleccionar un cliente';

        if (this.items.length === 0)
            return 'Debe agregar al menos un item';

        if (finalize) {

            if (!this.documentSeriesId)
                return 'Debe seleccionar serie del comprobante';

            if (this.payments.length === 0)
                return 'Debe registrar al menos un pago';

            if (this.totalPaid < this.total)
                return 'El total pagado es menor al total de la venta';
        }

        return null;
    }

    // =========================================================
    // GENERATE QUOTATION
    // =========================================================

    onGenerateQuotation(): void {
        const error = this.validateBeforeSubmit(false);
        if (error) {
            this.notify.warning(error, 'Validación');
            return;
        }

        this.isGeneratingQuotation = true;

        const request: SaleRequest = {
            clientId: this.selectedClient!.id,
            items: this.items,
        };

        this.saleService.generateQuotation(request).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const client = this.selectedClient!;
                const clientName = client.businessName?.trim()
                    || `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
                a.download = `Cotización - ${clientName}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                this.isGeneratingQuotation = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al generar cotización');
                this.isGeneratingQuotation = false;
            }
        });
    }

    // =========================================================
    // SUBMIT
    // =========================================================

    submitSale(finalize: boolean) {

        const error = this.validateBeforeSubmit(finalize);
        if (error) {
            this.notify.warning(error, 'Validación');
            return;
        }

        this.isSubmitting = true;

        const request: SaleRequest = {
            clientId: this.selectedClient!.id,
            items: this.items,
            payments: [],
            draft: !finalize,
            documentSeriesId: finalize && this.documentSeriesId > 0 ? this.documentSeriesId : undefined
        };

        const paymentFiles: { proofKey: string; file: File }[] = [];

        this.payments.forEach((p, index) => {

            const payment: any = {
                paymentMethodId: Number(p.paymentMethodId),
                amountPaid: p.amountPaid,
                paymentReference: p.paymentReference
            };

            // Solo si no es efectivo y tiene archivo
            if (p.paymentMethodId !== '6' && p.file) {
                const proofKey = `proof_${index}_${Date.now()}`;
                payment.proofKey = proofKey;

                paymentFiles.push({
                    proofKey,
                    file: p.file
                });
            }

            request.payments?.push(payment);
        });

        this.saleService.create(request, paymentFiles)
            .subscribe({
                next: () => {
                    this.notify.success(
                        finalize ? 'Venta emitida correctamente' : 'Borrador guardado correctamente',
                        'Éxito'
                    );
                    this.resetSale();
                    this.isSubmitting = false;
                    this.onSaved.emit();
                },
                error: err => {
                    this.notify.error(err?.error?.message ?? 'Error al registrar venta');
                    this.isSubmitting = false;
                }
            });
    }

    // =========================================================
    // RESET
    // =========================================================

    resetSale() {
        this.selectedClient = undefined;
        this.items = [];
        this.payments = [];
        this.documentSeriesId = 0;
        this.isViewMode = false;
        this.loadingDetail = false;
        this.documentTypeLocked = false;
        this.documentTypeCode = '03';
    }

    getViewPaymentTotal(): number {
        return (this.selectedSale?.payments ?? []).reduce((sum, p) => sum + p.amountPaid, 0);
    }

    closeModal() {
        this.onClose.emit();
    }
}
