import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Subscription } from 'rxjs';
import { SaleResponse } from '../../dto/sale.response';
import { ModalComponent } from "../../shared/components/ui/modal/modal.component";
import { BadgeComponent } from "../../shared/components/ui/badge/badge.component";
import { ButtonComponent } from "../../shared/components/ui/button/button.component";
import { DecimalPipe, NgClass } from '@angular/common';
import { SaleRegisterComponent } from './sale-register.component';
import { SaleService } from '../../services/sale.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [
    PageBreadcrumbComponent,
    BadgeComponent,
    ButtonComponent,
    DecimalPipe,
    NgClass,
    SaleRegisterComponent
  ],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.css',
})
export class SaleComponent implements OnInit, OnDestroy {

  // =========================
  // UI STATE
  // =========================
  loadingTable = false;
  showForm = false;

  // =========================
  // DATA
  // =========================
  sales: SaleResponse[] = [];
  selectedSale?: SaleResponse;

  // =========================
  // PAGINATION
  // =========================
  currentPage = 1;
  itemsPerPage = 5;

  // =========================
  // SEARCH
  // =========================
  searchTerm = '';

  // =========================
  // SUBSCRIPTIONS
  // =========================
  private sub = new Subscription();

  constructor(
    private saleService: SaleService,
    private notify: NotificationService
  ) { }

  // =========================
  // INIT / DESTROY
  // =========================
  ngOnInit(): void {
    this.loadSales();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // =========================
  // LOAD SALES
  // =========================
  loadSales(): void {
    this.loadingTable = true;

    const s = this.saleService.getAll().subscribe({
      next: res => {
        this.sales = res?.data ?? [];
        this.loadingTable = false;
      },
      error: err => {
        this.sales = [];
        this.loadingTable = false;
        this.notify.error(err?.error?.message ?? 'Error al listar ventas');
      }
    });

    this.sub.add(s);
  }

  // =========================
  // CREATE / EDIT
  // =========================
  onCreateSale(): void {
    this.selectedSale = undefined;
    this.showForm = true;
  }

  onEditSale(sale: SaleResponse): void {
    this.selectedSale = sale;
    this.showForm = true;
  }

  handleSaleSaved(): void {
    this.showForm = false;
    this.selectedSale = undefined;
    this.loadSales();
  }

  onCloseForm(): void {
    this.showForm = false;
    this.selectedSale = undefined;
  }

  // =========================
  // SEARCH
  // =========================
  setSearchTerm(value: string): void {
    this.searchTerm = (value ?? '').trim().toLowerCase();
    this.currentPage = 1;
  }

  get filteredSales(): SaleResponse[] {
    if (!this.searchTerm) return this.sales;

    return this.sales.filter(s =>
      s.client.businessName?.toLowerCase().includes(this.searchTerm) ||
      s.client.firstName?.toLowerCase().includes(this.searchTerm) ||
      s.client.lastName?.toLowerCase().includes(this.searchTerm) ||
      s.documentSeries?.toLowerCase().includes(this.searchTerm) ||
      s.documentSequence?.toLowerCase().includes(this.searchTerm)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSales.length / this.itemsPerPage));
  }

  get currentItems(): SaleResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSales.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // =========================
  // BADGE HELPERS
  // =========================
  getBadgeColor(status: string): 'success' | 'error' | 'warning' {
    if (status === 'COMPLETED') return 'success';
    if (status === 'DRAFT') return 'warning';
    return 'error';
  }

  // =========================
  // HELPERS
  // =========================
  formatIssueDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  openPdf(url: string): void {
    window.open(url, '_blank');
  }

}
