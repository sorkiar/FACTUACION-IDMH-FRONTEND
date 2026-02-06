import { ClientResponse } from './../../dto/client.response';
import { ClientFilter } from './../../dto/client.filter';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ClientService } from '../../services/client.service';
import { ClientFormComponent } from "./form/client-form.component";

type UiStatus = 'Success' | 'Pending' | 'Failed';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    ButtonComponent,
    NgClass,
    BadgeComponent,
    ClientFormComponent
],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent implements OnInit, OnDestroy {
  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // UI states
  loading = false;
  errorMessage: string | null = null;

  // Filters
  filters: ClientFilter = {
    status: 1, // por defecto: activos
  };

  // Search input (del input "Search..." del HTML)
  searchTerm = '';

  // Data (desde API)
  clients: ClientResponse[] = [];

  // Subscription container
  private sub = new Subscription();

  showForm = false;
  isEditMode = false;
  selectedClient?: ClientResponse;

  constructor(private clientService: ClientService) { }

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
    this.errorMessage = null;

    const s = this.clientService.getAll(this.filters).subscribe({
      next: (res) => {
        // Asumiendo ApiResponse { message, data }
        this.clients = res?.data ?? [];
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.clients = [];
        this.errorMessage =
          err?.error?.message ?? 'Ocurrió un error al listar clientes.';
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
    return (this.clients ?? []).filter((c) => this.matchesSearch(c));
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
    this.selectedClient = {} as ClientResponse;
    this.showForm = true;
  }

  onEditClient(client: ClientResponse): void {
    this.isEditMode = true;
    this.selectedClient = client;
    this.showForm = true;
  }

  onCloseForm(): void {
    this.showForm = false;
  }

  onToggleStatus(client: ClientResponse): void {
    // Si está activo (1), inactivar; si está inactivo (0), activar
    const newStatus = client.status === 1 ? 0 : 1;

    const s = this.clientService.updateStatus(client.id, newStatus).subscribe({
      next: () => {
        // refrescamos lista
        this.loadClients();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ?? 'No se pudo actualizar el estado del cliente.';
      },
    });

    this.sub.add(s);
  }

  // -----------------------------
  // Helpers para el template actual (imagen y textos)
  // -----------------------------
  getAvatarForClient(_client: ClientResponse): string {
    // Tu tabla muestra una imagen. De momento usamos un placeholder local.
    // Puedes cambiar esto por un avatar real cuando lo tengas.
    return '/images/brand/brand-08.svg';
  }

  getDisplayName(client: ClientResponse): string {
    const fullName = `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
    return fullName || client.businessName || '-';
  }

  getDocumentText(client: ClientResponse): string {
    const type = client.documentType ?? '';
    const num = client.documentNumber ?? '';
    return `${type} ${num}`.trim();
  }
}
