import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UbigeoResponse } from '../../../../dto/ubigeo.response';

@Component({
    selector: 'app-ubigeo-picker',
    standalone: true,
    imports: [NgClass, FormsModule],
    templateUrl: './ubigeo-picker.component.html',
})
export class UbigeoPickerComponent implements OnChanges {

    /** Lista completa de ubigeos; la provee el componente padre. */
    @Input() ubigeos: UbigeoResponse[] = [];
    @Input() value: string = '';
    @Input() disabled: boolean = false;
    @Input() placeholder: string = 'Seleccionar ubigeo...';
    @Output() valueChange = new EventEmitter<string>();

    /** Indica si el padre aún está cargando la lista. */
    @Input() loading: boolean = false;

    filtered: UbigeoResponse[] = [];
    searchTerm = '';
    isOpen = false;

    /** Máximo de ítems renderizados en la lista (rendimiento). */
    readonly maxDisplay = 60;

    constructor(private elRef: ElementRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['ubigeos'] && this.isOpen) {
            this.applyFilter();
        }
    }

    get selectedLabel(): string {
        if (!this.value) return '';
        const u = this.ubigeos.find(u => u.ubigeo === this.value);
        if (u) return `${u.ubigeo} — ${u.department} / ${u.province} / ${u.distrit}`;
        return this.value;
    }

    get displayed(): UbigeoResponse[] {
        return this.filtered.slice(0, this.maxDisplay);
    }

    get hiddenCount(): number {
        return Math.max(0, this.filtered.length - this.maxDisplay);
    }

    toggle(): void {
        if (this.disabled) return;
        if (this.isOpen) {
            this.isOpen = false;
        } else {
            this.searchTerm = '';
            this.applyFilter();
            this.isOpen = true;
        }
    }

    onSearch(): void {
        this.applyFilter();
    }

    private applyFilter(): void {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) {
            this.filtered = this.ubigeos;
            return;
        }
        this.filtered = this.ubigeos.filter(u =>
            u.ubigeo.includes(term) ||
            u.department.toLowerCase().includes(term) ||
            u.province.toLowerCase().includes(term) ||
            u.distrit.toLowerCase().includes(term)
        );
    }

    select(u: UbigeoResponse): void {
        this.value = u.ubigeo;
        this.valueChange.emit(u.ubigeo);
        this.isOpen = false;
    }

    clear(event: MouseEvent): void {
        event.stopPropagation();
        this.value = '';
        this.valueChange.emit('');
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }
}
