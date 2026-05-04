import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

import { RemissionGuideService } from '../../services/remission-guide.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { RemissionGuideResponse } from '../../dto/remission-guide.response';
import { TransferReasonResponse } from '../../dto/transfer-reason.response';
import { RemissionGuideRegisterComponent } from './remission-guide-register.component';

@Component({
    selector: 'app-remission-guide',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        BadgeComponent,
        ButtonComponent,
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

    // =========================
    // TOOLTIP
    // =========================
    tooltipVisible = false;
    tooltipCode = '';
    tooltipText = '';
    tooltipX = 0;
    tooltipY = 0;

    showTooltip(event: MouseEvent, code: number | undefined, message: string | undefined): void {
        if (!message) return;
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.tooltipCode = code != null ? String(code) : '';
        this.tooltipText = message;
        this.tooltipX = rect.left;
        this.tooltipY = rect.top;
        this.tooltipVisible = true;
    }

    hideTooltip(): void {
        this.tooltipVisible = false;
    }

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
                (g.client ? (g.client.businessName || `${g.client.firstName ?? ''} ${g.client.lastName ?? ''}`).toLowerCase().includes(this.searchTerm) : false) ||
                g.transferReason?.name?.toLowerCase().includes(this.searchTerm) ||
                g.status?.toLowerCase().includes(this.searchTerm)
            );
        }
        if (this.sortColumn === 'destinatario') {
            list = [...list].sort((a, b) => {
                const va = a.client ? (a.client.businessName || `${a.client.firstName ?? ''} ${a.client.lastName ?? ''}`.trim()) : '';
                const vb = b.client ? (b.client.businessName || `${b.client.firstName ?? ''} ${b.client.lastName ?? ''}`.trim()) : '';
                return this.sortDir === 'asc' ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
            });
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredGuides.length / this.itemsPerPage));
    }

    get pageItems(): (number | '...')[] {
        const total = this.totalPages;
        const current = this.currentPage;
        const pages = new Set<number>();
        for (let i = 1; i <= Math.min(3, total); i++) pages.add(i);
        for (let i = Math.max(1, total - 2); i <= total; i++) pages.add(i);
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
        const sorted = Array.from(pages).sort((a, b) => a - b);
        const result: (number | '...')[] = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
            result.push(sorted[i]);
        }
        return result;
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

    getTransferReasonLabel(reason: TransferReasonResponse | undefined): string {
        return reason?.name ?? '';
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
        return new Date(date + 'T00:00:00').toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }
}
