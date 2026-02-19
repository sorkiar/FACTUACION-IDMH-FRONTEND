import { Component, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

import { CreditDebitNoteService } from '../../services/credit-debit-note.service';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { CreditDebitNoteResponse } from '../../dto/credit-debit-note.response';
import { CreditDebitNoteRegisterComponent } from './credit-debit-note-register.component';

@Component({
    selector: 'app-credit-debit-note',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        BadgeComponent,
        ButtonComponent,
        DecimalPipe,
        NgClass,
        CreditDebitNoteRegisterComponent,
    ],
    templateUrl: './credit-debit-note.component.html',
    styleUrl: './credit-debit-note.component.css',
})
export class CreditDebitNoteComponent implements OnInit, OnDestroy {

    // =========================
    // UI STATE
    // =========================
    loadingTable = false;
    showForm = false;

    // =========================
    // DATA
    // =========================
    notes: CreditDebitNoteResponse[] = [];
    selectedNote?: CreditDebitNoteResponse;

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
        private noteService: CreditDebitNoteService,
        private notify: NotificationService
    ) { }

    // =========================
    // INIT / DESTROY
    // =========================
    ngOnInit(): void {
        this.loadNotes();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    // =========================
    // LOAD
    // =========================
    loadNotes(): void {
        this.loadingTable = true;
        const s = this.noteService.getAll().subscribe({
            next: res => {
                this.notes = res?.data ?? [];
                this.loadingTable = false;
            },
            error: err => {
                this.notes = [];
                this.loadingTable = false;
                this.notify.error(err?.error?.message ?? 'Error al listar notas de crédito/débito');
            }
        });
        this.sub.add(s);
    }

    // =========================
    // CREATE / VIEW
    // =========================
    onCreateNote(): void {
        this.selectedNote = undefined;
        this.showForm = true;
    }

    onViewNote(note: CreditDebitNoteResponse): void {
        this.selectedNote = note;
        this.showForm = true;
    }

    handleNoteSaved(): void {
        this.showForm = false;
        this.selectedNote = undefined;
        this.loadNotes();
    }

    onCloseForm(): void {
        this.showForm = false;
        this.selectedNote = undefined;
    }

    // =========================
    // RESEND
    // =========================
    onResend(note: CreditDebitNoteResponse): void {
        this.noteService.resend(note.id).subscribe({
            next: () => {
                this.notify.success('Nota reenviada a SUNAT correctamente');
                this.loadNotes();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al reenviar nota');
            }
        });
    }

    // =========================
    // SEARCH
    // =========================
    setSearchTerm(value: string): void {
        this.searchTerm = (value ?? '').trim().toLowerCase();
        this.currentPage = 1;
    }

    get filteredNotes(): CreditDebitNoteResponse[] {
        if (!this.searchTerm) return this.notes;
        return this.notes.filter(n =>
            n.creditDebitNoteType?.name?.toLowerCase().includes(this.searchTerm) ||
            n.originalDocument?.series?.toLowerCase().includes(this.searchTerm) ||
            n.originalDocument?.sequence?.toLowerCase().includes(this.searchTerm) ||
            n.series?.toLowerCase().includes(this.searchTerm) ||
            n.sequence?.toLowerCase().includes(this.searchTerm) ||
            n.sale?.client?.businessName?.toLowerCase().includes(this.searchTerm) ||
            n.sale?.client?.firstName?.toLowerCase().includes(this.searchTerm) ||
            n.sale?.client?.lastName?.toLowerCase().includes(this.searchTerm)
        );
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredNotes.length / this.itemsPerPage));
    }

    get currentItems(): CreditDebitNoteResponse[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredNotes.slice(start, start + this.itemsPerPage);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    // =========================
    // HELPERS
    // =========================
    getClientName(note: CreditDebitNoteResponse): string {
        const client = note.sale?.client;
        if (!client) return '-';
        if (client.businessName) return client.businessName;
        return `${client.firstName} ${client.lastName}`.trim();
    }

    getOriginalDoc(note: CreditDebitNoteResponse): string {
        if (!note.originalDocument) return '-';
        return `${note.originalDocument.series}-${note.originalDocument.sequence}`;
    }

    getNoteDoc(note: CreditDebitNoteResponse): string {
        if (!note.series || !note.sequence) return 'Sin emitir';
        return `${note.series}-${note.sequence}`;
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    getStatusBadgeColor(status: string): 'success' | 'error' | 'warning' {
        if (status === 'ACEPTADO') return 'success';
        if (status === 'PENDIENTE') return 'warning';
        return 'error';
    }

    getNoteTypeBadgeColor(category: string): 'success' | 'error' | 'warning' {
        return category === 'CREDITO' ? 'success' : 'error';
    }

    openFile(url: string): void {
        window.open(url, '_blank');
    }

    canResend(note: CreditDebitNoteResponse): boolean {
        return note.status === 'RECHAZADO' || note.status === 'ERROR';
    }
}
