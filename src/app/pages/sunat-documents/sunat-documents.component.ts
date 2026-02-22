import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { SunatDocumentService } from '../../services/sunat-document.service';
import { SunatDocumentSummaryResponse } from '../../dto/sunat-document-summary.response';

@Component({
    selector: 'app-sunat-documents',
    standalone: true,
    imports: [NgClass, DatePipe, FormsModule, PageBreadcrumbComponent, BadgeComponent, ButtonComponent],
    templateUrl: './sunat-documents.component.html',
})
export class SunatDocumentsComponent implements OnInit {

    documents: SunatDocumentSummaryResponse[] = [];
    loading = false;

    searchTerm = '';
    statusFilter = '';

    currentPage = 1;
    readonly pageSize = 5;

    resendingId: number | null = null;
    downloadingKey: string | null = null;

    constructor(
        private service: SunatDocumentService,
        private notify: NotificationService
    ) {}

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.currentPage = 1;
        this.service.listAll(this.statusFilter || undefined).subscribe({
            next: res => {
                this.documents = res.data ?? [];
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.notify.error('Error al cargar comprobantes SUNAT');
            }
        });
    }

    get filteredDocuments(): SunatDocumentSummaryResponse[] {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) return this.documents;
        return this.documents.filter(d =>
            (d.voucherNumber ?? '').toLowerCase().includes(term) ||
            this.getDocTypeLabel(d).toLowerCase().includes(term)
        );
    }

    get currentItems(): SunatDocumentSummaryResponse[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredDocuments.slice(start, start + this.pageSize);
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredDocuments.length / this.pageSize));
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
    }

    setSearchTerm(value: string): void {
        this.searchTerm = value;
        this.currentPage = 1;
    }

    onStatusChange(): void {
        this.currentPage = 1;
        this.load();
    }

    resend(doc: SunatDocumentSummaryResponse): void {
        this.resendingId = doc.id;
        this.service.resend(doc).subscribe({
            next: res => {
                this.notify.success(res.message ?? 'Documento enviado a SUNAT', 'Éxito');
                this.resendingId = null;
                this.load();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al enviar/reenviar documento');
                this.resendingId = null;
            }
        });
    }

    download(doc: SunatDocumentSummaryResponse, type: 'xml' | 'cdr' | 'pdf'): void {
        const key = `${doc.id}-${type}`;
        this.downloadingKey = key;
        this.service.downloadFile(doc, type).subscribe({
            next: blob => {
                const ext = type === 'cdr' ? 'zip' : type;
                const filename = `${doc.voucherNumber ?? doc.id}.${ext}`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                this.downloadingKey = null;
            },
            error: () => {
                this.notify.error('Error al descargar el archivo');
                this.downloadingKey = null;
            }
        });
    }

    isDownloading(doc: SunatDocumentSummaryResponse, type: string): boolean {
        return this.downloadingKey === `${doc.id}-${type}`;
    }

    canResend(doc: SunatDocumentSummaryResponse): boolean {
        return doc.status !== 'ACEPTADO';
    }

    getDocTypeLabel(doc: SunatDocumentSummaryResponse): string {
        switch (doc.documentTypeName) {
            case 'FACTURA':                 return 'Factura';
            case 'BOLETA':                  return 'Boleta de Venta';
            case 'NOTA_CREDITO':            return 'Nota de Crédito';
            case 'NOTA_DEBITO':             return 'Nota de Débito';
            case 'GUIA_REMISION_REMITENTE': return 'Guía de Remisión';
            default: return doc.documentTypeName ?? doc.category;
        }
    }

    getDocTypeBadgeColor(doc: SunatDocumentSummaryResponse): 'primary' | 'warning' | 'success' | 'light' {
        switch (doc.category) {
            case 'DOCUMENTO': return 'primary';
            case 'NOTA':      return 'warning';
            case 'GUIA':      return 'success';
            default:          return 'light';
        }
    }

    getStatusBadgeColor(status: string): 'success' | 'error' | 'warning' | 'light' {
        switch (status) {
            case 'ACEPTADO':  return 'success';
            case 'RECHAZADO': return 'error';
            case 'PENDIENTE': return 'warning';
            default:          return 'light';
        }
    }
}
