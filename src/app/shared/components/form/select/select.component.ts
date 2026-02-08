import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
})
export class SelectComponent implements OnInit, OnChanges {
  @Input() options: Option[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() className: string = '';
  @Input() defaultValue: string = '';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText: string = 'Cargando...';

  @Output() valueChange = new EventEmitter<string>();

  private lastRealValue: string = '';

  ngOnInit() {
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      const nowLoading = !!changes['loading'].currentValue;
      const wasLoading = !!changes['loading'].previousValue;

      if (nowLoading && !wasLoading) {
        this.lastRealValue = this.value;
        if (this.value !== '') {
          this.value = '';
        }
      }

      if (!nowLoading && wasLoading) {
        const canRestore =
          this.lastRealValue &&
          this.options?.some(o => String(o.value) === String(this.lastRealValue));

        if (canRestore && this.value === '') {
          this.value = this.lastRealValue;
        }

        this.lastRealValue = '';
      }
    }

    if (changes['options'] && !this.loading && this.value) {
      const exists = this.options?.some(o => String(o.value) === String(this.value));
      if (!exists) {
        this.value = '';
        this.valueChange.emit('');
      }
    }
  }

  get isDisabledComputed(): boolean {
    return this.disabled || this.loading;
  }

  onChange(event: Event) {
    if (this.isDisabledComputed) return;

    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.valueChange.emit(value);
  }

  onModelChange(val: string) {
    if (this.isDisabledComputed) return;
    this.value = val;
    this.valueChange.emit(val);
  }
}