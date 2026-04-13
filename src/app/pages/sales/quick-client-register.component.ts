import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { Option, SelectComponent } from '../../shared/components/form/select/select.component';
import { CheckboxComponent } from '../../shared/components/form/input/checkbox.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { UbigeoPickerComponent } from '../../shared/components/form/ubigeo-picker/ubigeo-picker.component';
import { ClientService } from '../../services/client.service';
import { DocumentTypeService } from '../../services/document-type.service';
import { DocumentLookupService } from '../../services/document-lookup.service';
import { UbigeoService } from '../../services/ubigeo.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { ClientRequest } from '../../dto/client.request';
import { ClientResponse } from '../../dto/client.response';
import { ClientAddressRequest } from '../../dto/client-address.request';
import { UbigeoResponse } from '../../dto/ubigeo.response';

@Component({
    selector: 'app-quick-client-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
        SelectComponent,
        CheckboxComponent,
        DatePickerComponent,
        UbigeoPickerComponent,
    ],
    templateUrl: './quick-client-register.component.html',
})
export class QuickClientRegisterComponent implements OnChanges {

    @Input() isOpen = false;
    @Input() title = 'Registrar nuevo cliente';
    @Input() subtitle = 'Completa los datos del cliente para registrarlo y seleccionarlo en la venta.';
    @Output() onClose = new EventEmitter<void>();
    @Output() onCreated = new EventEmitter<ClientResponse>();

    private sub = new Subscription();

    // Form state
    submitted = false;
    isSubmitting = false;
    isLookingUp = false;

    // Selects
    personTypeOptions: Option[] = [
        { value: '1', label: 'Natural' },
        { value: '2', label: 'Jurídica' },
    ];
    documentTypeOptions: Option[] = [];
    loadingDocumentTypes = false;
    disabledDocumentType = false;

    // Form model
    personTypeId = '1';
    documentTypeId = '';
    documentNumber = '';
    firstName = '';
    lastName = '';
    birthDate = '';
    businessName = '';
    contactPersonName = '';
    phone1 = '';
    phone2 = '';
    email1 = '';
    email2 = '';
    retentionAgent = false;

    // Ubigeos
    allUbigeos: UbigeoResponse[] = [];
    loadingUbigeos = false;

    // Addresses (create mode)
    createAddresses: { address: string; ubigeo: string; description: string }[] = [];
    newCreateAddrAddress = '';
    newCreateAddrUbigeo = '';
    newCreateAddrDescription = '';

    addCreateAddress(): void {
        const addr = this.newCreateAddrAddress.trim();
        if (!addr) return;
        this.createAddresses.push({
            address: addr,
            ubigeo: this.newCreateAddrUbigeo.trim(),
            description: this.newCreateAddrDescription.trim(),
        });
        this.newCreateAddrAddress = '';
        this.newCreateAddrUbigeo = '';
        this.newCreateAddrDescription = '';
    }

    removeCreateAddress(idx: number): void {
        this.createAddresses.splice(idx, 1);
    }

