import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import countriesData from '../../../../services/utils/countries.json';

export interface CountryOption {
    nameES: string;
    nameEN: string;
    iso2: string;
    iso3: string;
    phoneCode: string;
    maxLength: number;
}

@Component({
    selector: 'app-phone-picker',
    standalone: true,
    imports: [NgClass, FormsModule],
    templateUrl: './phone-picker.component.html',
})
export class PhonePickerComponent implements OnInit {

    @Input() value: string = '51';
    @Output() valueChange = new EventEmitter<string>();
    @Input() disabled = false;

    readonly countries: CountryOption[] = countriesData as CountryOption[];
    filtered: CountryOption[] = [];
    searchTerm = '';
    isOpen = false;

    constructor(private elRef: ElementRef) {}

    ngOnInit(): void {
        this.filtered = this.countries;
    }

    get selectedLabel(): string {
        return this.value ? `(+${this.value})` : 'Cód.';
    }

    get selectedMaxLength(): number {
        return this.countries.find(c => c.phoneCode === this.value)?.maxLength ?? 15;
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

    private normalize(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    private applyFilter(): void {
        const term = this.normalize(this.searchTerm.trim());
        if (!term) {
            this.filtered = this.countries;
            return;
        }
        this.filtered = this.countries.filter(c =>
            this.normalize(c.nameES).includes(term) ||
            c.phoneCode.includes(term)
        );
    }

    select(c: CountryOption): void {
        this.value = c.phoneCode;
        this.valueChange.emit(c.phoneCode);
        this.isOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }
}
