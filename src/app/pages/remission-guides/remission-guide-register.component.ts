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
import { ClientService } from '../../services/client.service';
import { CarrierService } from '../../services/carrier.service';
import { DriverService } from '../../services/driver.service';

import { ProductResponse } from '../../dto/product.response';
import { ClientResponse } from '../../dto/client.response';
import { CarrierResponse } from '../../dto/carrier.response';
import { DriverResponse } from '../../dto/driver.response';
import { RemissionGuideResponse } from '../../dto/remission-guide.response';
import { RemissionGuideItemRequest } from '../../dto/remission-guide-item.request';
import { RemissionGuideRequest } from '../../dto/remission-guide.request';
import { UbigeoResponse } from '../../dto/ubigeo.response';

import { QuickProductRegisterComponent } from '../sales/quick-product-register.component';
import { QuickClientRegisterComponent } from '../sales/quick-client-register.component';
import { QuickCarrierRegisterComponent } from './quick-carrier-register.component';
import { QuickDriverRegisterComponent } from './quick-driver-register.component';

interface DriverEntry {
    driver: DriverResponse;
    selectedVehicleId: number | null;
    vehiclePlate: string;
    loadingVehicles: boolean;
}

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
        QuickClientRegisterComponent,
        QuickCarrierRegisterComponent,
        QuickDriverRegisterComponent,
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
    // SELECT OPTIONS
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
    // PUNTO DE PARTIDA / LLEGADA
    // ============================
    private readonly defaultOriginAddress = 'CAL.ACUARIO NRO. 860 DPTO. 301 URB. MERCURIO LIMA - LIMA - LOS OLIVOS';
    private readonly defaultOriginUbigeo = '150117';

    originAddress = this.defaultOriginAddress;
    originUbigeo = this.defaultOriginUbigeo;
    destinationAddress = '';
    destinationUbigeo = '';

    // ============================
    // CLIENTE (DESTINATARIO)
    // ============================
    selectedClient?: ClientResponse;
    clientAddress = '';
    selectedClientAddressId: number | null = null;

    showClientModal = false;
    clientSearchTerm = '';
    allClients: ClientResponse[] = [];
    clientResults: ClientResponse[] = [];
    loadingClients = false;
    clientCurrentPage = 1;
    readonly clientPageSize = 5;

    showQuickClientRegister = false;

    get pagedClientResults(): ClientResponse[] {
        const start = (this.clientCurrentPage - 1) * this.clientPageSize;
        return this.clientResults.slice(start, start + this.clientPageSize);
    }
    get clientTotalPages(): number {
        return Math.max(1, Math.ceil(this.clientResults.length / this.clientPageSize));
    }

    openClientModal(): void {
        this.showClientModal = true;
        this.clientSearchTerm = '';
        this.clientCurrentPage = 1;
        if (this.allClients.length === 0) {
            this.loadAllClients();
        } else {
            this.clientResults = this.allClients;
        }
    }

    loadAllClients(): void {
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

    searchClients(): void {
        const term = this.clientSearchTerm.trim().toLowerCase();
        this.clientResults = term
            ? this.allClients.filter(c => {
                const name = c.businessName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                const doc = `${c.documentType ?? ''} ${c.documentNumber ?? ''}`.trim();
                return name.toLowerCase().includes(term) || doc.toLowerCase().includes(term)
                    || (c.phone1 ?? '').includes(term) || (c.email1 ?? '').toLowerCase().includes(term);
            })
            : this.allClients;
        this.clientCurrentPage = 1;
    }

    selectClient(c: ClientResponse): void {
        this.selectedClient = c;
        this.showClientModal = false;
        this.clientAddress = '';
        this.selectedClientAddressId = null;
        this.destinationAddress = '';
        this.destinationUbigeo = '';
        if (c.addresses && c.addresses.length > 0) {
            this.selectClientAddress(c.addresses[0].id, c.addresses[0].address, c.addresses[0].ubigeo);
        }
    }

    clearClient(): void {
        this.selectedClient = undefined;
        this.clientAddress = '';
        this.selectedClientAddressId = null;
        this.destinationAddress = '';
        this.destinationUbigeo = '';
    }

    selectClientAddress(id: number, address: string, ubigeo?: string): void {
        this.selectedClientAddressId = id;
        this.clientAddress = address;
        this.destinationAddress = address;
        this.destinationUbigeo = ubigeo ?? '';
    }

    selectOtherAddress(): void {
        this.selectedClientAddressId = null;
        this.clientAddress = '';
        this.destinationAddress = '';
        this.destinationUbigeo = '';
    }

    onDestinationAddressChange(value: string): void {
        this.destinationAddress = value;
        this.clientAddress = value;
    }

    clientPrevPage(): void { if (this.clientCurrentPage > 1) this.clientCurrentPage--; }
    clientNextPage(): void { if (this.clientCurrentPage < this.clientTotalPages) this.clientCurrentPage++; }

    onClientCreated(client: ClientResponse): void {
        this.showQuickClientRegister = false;
        this.allClients = [client, ...this.allClients];
        this.selectClient(client);
        this.showClientModal = false;
    }

    // ============================
    // TRANSPORTISTA (PÚBLICO)
    // ============================
    selectedCarrier?: CarrierResponse;

    showCarrierModal = false;
    carrierSearchTerm = '';
    allCarriers: CarrierResponse[] = [];
    carrierResults: CarrierResponse[] = [];
    loadingCarriers = false;
    carrierCurrentPage = 1;
    readonly carrierPageSize = 5;

    showQuickCarrierRegister = false;

    get pagedCarrierResults(): CarrierResponse[] {
        const start = (this.carrierCurrentPage - 1) * this.carrierPageSize;
        return this.carrierResults.slice(start, start + this.carrierPageSize);
    }
    get carrierTotalPages(): number {
        return Math.max(1, Math.ceil(this.carrierResults.length / this.carrierPageSize));
    }

    openCarrierModal(): void {
        this.showCarrierModal = true;
        this.carrierSearchTerm = '';
        this.carrierCurrentPage = 1;
        if (this.allCarriers.length === 0) {
            this.loadAllCarriers();
        } else {
            this.carrierResults = this.allCarriers;
        }
    }

    loadAllCarriers(): void {
        this.loadingCarriers = true;
        this.carrierService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allCarriers = res.data ?? [];
                this.carrierResults = this.allCarriers;
                this.loadingCarriers = false;
            },
            error: () => {
                this.allCarriers = [];
                this.carrierResults = [];
                this.loadingCarriers = false;
            }
        });
    }

    searchCarriers(): void {
        const term = this.carrierSearchTerm.trim().toLowerCase();
        this.carrierResults = term
            ? this.allCarriers.filter(c =>
                c.businessName.toLowerCase().includes(term) ||
                c.docNumber.toLowerCase().includes(term)
            )
            : this.allCarriers;
        this.carrierCurrentPage = 1;
    }

    selectCarrier(c: CarrierResponse): void {
        this.selectedCarrier = c;
        this.showCarrierModal = false;
    }

    clearCarrier(): void {
        this.selectedCarrier = undefined;
    }

    carrierPrevPage(): void { if (this.carrierCurrentPage > 1) this.carrierCurrentPage--; }
    carrierNextPage(): void { if (this.carrierCurrentPage < this.carrierTotalPages) this.carrierCurrentPage++; }

    onCarrierCreated(carrier: CarrierResponse): void {
        this.showQuickCarrierRegister = false;
        this.allCarriers = [carrier, ...this.allCarriers];
        this.selectCarrier(carrier);
        this.showCarrierModal = false;
    }

    // ============================
    // CONDUCTORES (PRIVADO)
    // ============================
    selectedDriverEntries: DriverEntry[] = [];

    showDriverModal = false;
    driverSearchTerm = '';
    allDrivers: DriverResponse[] = [];
    driverResults: DriverResponse[] = [];
    loadingDrivers = false;
    driverCurrentPage = 1;
    readonly driverPageSize = 5;

    showQuickDriverRegister = false;

    get pagedDriverResults(): DriverResponse[] {
        const start = (this.driverCurrentPage - 1) * this.driverPageSize;
        return this.driverResults.slice(start, start + this.driverPageSize);
    }
    get driverTotalPages(): number {
        return Math.max(1, Math.ceil(this.driverResults.length / this.driverPageSize));
    }

    openDriverModal(): void {
        this.showDriverModal = true;
        this.driverSearchTerm = '';
        this.driverCurrentPage = 1;
        if (this.allDrivers.length === 0) {
            this.loadAllDrivers();
        } else {
            this.driverResults = this.allDrivers;
        }
    }

    loadAllDrivers(): void {
        this.loadingDrivers = true;
        this.driverService.getAll({ status: 1 }).subscribe({
            next: res => {
                this.allDrivers = res.data ?? [];
                this.driverResults = this.allDrivers;
                this.loadingDrivers = false;
            },
            error: () => {
                this.allDrivers = [];
                this.driverResults = [];
                this.loadingDrivers = false;
            }
        });
    }

    searchDrivers(): void {
        const term = this.driverSearchTerm.trim().toLowerCase();
        this.driverResults = term
            ? this.allDrivers.filter(d => {
                const name = `${d.firstName} ${d.lastName}`.toLowerCase();
                return name.includes(term) || d.docNumber.toLowerCase().includes(term)
                    || d.licenseNumber.toLowerCase().includes(term);
            })
            : this.allDrivers;
        this.driverCurrentPage = 1;
    }

    addDriverFromMaster(driver: DriverResponse): void {
        const alreadyAdded = this.selectedDriverEntries.some(e => e.driver.id === driver.id);
        if (alreadyAdded) {
            this.notify.warning(`${driver.firstName} ${driver.lastName} ya fue agregado`);
            return;
        }

        const entry: DriverEntry = {
            driver,
            selectedVehicleId: null,
            vehiclePlate: '',
            loadingVehicles: true,
        };
        this.selectedDriverEntries.push(entry);
        this.showDriverModal = false;

        // Load vehicle plates via findById
        this.driverService.findById(driver.id).subscribe({
            next: res => {
                const full = res.data;
                if (full) {
                    entry.driver = full;
                    if (full.vehicles && full.vehicles.length > 0) {
                        entry.selectedVehicleId = full.vehicles[0].id;
                        entry.vehiclePlate = full.vehicles[0].plate;
                    }
                }
                entry.loadingVehicles = false;
            },
            error: () => { entry.loadingVehicles = false; }
        });
    }

    removeDriverEntry(index: number): void {
        this.selectedDriverEntries.splice(index, 1);
    }

    selectDriverVehicle(entry: DriverEntry, vehicleId: number, plate: string): void {
        entry.selectedVehicleId = vehicleId;
        entry.vehiclePlate = plate;
    }

    selectOtherDriverPlate(entry: DriverEntry): void {
        entry.selectedVehicleId = null;
        entry.vehiclePlate = '';
    }

    onDriverVehiclePlateChange(entry: DriverEntry, value: string): void {
        entry.vehiclePlate = value;
        if (entry.selectedVehicleId !== null) {
            const registered = entry.driver.vehicles?.find(v => v.id === entry.selectedVehicleId);
            if (registered && value !== registered.plate) {
                entry.selectedVehicleId = null;
            }
        }
    }

    isDriverAdded(driverId: number): boolean {
        return this.selectedDriverEntries.some(e => e.driver.id === driverId);
    }

    driverPrevPage(): void { if (this.driverCurrentPage > 1) this.driverCurrentPage--; }
    driverNextPage(): void { if (this.driverCurrentPage < this.driverTotalPages) this.driverCurrentPage++; }

    onDriverCreated(driver: DriverResponse): void {
        this.showQuickDriverRegister = false;
        this.allDrivers = [driver, ...this.allDrivers];
        this.addDriverFromMaster(driver);
    }

    // ============================
    // ÍTEMS
    // ============================
    items: RemissionGuideItemRequest[] = [];

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

    showQuickProductRegister = false;

    onProductCreated(product: ProductResponse): void {
        this.showQuickProductRegister = false;
        this.allProducts = [product, ...this.allProducts];
        this.addProduct(product);
    }

    showCustomItemModal = false;
    customDescription = '';
    customQuantity: number = 1;
    customUnitMeasure = 'NIU';
    customUnitPrice: number = 0;

    constructor(
        private guideService: RemissionGuideService,
        private productService: ProductService,
        private ubigeoService: UbigeoService,
        private clientService: ClientService,
        private carrierService: CarrierService,
        private driverService: DriverService,
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
        this.selectedClient = guide.client ?? undefined;
        this.clientAddress = guide.clientAddress ?? '';
        this.selectedClientAddressId = guide.selectedClientAddress?.id ?? null;
        this.selectedCarrier = guide.carrier ?? undefined;
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
        this.selectedDriverEntries = (guide.drivers ?? []).map(d => ({
            driver: { ...d.driver, vehicles: d.driverVehicle ? [d.driverVehicle] : [] },
            selectedVehicleId: d.driverVehicle?.id ?? null,
            vehiclePlate: d.driverVehicle?.plate ?? '',
            loadingVehicles: false,
        }));
    }

    onTransferDateChange(event: { dateStr: string }): void {
        this.transferDate = event.dateStr;
    }

    onTransportModeChange(): void {
        if (this.transportMode === 'TRANSPORTE_PUBLICO') {
            this.selectedDriverEntries = [];
        } else {
            this.selectedCarrier = undefined;
        }
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
            error: () => { this.loadingProducts = false; }
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
    // ÍTEM PERSONALIZADO
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
        if (!this.transferDate) { this.notify.warning('Debe ingresar la fecha de traslado', 'Validación'); return; }
        if (!this.transferReason) { this.notify.warning('Debe seleccionar un motivo de traslado', 'Validación'); return; }
        if (this.transferReason === 'OTROS' && !this.transferReasonDescription.trim()) {
            this.notify.warning('Debe ingresar la descripción del motivo', 'Validación'); return;
        }
        if (!this.grossWeight || this.grossWeight <= 0) { this.notify.warning('El peso bruto debe ser mayor a 0', 'Validación'); return; }
        if (!this.originAddress.trim()) { this.notify.warning('Debe ingresar la dirección de partida', 'Validación'); return; }
        if (!this.originUbigeo.trim()) { this.notify.warning('Debe ingresar el ubigeo de partida', 'Validación'); return; }
        if (!this.destinationAddress.trim()) { this.notify.warning('Debe ingresar la dirección de llegada', 'Validación'); return; }
        if (!this.destinationUbigeo.trim()) { this.notify.warning('Debe ingresar el ubigeo de llegada', 'Validación'); return; }
        if (!this.selectedClient) { this.notify.warning('Debe seleccionar un destinatario', 'Validación'); return; }
        if (!this.clientAddress.trim()) { this.notify.warning('Debe consignar la dirección del destinatario', 'Validación'); return; }
        if (this.transportMode === 'TRANSPORTE_PUBLICO' && !this.selectedCarrier) {
            this.notify.warning('Debe seleccionar un transportista', 'Validación'); return;
        }
        if (this.transportMode === 'TRANSPORTE_PRIVADO' && this.selectedDriverEntries.length === 0) {
            this.notify.warning('Debe agregar al menos un conductor', 'Validación'); return;
        }
        if (this.transportMode === 'TRANSPORTE_PRIVADO' && this.selectedDriverEntries.some(e => !e.vehiclePlate.trim())) {
            this.notify.warning('Todos los conductores deben tener una placa asignada', 'Validación'); return;
        }
        if (this.items.length === 0) { this.notify.warning('Debe agregar al menos un ítem', 'Validación'); return; }

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
            clientId: this.selectedClient!.id,
            clientAddress: this.clientAddress.trim(),
            clientAddressId: this.selectedClientAddressId ?? undefined,
            carrierId: this.transportMode === 'TRANSPORTE_PUBLICO' ? this.selectedCarrier!.id : undefined,
            items: this.items,
            drivers: this.transportMode === 'TRANSPORTE_PRIVADO'
                ? this.selectedDriverEntries.map(e => ({
                    driverId: e.driver.id,
                    vehicleId: e.selectedVehicleId ?? undefined,
                    vehiclePlate: e.vehiclePlate.trim() || undefined,
                }))
                : undefined,
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
        this.selectedClient = undefined;
        this.clientAddress = '';
        this.selectedClientAddressId = null;
        this.selectedCarrier = undefined;
        this.selectedDriverEntries = [];
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

    getClientName(c: ClientResponse): string {
        return c.businessName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    }
}
