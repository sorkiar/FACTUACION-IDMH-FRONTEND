import { Component, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { NotificationService } from '../../../shared/components/ui/notification/notification.service';
import { MultiSelectComponent, Option } from '../../../shared/components/form/multi-select/multi-select.component';

import { ReportService } from '../../../services/report.service';
import { ClientService } from '../../../services/client.service';
import { ProductService } from '../../../services/product.service';
import { SunatDocumentTypeService } from '../../../services/sunat-document-type.service';

import { SalesReportRowResponse, SalesReportResponse } from '../../../dto/sales-report.response';

@Component({
    selector: 'app-sales-report',
    standalone: true,
    imports: [
        NgClass,
        DecimalPipe,
        FormsModule,
        PageBreadcrumbComponent,
        ButtonComponent,
        MultiSelectComponent,
    ],
    templateUrl: './sales-report.component.html',
})
export class SalesReportComponent implements OnInit {

    // ── Filters ────────────────────────────────────────────
    startDate = this.defaultStartDate();
    endDate   = this.defaultEndDate();

    clientOptions:  Option[] = [];
    productOptions: Option[] = [];
    docTypeOptions: Option[] = [];

    selectedClientIds:   string[] = [];
    selectedProductIds:  string[] = [];
    selectedDocTypeCodes: string[] = [];

    /** Flag para destruir/recrear los multi-selects al limpiar */
    multiSelectVisible = true;

    // ── State ──────────────────────────────────────────────
    loading      = false;
    isExporting  = false;
    hasSearched  = false;
    reportMeta?: Pick<SalesReportResponse, 'companyName' | 'dateRange' | 'totalItems'>;
    rows: SalesReportRowResponse[] = [];

    // ── Search / sort / pagination ─────────────────────────
    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    currentPage = 1;
    pageSize = 5;
    readonly pageSizeOptions = [5, 10, 15, 20, 50];

    constructor(
        private reportService: ReportService,
        private clientService: ClientService,
        private productService: ProductService,
        private sunatDocTypeService: SunatDocumentTypeService,
        private notify: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadClientOptions();
        this.loadProductOptions();
        this.loadDocTypeOptions();
    }

    // ── Options loaders ────────────────────────────────────
    private loadClientOptions(): void {
        this.clientService.getAll().subscribe({
            next: res => {
                this.clientOptions = (res.data ?? []).map(c => ({
                    value: String(c.id),
                    text: c.businessName?.trim()
                        || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
                }));
            },
            error: () => this.notify.error('No se pudieron cargar los clientes'),
        });
    }

    private loadProductOptions(): void {
        this.productService.getAll().subscribe({
            next: res => {
                this.productOptions = (res.data ?? []).map(p => ({
                    value: String(p.id),
                    text: `${p.sku} – ${p.name}`,
                }));
            },
            error: () => this.notify.error('No se pudieron cargar los productos'),
        });
    }

    private loadDocTypeOptions(): void {
        this.sunatDocTypeService.getAll({ showInSalesReport: true, status: 1 }).subscribe({
            next: res => {
                this.docTypeOptions = (res.data ?? []).map(d => ({
                    value: d.code,
                    text: d.name,
                }));
            },
            error: () => this.notify.error('No se pudieron cargar los tipos de documento'),
        });
    }

    // ── Filtered / sorted / paged data ────────────────────
    get filteredRows(): SalesReportRowResponse[] {
        const term = this.searchTerm.trim().toLowerCase();
        let list = term
            ? this.rows.filter(r =>
                r.document.toLowerCase().includes(term) ||
                r.client.toLowerCase().includes(term) ||
                r.itemDescription.toLowerCase().includes(term) ||
                r.issueDate.toLowerCase().includes(term) ||
                (r.documentTypeName ?? '').toLowerCase().includes(term) ||
                (r.sunatStatus ?? '').toLowerCase().includes(term)
            )
            : this.rows;

        if (this.sortColumn) {
            list = [...list].sort((a, b) => {
                let va = '';
                let vb = '';
                if (this.sortColumn === 'cliente')     { va = a.client;          vb = b.client; }
                if (this.sortColumn === 'descripcion') { va = a.itemDescription; vb = b.itemDescription; }
                if (this.sortColumn === 'documento')   { va = a.document;        vb = b.document; }
                return this.sortDir === 'asc'
                    ? va.localeCompare(vb, 'es')
                    : vb.localeCompare(va, 'es');
            });
        }
        return list;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
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

    get currentItems(): SalesReportRowResponse[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredRows.slice(start, start + this.pageSize);
    }

    // ── Actions ────────────────────────────────────────────
    onFilter(): void {
        if (!this.startDate || !this.endDate) {
            this.notify.warning('Debe ingresar fecha de inicio y fecha fin', 'Validación');
            return;
        }
        if (this.startDate > this.endDate) {
            this.notify.warning('La fecha de inicio no puede ser mayor a la fecha fin', 'Validación');
            return;
        }

        this.loading = true;
        this.hasSearched = true;
        this.currentPage = 1;

        const clientIds       = this.selectedClientIds.length       ? this.selectedClientIds.join(',')       : undefined;
        const productIds      = this.selectedProductIds.length      ? this.selectedProductIds.join(',')      : undefined;
        const documentTypeCodes = this.selectedDocTypeCodes.length  ? this.selectedDocTypeCodes.join(',')    : undefined;

        this.reportService.getSalesReport(this.startDate, this.endDate, clientIds, productIds, documentTypeCodes).subscribe({
            next: res => {
                const data = res.data!;
                this.reportMeta = {
                    companyName: data.companyName,
                    dateRange:   data.dateRange,
                    totalItems:  data.totalItems,
                };
                this.rows   = data.rows ?? [];
                this.loading = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al generar el reporte');
                this.loading = false;
            },
        });
    }

    onClearFilters(): void {
        this.startDate = this.defaultStartDate();
        this.endDate   = this.defaultEndDate();
        this.selectedClientIds    = [];
        this.selectedProductIds   = [];
        this.selectedDocTypeCodes = [];
        // destruye y recrea los multi-selects para vaciar su estado interno
        this.multiSelectVisible = false;
        setTimeout(() => { this.multiSelectVisible = true; }, 0);
        this.searchTerm  = '';
        this.rows        = [];
        this.reportMeta  = undefined;
        this.hasSearched = false;
        this.currentPage = 1;
    }

    toggleSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDir = 'asc';
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
    }

    setSearchTerm(value: string): void {
        this.searchTerm = (value ?? '').trim().toLowerCase();
        this.currentPage = 1;
    }

    // ── Excel export ───────────────────────────────────────
    async exportToExcel(): Promise<void> {
        if (!this.rows.length) {
            this.notify.warning('No hay datos para exportar', 'Sin datos');
            return;
        }
        this.isExporting = true;
        try {
            const wb = new ExcelJS.Workbook();
            wb.creator = this.reportMeta?.companyName ?? 'IDMH Perú';
            wb.created = new Date();

            const ws = wb.addWorksheet('Reporte de Ventas');

            // ── Column widths (A–N = 14 data columns)
            ws.columns = [
                { key: 'issueDate',       width: 12 },  // A
                { key: 'document',        width: 18 },  // B
                { key: 'docTypeName',     width: 14 },  // C
                { key: 'sunatStatus',     width: 14 },  // D
                { key: 'client',          width: 30 },  // E
                { key: 'description',     width: 36 },  // F
                { key: 'quantity',        width: 9  },  // G
                { key: 'unitPrice',       width: 13 },  // H
                { key: 'currency',        width: 10 },  // I
                { key: 'discount',        width: 10 },  // J
                { key: 'saleBaseAmount',  width: 16 },  // K
                { key: 'saleTaxAmount',   width: 14 },  // L
                { key: 'saleTotalAmount', width: 14 },  // M
            ];

            // ── Row heights
            ws.getRow(1).height = 26;
            ws.getRow(2).height = 22;
            ws.getRow(3).height = 18;
            ws.getRow(4).height = 18;
            ws.getRow(5).height = 8;
            ws.getRow(6).height = 22;

            // Suma saleTotalAmount por documento único agrupado por moneda
            const seenDocs = new Set<string>();
            const totalsByCurrency = new Map<string, number>();
            for (const r of this.rows) {
                if (seenDocs.has(r.document)) continue;
                seenDocs.add(r.document);
                const sym = this.currencySymbol(r.currencyCode);
                totalsByCurrency.set(sym, (totalsByCurrency.get(sym) ?? 0) + r.itemTotalAmount);
            }
            const totalStr = [...totalsByCurrency.entries()]
                .map(([sym, amt]) => `${sym} ${amt.toFixed(2)}`)
                .join(' | ');
            const now = new Date();
            const genDate = `Generado: ${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;

            // ── Row 1: Company name (C–L) + generation date (M)
            ws.mergeCells('C1:L1');
            const cnCell = ws.getCell('C1');
            cnCell.value = this.reportMeta?.companyName ?? '';
            cnCell.font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
            cnCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const gdCell = ws.getCell('M1');
            gdCell.value = genDate;
            gdCell.font = { size: 8, italic: true, color: { argb: 'FF9CA3AF' } };
            gdCell.alignment = { horizontal: 'right', vertical: 'bottom' };

            // ── Row 2: Title (C–M)
            ws.mergeCells('C2:M2');
            const titleCell = ws.getCell('C2');
            titleCell.value = 'REPORTE DE VENTAS';
            titleCell.font = { bold: true, size: 12, color: { argb: 'FF1e40af' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // ── Row 3: Period (C–M)
            ws.mergeCells('C3:M3');
            const periodCell = ws.getCell('C3');
            periodCell.value = `Período: ${this.reportMeta?.dateRange ?? `${this.startDate} al ${this.endDate}`}`;
            periodCell.font = { size: 9, color: { argb: 'FF6B7280' } };
            periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // ── Row 4: Stats (C–I records | J–M total)
            ws.mergeCells('C4:I4');
            const recCell = ws.getCell('C4');
            recCell.value = `Número de registros: ${this.reportMeta?.totalItems ?? this.rows.length}`;
            recCell.font = { size: 9, bold: true, color: { argb: 'FF374151' } };
            recCell.alignment = { horizontal: 'left', vertical: 'middle' };

            ws.mergeCells('J4:M4');
            const totCell = ws.getCell('J4');
            totCell.value = `Total General: ${totalStr}`;
            totCell.font = { size: 9, bold: true, color: { argb: 'FF047857' } };
            totCell.alignment = { horizontal: 'right', vertical: 'middle' };

            // ── Row 6: Column headers
            const COLS    = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];
            const HEADERS = ['Fecha','Documento','Tipo Documento','Est. SUNAT','Cliente','Descripción ítem','Cant.','P. Unit.','Moneda','Dscto%','Base Imponible','IGV','Total Venta'];
            const HDR_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } } as ExcelJS.Fill;
            const HDR_FONT = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } as Partial<ExcelJS.Font>;
            const THIN_BORDER: Partial<ExcelJS.Borders> = {
                top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
            };

            COLS.forEach((col, i) => {
                const cell = ws.getCell(`${col}6`);
                cell.value  = HEADERS[i];
                cell.font   = HDR_FONT;
                cell.fill   = HDR_FILL;
                cell.border = THIN_BORDER;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // ── Data rows
            this.rows.forEach((row, idx) => {
                const rowNum  = 7 + idx;
                const isEven  = idx % 2 === 0;
                const rowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' } } as ExcelJS.Fill;
                ws.getRow(rowNum).height = 15;

                const sym = row.currencyCode === 'USD' ? '$ ' : 'S/ ';
                const currFmt = `"${sym}"#,##0.00`;

                const rowData: [string, any, ExcelJS.Alignment['horizontal'], string][] = [
                    ['A', row.issueDate,           'left',   '@'],
                    ['B', row.document,            'left',   '@'],
                    ['C', row.documentTypeName ?? '', 'left', '@'],
                    ['D', row.sunatStatus ?? '',   'center', '@'],
                    ['E', row.client,              'left',   '@'],
                    ['F', row.itemDescription,     'left',   '@'],
                    ['G', row.quantity,            'right',  '#,##0.00'],
                    ['H', row.unitPrice,           'right',  currFmt],
                    ['I', row.currencyCode ?? '',  'center', '@'],
                    ['J', row.discountPercentage,  'right',  '#,##0.00'],
                    ['K', row.itemBaseAmount,      'right',  currFmt],
                    ['L', row.itemTaxAmount,       'right',  currFmt],
                    ['M', row.itemTotalAmount,     'right',  currFmt],
                ];

                rowData.forEach(([col, val, align, fmt]) => {
                    const cell = ws.getCell(`${col}${rowNum}`);
                    cell.value  = val;
                    cell.fill   = rowFill;
                    cell.font   = { size: 9 };
                    cell.border = THIN_BORDER;
                    cell.alignment = { vertical: 'middle', horizontal: align };
                    cell.numFmt = fmt;
                });
            });

            // ── Logo (overlay A1:B4 — fetched at runtime)
            try {
                const logoResp = await fetch('/images/logo/logo.png');
                const logoBuf  = await logoResp.arrayBuffer();
                const logoId   = wb.addImage({ buffer: logoBuf, extension: 'png' });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ws.addImage(logoId, { tl: { col: 0, row: 0 } as any, ext: { width: 130, height: 75 } } as any);
            } catch {
                console.warn('Logo no disponible para el Excel');
            }

            // ── Write & download
            const buf  = await wb.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const safeDateRange = (this.reportMeta?.dateRange ?? `${this.startDate}_${this.endDate}`).replace(/[/\\]/g, '-');
            saveAs(blob, `Reporte Ventas - ${safeDateRange}.xlsx`);

        } catch (err) {
            console.error(err);
            this.notify.error('Error al generar el Excel');
        } finally {
            this.isExporting = false;
        }
    }

    // ── Helpers ────────────────────────────────────────────
    currencySymbol(code?: string): string {
        return code === 'USD' ? '$' : 'S/';
    }

    sunatStatusClass(status: string | null): string {
        switch (status?.toUpperCase()) {
            case 'ACEPTADO':  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'RECHAZADO': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'PENDIENTE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default:          return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    }

    private defaultStartDate(): string {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().split('T')[0];
    }

    private defaultEndDate(): string {
        return new Date().toISOString().split('T')[0];
    }
}
