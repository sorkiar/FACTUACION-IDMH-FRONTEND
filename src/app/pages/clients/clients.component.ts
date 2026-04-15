import { ClientResponse } from './../../dto/client.response';
import { ClientFilter } from './../../dto/client.filter';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ClientService } from '../../services/client.service';
import { ModalComponent } from "../../shared/components/ui/modal/modal.component";
import { LabelComponent } from "../../shared/components/form/label/label.component";
import { Option, SelectComponent } from "../../shared/components/form/select/select.component";
import { InputFieldComponent } from "../../shared/components/form/input/input-field.component";
import { DocumentTypeService } from '../../services/document-type.service';
import { DocumentLookupService } from '../../services/document-lookup.service';
import { ClientRequest } from '../../dto/client.request';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { CheckboxComponent } from '../../shared/components/form/input/checkbox.component';
import { ClientAddressResponse } from '../../dto/client-address.response';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { UbigeoPickerComponent } from '../../shared/components/form/ubigeo-picker/ubigeo-picker.component';
import { PhonePickerComponent } from '../../shared/components/form/phone-picker/phone-picker.component';
import { UbigeoService } from '../../services/ubigeo.service';
import { UbigeoResponse } from '../../dto/ubigeo.response';
import countriesData from '../../services/utils/countries.json';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    NgClass,
    BadgeComponent,
    ModalComponent,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    CheckboxComponent,
    DatePickerComponent,
    UbigeoPickerComponent,
    PhonePickerComponent,
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent implements OnInit, OnDestroy {
  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  readonly pageSizeOptions = [5, 10, 15, 20, 50];

  // Sort
  sortColumn = '';
  sortDir: 'asc' | 'desc' = 'asc';

  // UI states
  loading = false;
  loadingTable = false;
  errorMessage: string | null = null;

  // Filters
  filters: ClientFilter = {};

  searchTerm = '';

  clients: ClientResponse[] = [];

  private sub = new Subscription();

  showForm = false;
  isEditMode = false;
  selectedClient?: ClientResponse;

  isLookingUp = false;

  // Ubigeos for address picker
  allUbigeos: UbigeoResponse[] = [];
  loadingUbigeos = false;

  // Countries for phone picker
  readonly countries = countriesData as { phoneCode: string; maxLength: number }[];

  getPhoneMaxLength(code: string): number {
    return this.countries.find(c => c.phoneCode === code)?.maxLength ?? 15;
  }

  constructor(
    private clientService: ClientService,
    private documentTypeService: DocumentTypeService,
    private documentLookupService: DocumentLookupService,
    private ubigeoService: UbigeoService,
    private notify: NotificationService,
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadUbigeos();
  }

  private loadUbigeos(): void {
    this.loadingUbigeos = true;
    this.ubigeoService.listActive().subscribe({
      next: res => { this.allUbigeos = res.data ?? []; this.loadingUbigeos = false; },
      error: () => { this.loadingUbigeos = false; },
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadClients(): void {
    this.loading = true;
    this.loadingTable = true;
    this.errorMessage = null;

    const s = this.clientService.getAll(this.filters).subscribe({
      next: (res) => {
        this.clients = res?.data ?? [];
        this.currentPage = 1;
        this.loading = false;
        this.loadingTable = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadingTable = false;
        this.clients = [];
        this.notify.error(err?.error?.message ?? 'Ocurrió un error al listar clientes.');
      },
    });

    this.sub.add(s);
  }

  setSearchTerm(value: string): void {
    this.searchTerm = (value ?? '').trim().toLowerCase();
    this.currentPage = 1;
  }

  private matchesSearch(c: ClientResponse): boolean {
    if (!this.searchTerm) return true;
    const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    const doc = `${c.documentType ?? ''} ${c.documentNumber ?? ''}`.trim();
    return (
      fullName.toLowerCase().includes(this.searchTerm) ||
      (c.businessName ?? '').toLowerCase().includes(this.searchTerm) ||
      doc.toLowerCase().includes(this.searchTerm) ||
      (c.phone1 ?? '').toLowerCase().includes(this.searchTerm) ||
      (c.email1 ?? '').toLowerCase().includes(this.searchTerm)
    );
  }

  get filteredClients(): ClientResponse[] {
    let list = (this.clients ?? []).filter((c) => this.matchesSearch(c));
    if (this.sortColumn === 'nombre') {
      list = [...list].sort((a, b) => {
        const va = a.businessName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
        const vb = b.businessName || `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim();
        return this.sortDir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
      });
    }
    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.itemsPerPage));
  }

  get currentItems(): ClientResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredClients.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDir = 'asc';
    }
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  getBadgeColor(status: number): 'success' | 'warning' | 'error' {
    if (status === 1) return 'success';
    if (status === 0) return 'error';
    return 'warning';
  }

  getBadgeText(status: number): 'Activo' | 'Inactivo' | 'Error' {
    if (status === 1) return 'Activo';
    if (status === 0) return 'Inactivo';
    return 'Error';
  }

  onCreateClient(): void {
    this.isEditMode = false;
    this.selectedClient = undefined;
    this.resetClientForm();
    this.disabledDocumentType = this.isLegalPersonSelected;
    this.loadDocumentTypes(Number(this.personTypeId));
    this.showForm = true;
  }

  onEditClient(client: ClientResponse): void {
    this.isEditMode = true;
    this.selectedClient = client;
    this.resetClientForm();
    this.patchClientToForm(client);
    this.disabledDocumentType = this.isLegalPersonSelected;
    this.loadDocumentTypes(Number(this.personTypeId), this.documentTypeId);
    this.addresses = client.addresses ? [...client.addresses] : [];
    this.showForm = true;
  }

  onCloseForm(): void {
    this.showForm = false;
    this.submittedClient = false;
  }

  // ===== Confirm modal (toggle status) =====
  showConfirmToggle = false;
  toggleTarget?: ClientResponse;
  isToggleStatus = false;

  openToggleConfirm(client: ClientResponse): void {
    this.toggleTarget = client;
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

  get toggleConfirmText(): string {
    if (!this.toggleTarget) return '';
    const action = this.toggleTarget.status === 1 ? 'inactivar' : 'activar';
    const name =
      this.toggleTarget.personType === 'Jurídica'
        ? (this.toggleTarget.businessName ?? 'este cliente')
        : `${this.toggleTarget.firstName ?? ''} ${this.toggleTarget.lastName ?? ''}`.trim() || 'este cliente';
    return `¿Deseas ${action} a ${name}?`;
  }

  confirmToggleStatus(): void {
    if (!this.toggleTarget) return;
    this.isToggleStatus = true;
    const client = this.toggleTarget;
    const newStatus = client.status === 1 ? 0 : 1;

    const s = this.clientService.updateStatus(client.id, newStatus).subscribe({
      next: (res) => {
        this.notify.success(res?.message ?? 'Estado actualizado');
        this.closeToggleConfirm();
        this.loadClients();
        this.isToggleStatus = false;
      },
      error: (err) => {
        this.notify.error(err?.error?.message ?? 'No se pudo actualizar el estado del cliente.');
        this.isToggleStatus = false;
      },
    });

    this.sub.add(s);
  }

  onSubmitClient(): void {
    this.submittedClient = true;
    if (!this.isClientFormValid()) return;

    this.isSubmittingClient = true;
    const normalizedBirthDate = this.birthDate?.trim() ? this.birthDate : null;

    const payload: ClientRequest = {
      personTypeId: Number(this.personTypeId),
      documentTypeId: Number(this.documentTypeId),
      documentNumber: this.documentNumber?.trim(),
      firstName: this.isNaturalPerson() ? this.firstName?.trim() : '',
      lastName: this.isNaturalPerson() ? this.lastName?.trim() : '',
      birthDate: normalizedBirthDate as any,
      businessName: this.isLegalPerson() ? this.businessName?.trim() : '',
      contactPersonName: this.isLegalPerson() ? this.contactPersonName?.trim() : '',
      countryCode1: this.phone1?.trim() ? this.countryCode1 : undefined,
      phone1: this.phone1?.trim(),
      countryCode2: this.phone2?.trim() ? this.countryCode2 : undefined,
      phone2: this.phone2?.trim() || undefined,
      email1: this.email1?.trim() || undefined,
      email2: this.email2?.trim() || undefined,
      retentionAgent: this.retentionAgent,
      addresses: !this.isEditMode && this.createAddresses.length > 0
        ? this.createAddresses.map(a => ({
            address: a.address,
            ubigeo: a.ubigeo || undefined,
            description: a.description || undefined,
          }))
        : undefined,
    };

    const request$ =
      this.isEditMode && this.selectedClient?.id
        ? this.clientService.update(this.selectedClient.id, payload)
        : this.clientService.create(payload);

    const s = request$.subscribe({
      next: (res) => {
        this.isSubmittingClient = false;
        this.showForm = false;
        this.resetClientForm();
        this.loadClients();
        this.notify.success(res?.message ?? 'Guardado correctamente');
      },
      error: (err) => {
        this.isSubmittingClient = false;
        this.notify.error(err?.error?.message ?? 'No se pudo guardar el cliente.');
      },
    });

    this.sub.add(s);
  }

  // ====== UI form state ======
  submittedClient = false;
  isSubmittingClient = false;

  documentTypeOptions: Option[] = [];
  personTypeOptions: Option[] = [
    { value: '1', label: 'Natural' },
    { value: '2', label: 'Jurídica' },
  ];

  // Form model
  personTypeId = '1';
  documentTypeId = '';
  documentNumber = '';
  firstName = '';
  lastName = '';
  birthDate = '';
  businessName = '';
  contactPersonName = '';
  countryCode1 = '51';
  phone1 = '';
  countryCode2 = '51';
  phone2 = '';
  email1 = '';
  email2 = '';
  retentionAgent = false;

  loadingDocumentTypes = false;

  private loadDocumentTypes(personTypeId: number, selectedId?: string): void {
    this.loadingDocumentTypes = true;

    const s = this.documentTypeService.getAll(1, personTypeId).subscribe({
      next: (res) => {
        this.documentTypeOptions = (res?.data ?? []).map((dt: any) => ({
          value: String(dt.id),
          label: dt.name,
        }));

        const exists = selectedId && this.documentTypeOptions.some(o => o.value === String(selectedId));
        this.documentTypeId = exists ? String(selectedId) : (this.documentTypeOptions[0]?.value ?? '');
        this.loadingDocumentTypes = false;
      },
      error: () => {
        this.loadingDocumentTypes = false;
        this.documentTypeOptions = [];
      },
    });

    this.sub.add(s);
  }

  isNaturalPerson(): boolean { return String(this.personTypeId) === '1'; }
  isLegalPerson(): boolean { return String(this.personTypeId) === '2'; }

  private resetClientForm(): void {
    this.submittedClient = false;
    this.isSubmittingClient = false;
    this.personTypeId = '1';
    this.documentTypeId = '';
    this.documentNumber = '';
    this.firstName = '';
    this.lastName = '';
    this.birthDate = '';
    this.businessName = '';
    this.contactPersonName = '';
    this.countryCode1 = '51';
    this.phone1 = '';
    this.countryCode2 = '51';
    this.phone2 = '';
    this.email1 = '';
    this.email2 = '';
    this.retentionAgent = false;
    this.addresses = [];
    this.resetAddressForm();
  }

  private patchClientToForm(c: ClientResponse): void {
    this.personTypeId = String(c.personTypeId ?? '1');
    this.documentTypeId = String(c.documentTypeId ?? '');
    this.documentNumber = c.documentNumber ?? '';
    this.firstName = c.firstName ?? '';
    this.lastName = c.lastName ?? '';
    this.birthDate = (c.birthDate as any) ?? '';
    this.businessName = c.businessName ?? '';
    this.contactPersonName = c.contactPersonName ?? '';
    this.countryCode1 = c.countryCode1 ?? '51';
    this.phone1 = c.phone1 ?? '';
    this.countryCode2 = c.countryCode2 ?? '51';
    this.phone2 = c.phone2 ?? '';
    this.email1 = c.email1 ?? '';
    this.email2 = c.email2 ?? '';
    this.retentionAgent = c.retentionAgent ?? false;
  }

  private isClientFormValid(): boolean {
    if (!this.personTypeId || !this.documentTypeId || !this.documentNumber) return false;
    if (this.isNaturalPerson() && (!this.firstName || !this.lastName)) return false;
    if (this.isLegalPerson() && !this.businessName) return false;
    if (!this.phone1) return false;
    if (this.phone1.length !== this.getPhoneMaxLength(this.countryCode1)) return false;
    return true;
  }

  get isLegalPersonSelected(): boolean { return String(this.personTypeId) === '2'; }
  disabledDocumentType = false;

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
            if (!this.isEditMode) this.prefillAddressFromLookup(d.fullAddress, d.ubigeoSunat);
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
            if (!this.isEditMode) this.prefillAddressFromLookup(d.fullAddress, d.ubigeoSunat);
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

  private prefillAddressFromLookup(fullAddress: string, ubigeo: string): void {
    if (!fullAddress?.trim()) return;
    const entry = { address: fullAddress.trim(), ubigeo: ubigeo?.trim() ?? '', description: '' };
    if (this.createAddresses.length === 0) {
      this.createAddresses.push(entry);
    } else {
      this.createAddresses[0] = entry;
    }
  }

  onPersonTypeChange(value: string): void {
    this.personTypeId = value;
    this.disabledDocumentType = this.isLegalPersonSelected;
    this.documentTypeId = '';
    if (!this.isLegalPersonSelected) this.retentionAgent = false;
    this.loadDocumentTypes(Number(this.personTypeId));
  }

  // ─── Address management ──────────────────────────────────────────────────

  // CREATE mode: local array submitted with the main request
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

  // EDIT mode: sub-resource endpoints
  addresses: ClientAddressResponse[] = [];

  // Add new address (edit)
  newAddrAddress = '';
  newAddrUbigeo = '';
  newAddrDescription = '';
  isAddingAddr = false;

  // Inline edit
  editingAddressId: number | null = null;
  editingAddrAddress = '';
  editingAddrUbigeo = '';
  editingAddrDescription = '';
  isSavingAddr = false;

  // Delete confirm
  showConfirmDeleteAddr = false;
  deleteAddrTarget?: ClientAddressResponse;
  isDeletingAddr = false;

  private resetAddressForm(): void {
    this.createAddresses = [];
    this.newCreateAddrAddress = '';
    this.newCreateAddrUbigeo = '';
    this.newCreateAddrDescription = '';
    this.newAddrAddress = '';
    this.newAddrUbigeo = '';
    this.newAddrDescription = '';
    this.editingAddressId = null;
    this.editingAddrAddress = '';
    this.editingAddrUbigeo = '';
    this.editingAddrDescription = '';
  }

  addAddress(): void {
    if (!this.newAddrAddress.trim() || !this.selectedClient?.id) return;
    this.isAddingAddr = true;

    const s = this.clientService.addAddress(this.selectedClient.id, {
      address: this.newAddrAddress.trim(),
      ubigeo: this.newAddrUbigeo.trim() || undefined,
      description: this.newAddrDescription.trim() || undefined,
    }).subscribe({
      next: res => {
        this.addresses.push(res.data!);
        this.newAddrAddress = '';
        this.newAddrUbigeo = '';
        this.newAddrDescription = '';
        this.isAddingAddr = false;
      },
      error: err => {
        this.notify.error(err?.error?.message ?? 'No se pudo agregar la dirección');
        this.isAddingAddr = false;
      },
    });
    this.sub.add(s);
  }

  startEditAddress(a: ClientAddressResponse): void {
    this.editingAddressId = a.id;
    this.editingAddrAddress = a.address;
    this.editingAddrUbigeo = a.ubigeo ?? '';
    this.editingAddrDescription = a.description ?? '';
  }

  cancelEditAddress(): void {
    this.editingAddressId = null;
  }

  saveAddress(a: ClientAddressResponse): void {
    if (!this.editingAddrAddress.trim() || !this.selectedClient?.id) return;
    this.isSavingAddr = true;

    const s = this.clientService.updateAddress(this.selectedClient.id, a.id, {
      address: this.editingAddrAddress.trim(),
      ubigeo: this.editingAddrUbigeo.trim() || undefined,
      description: this.editingAddrDescription.trim() || undefined,
    }).subscribe({
      next: res => {
        const idx = this.addresses.findIndex(x => x.id === a.id);
        if (idx !== -1) this.addresses[idx] = res.data!;
        this.editingAddressId = null;
        this.isSavingAddr = false;
      },
      error: err => {
        this.notify.error(err?.error?.message ?? 'No se pudo actualizar la dirección');
        this.isSavingAddr = false;
      },
    });
    this.sub.add(s);
  }

  openDeleteAddress(a: ClientAddressResponse): void {
    this.deleteAddrTarget = a;
    this.showConfirmDeleteAddr = true;
  }

  closeDeleteAddress(): void {
    this.showConfirmDeleteAddr = false;
    this.deleteAddrTarget = undefined;
  }

  confirmDeleteAddress(): void {
    if (!this.deleteAddrTarget || !this.selectedClient?.id) return;
    this.isDeletingAddr = true;

    const s = this.clientService.deleteAddress(this.selectedClient.id, this.deleteAddrTarget.id).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(x => x.id !== this.deleteAddrTarget!.id);
        this.closeDeleteAddress();
        this.isDeletingAddr = false;
      },
      error: err => {
        this.notify.error(err?.error?.message ?? 'No se pudo eliminar la dirección');
        this.isDeletingAddr = false;
      },
    });
    this.sub.add(s);
  }
}