    constructor(
        private clientService: ClientService,
        private documentTypeService: DocumentTypeService,
        private documentLookupService: DocumentLookupService,
        private ubigeoService: UbigeoService,
        private notify: NotificationService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen) {
            this.reset();
            this.loadDocumentTypes(1);
            if (this.allUbigeos.length === 0) this.loadUbigeos();
        }
    }

    private loadUbigeos(): void {
        this.loadingUbigeos = true;
        const s = this.ubigeoService.listActive().subscribe({
            next: (res) => {
                this.allUbigeos = res?.data ?? [];
                this.loadingUbigeos = false;
            },
            error: () => { this.loadingUbigeos = false; },
        });
        this.sub.add(s);
    }

    isNaturalPerson(): boolean { return String(this.personTypeId) === '1'; }
    isLegalPerson(): boolean { return String(this.personTypeId) === '2'; }

    get isLegalPersonSelected(): boolean { return String(this.personTypeId) === '2'; }

    onPersonTypeChange(value: string): void {
        this.personTypeId = value;
        this.disabledDocumentType = this.isLegalPersonSelected;
        this.documentTypeId = '';
        if (!this.isLegalPersonSelected) this.retentionAgent = false;
        this.loadDocumentTypes(Number(this.personTypeId));
    }

    private loadDocumentTypes(personTypeId: number): void {
        this.loadingDocumentTypes = true;
        const s = this.documentTypeService.getAll(1, personTypeId).subscribe({
            next: (res) => {
                this.documentTypeOptions = (res?.data ?? []).map((dt: any) => ({
                    value: String(dt.id),
                    label: dt.name,
                }));
                this.documentTypeId = this.documentTypeOptions[0]?.value ?? '';
                this.loadingDocumentTypes = false;
            },
            error: () => {
                this.loadingDocumentTypes = false;
                this.documentTypeOptions = [];
            },
        });
        this.sub.add(s);
    }

    get lookupDocumentType(): 'DNI' | 'RUC' | null {
        const label = (this.documentTypeOptions.find(o => o.value === this.documentTypeId)?.label ?? '').toUpperCase();
        if (label === 'DNI') return 'DNI';
        if (label === 'RUC') return 'RUC';
        return null;
    }

    get canLookup(): boolean {
        const type = this.lookupDocumentType;
        if (type === 'DNI') return /^\d{8}$/.test(this.documentNumber);
        if (type === 'RUC') return /^\d{11}$/.test(this.documentNumber);
        return false;
    }

    lookupDocument(): void {
        if (!this.canLookup || this.isLookingUp) return;
        const type = this.lookupDocumentType;
        this.isLookingUp = true;

        if (type === 'DNI') {
            const s = this.documentLookupService.queryDni(this.documentNumber).subscribe({
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
        } else if (type === 'RUC') {
            const s = this.documentLookupService.queryRuc(this.documentNumber).subscribe({
                next: res => {
                    const d = res.data;
                    if (d) {
                        this.businessName = d.name ?? '';
                        if (d.isRetentionAgent != null) this.retentionAgent = d.isRetentionAgent;
                    }
                    this.isLookingUp = false;
                },
                error: err => {
                    this.notify.error(err?.error?.message ?? 'No se pudo consultar el RUC');
                    this.isLookingUp = false;
                },
            });
            this.sub.add(s);
        }
    }

    private isFormValid(): boolean {
        if (!this.personTypeId || !this.documentTypeId || !this.documentNumber) return false;
        if (this.isNaturalPerson() && (!this.firstName || !this.lastName)) return false;
        if (this.isLegalPerson() && !this.businessName) return false;
        if (!this.phone1 || !this.email1) return false;
        return true;
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;

        this.isSubmitting = true;
        const payload: ClientRequest = {
            personTypeId: Number(this.personTypeId),
            documentTypeId: Number(this.documentTypeId),
            documentNumber: this.documentNumber.trim(),
            firstName: this.isNaturalPerson() ? this.firstName.trim() : '',
            lastName: this.isNaturalPerson() ? this.lastName.trim() : '',
            birthDate: this.birthDate?.trim() ? this.birthDate as any : null as any,
            businessName: this.isLegalPerson() ? this.businessName.trim() : '',
            contactPersonName: this.isLegalPerson() ? this.contactPersonName.trim() : '',
            phone1: this.phone1.trim(),
            phone2: this.phone2.trim() || '',
            email1: this.email1.trim(),
            email2: this.email2.trim() || '',
            retentionAgent: this.retentionAgent,
            addresses: this.createAddresses.length > 0
                ? this.createAddresses.map(a => ({
                    address: a.address,
                    ubigeo: a.ubigeo || undefined,
                    description: a.description || undefined,
                } as ClientAddressRequest))
                : undefined,
        };

        const s = this.clientService.create(payload).subscribe({
            next: (res) => {
                this.isSubmitting = false;
                this.notify.success(res?.message ?? 'Cliente registrado correctamente');
                this.onCreated.emit(res.data!);
            },
            error: (err) => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo registrar el cliente.');
            },
        });
        this.sub.add(s);
    }

    close(): void {
        this.onClose.emit();
    }

    private reset(): void {
        this.submitted = false;
        this.isSubmitting = false;
        this.personTypeId = '1';
        this.documentTypeId = '';
        this.documentNumber = '';
        this.firstName = '';
        this.lastName = '';
        this.birthDate = '';
        this.businessName = '';
        this.contactPersonName = '';
        this.phone1 = '';
        this.phone2 = '';
        this.email1 = '';
        this.email2 = '';
        this.retentionAgent = false;
        this.disabledDocumentType = false;
        this.createAddresses = [];
        this.newCreateAddrAddress = '';
        this.newCreateAddrUbigeo = '';
        this.newCreateAddrDescription = '';
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
