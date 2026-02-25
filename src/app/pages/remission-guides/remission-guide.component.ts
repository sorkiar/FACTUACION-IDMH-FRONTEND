import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

import { RemissionGuideService } from '../../services/remission-guide.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { RemissionGuideResponse } from '../../dto/remission-guide.response';
import { RemissionGuideRegisterComponent } from './remission-guide-register.component';

@Component({
    selector: 'app-remission-guide',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        BadgeComponent,
        NgClass,
        RemissionGuideRegisterComponent,
    ],
    templateUrl: './remission-guide.component.html',
    styleUrl: './remission-guide.component.css',
})
export class RemissionGuideComponent implements OnInit, OnDestroy {

    // =========================
    // UI STATE
    // =========================
    loadingTable = false;
    showForm = false;

    // =========================
    // DATA
    // =========================
    guides: RemissionGuideResponse[] = [];
    selectedGuide?: RemissionGuideResponse;

    // =========================
    // PAGINATION
    // =========================
    currentPage = 1;
    itemsPerPage = 5;
    readonly pageSizeOptions = [5, 10, 15, 20, 50];

    // =========================
    // SORT
    // =========================
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // =========================
    // SEARCH
    // =========================
    searchTerm = '';

    private sub = new Subscription();

    constructor(
        private guideService: RemissionGuideService,
        private notify: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadGuides();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    loadGuides(): void {
        this.loadingTable = true;
        const s = this.guideService.getAll().subscribe({
            next: res => {
                this.guides = res?.data ?? [];
                this.loadingTable = false;
            },
            error: err => {
                this.guides = [];
                this.loadingTable = false;
                this.notify.error(err?.error?.message ?? 'Error al listar guías de remisión');
            }
        });
        this.sub.add(s);
    }

    onCreateGuide(): void {
        this.selectedGuide = undefined;
        this.showForm = true;
    }

    onViewGuide(guide: RemissionGuideResponse): void {
        this.selectedGuide = guide;
        this.showForm = true;
    }

    onCloseForm(): void {
        this.showForm = false;
        this.selectedGuide = undefined;
    }

    onSaved(): void {
        this.showForm = false;
        this.selectedGuide = undefined;
        this.loadGuides();
    }

    openPdf(url: string): void {
        window.open(url, '_blank');
    }

    setSearchTerm(value: string): void {
        this.searchTerm = value.trim().toLowerCase();
        this.currentPage = 1;
    }

    // =========================
    // COMPUTED
    // =========================
    get filteredGuides(): RemissionGuideResponse[] {
        let list = this.guides;
        if (this.searchTerm) {
            list = list.filter(g =>
                g.series?.toLowerCase().includes(this.searchTerm) ||
                g.sequence?.toLowerCase().includes(this.searchTerm) ||
                g.recipientName?.toLowerCase().includes(this.searchTerm) ||
                g.transferReason?.toLowerCase().includes(this.searchTerm) ||
                g.status?.toLowerCase().includes(this.searchTerm)
            );
        }
        if (this.sortColumn === 'destinatario') {
            list = [...list].sort((a, b) => {
                const va = a.recipientName ?? '';
                const vb = b.recipientName ?? '';
                return this.sortDir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
            });
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredGuides.length / this.itemsPerPage));
    }

    get currentItems(): RemissionGuideResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredGuides.slice(start, start + this.itemsPerPage);
    }

    goToPage(page: number): void {
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

    // =========================
    // HELPERS
    // =========================
    getGuideDoc(guide: RemissionGuideResponse): string {
        if (!guide.series || !guide.sequence) return 'Sin emitir';
        return `${guide.series}-${guide.sequence}`;
    }

    getTransferReasonLabel(reason: string): string {
        const map: Record<string, string> = {
            VENTA: 'Venta',
            COMPRA: 'Compra',
            TRASLADO_ENTRE_ESTABLECIMIENTOS: 'Traslado entre establ.',
            DEVOLUCION: 'Devolución',
            OTROS: 'Otros',
        };
        return map[reason] ?? reason;
    }

    getTransportModeLabel(mode: string): string {
        return mode === 'TRANSPORTE_PUBLICO' ? 'Público' : 'Privado';
    }

    getStatusBadgeColor(status: string): 'success' | 'error' | 'warning' | 'info' {
        switch (status?.toUpperCase()) {
            case 'ACEPTADO': return 'success';
            case 'RECHAZADO': return 'error';
            case 'PENDIENTE': return 'warning';
            default: return 'info';
        }
    }

    formatDate(date?: string): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }
}
