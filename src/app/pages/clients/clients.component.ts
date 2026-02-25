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
import { ClientRequest } from '../../dto/client.request';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

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
    SelectComponent
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

  // Search input (del input "Search..." del HTML)
  searchTerm = '';

  // Data (desde API)
  clients: ClientResponse[] = [];

  // Subscription container
  private sub = new Subscription();

  showForm = false;
  isEditMode = false;
  selectedClient?: ClientResponse;

  constructor(
    private clientService: ClientService,
    private documentTypeService: DocumentTypeService,
    private notify: NotificationService,
  ) { }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // -----------------------------
  // Data loading
  // -----------------------------
  loadClients(): void {
    this.loading = true;
    this.loadingTable = true;
    this.errorMessage = null;

    const s = this.clientService.getAll(this.filters).subscribe({
      next: (res) => {
        // Asumiendo ApiResponse { message, data }
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

  // -----------------------------
  // Search (sin cambiar tu HTML, filtra en frontend)
  // -----------------------------
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

  // -----------------------------
  // Pagination computed
  // -----------------------------
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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

  // -----------------------------
  // Badge helpers (para tu HTML actual)
  // -----------------------------
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

  // -----------------------------
  // Actions (para dropdown)
  // -----------------------------
  onCreateClient(): void {
    this.isEditMode = false;
    this.selectedClient = undefined;
    this.resetClientForm();
    this.disabledDocumentType = this.isLegalPersonSelected;
    this.loadDocumentTypes(Number(this.personTypeId)); // por defecto Natural
    this.showForm = true;
  }

  onEditClient(client: ClientResponse): void {
    this.isEditMode = true;
    this.selectedClient = client;
    this.resetClientForm();
    this.patchClientToForm(client);
    this.disabledDocumentType = this.isLegalPersonSelected;
    this.loadDocumentTypes(Number(this.personTypeId), this.documentTypeId);
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

      phone1: this.phone1?.trim(),
      phone2: this.phone2?.trim() || '',

      email1: this.email1?.trim(),
      email2: this.email2?.trim() || '',

      address: this.address?.trim() || '',
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

  // ====== selects ======
  documentTypeOptions: Option[] = [];
  personTypeOptions: Option[] = [
    { value: '1', label: 'Natural' },
    { value: '2', label: 'Jurídica' },
  ];

  // ====== form model (ngModel style) ======
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
  address = '';

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

        if (exists) {
          this.documentTypeId = String(selectedId);
        } else {
          this.documentTypeId = this.documentTypeOptions[0]?.value ?? '';
        }

        this.loadingDocumentTypes = false;
      },
      error: () => {
        this.loadingDocumentTypes = false;
        this.documentTypeOptions = [];
      },
    });

    this.sub.add(s);
  }

  isNaturalPerson(): boolean {
    return String(this.personTypeId) === '1';
  }
  isLegalPerson(): boolean {
    return String(this.personTypeId) === '2';
  }

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
    this.phone1 = '';
    this.phone2 = '';
    this.email1 = '';
    this.email2 = '';
    this.address = '';
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
    this.phone1 = c.phone1 ?? '';
    this.phone2 = c.phone2 ?? '';
    this.email1 = c.email1 ?? '';
    this.email2 = c.email2 ?? '';
    this.address = c.address ?? '';
  }

  // Validación mínima para crear/editar
  private isClientFormValid(): boolean {
    if (!this.personTypeId || !this.documentTypeId || !this.documentNumber) return false;

    if (this.isNaturalPerson()) {
      if (!this.firstName || !this.lastName) return false;
    }

    if (this.isLegalPerson()) {
      if (!this.businessName) return false;
    }

    if (!this.phone1 || !this.email1) return false;

    return true;
  }

  get isLegalPersonSelected(): boolean {
    return String(this.personTypeId) === '2';
  }

  disabledDocumentType = false;

  onPersonTypeChange(value: string): void {
    this.personTypeId = value;

    this.disabledDocumentType = this.isLegalPersonSelected;
    this.documentTypeId = ''; // se recalcula cuando llegue la lista

    this.loadDocumentTypes(Number(this.personTypeId));
  }
}
