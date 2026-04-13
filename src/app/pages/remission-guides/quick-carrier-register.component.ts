import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { CarrierService } from '../../services/carrier.service';
import { CarrierResponse } from '../../dto/carrier.response';
import { DocumentLookupService } from '../../services/document-lookup.service';

@Component({
    selector: 'app-quick-carrier-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
    ],
    templateUrl: './quick-carrier-register.component.html',
})
export class QuickCarrierRegisterComponent implements OnChanges, OnDestroy {

    @Input() isOpen = false;
    @Output() onClose = new EventEmitter<void>();
    @Output() onCreated = new EventEmitter<CarrierResponse>();

    private sub = new Subscription();

    submitted = false;
    isSubmitting = false;
    isLookingUp = false;

    docNumber = '';
    businessName = '';

    constructor(
        private carrierService: CarrierService,
        private documentLookupService: DocumentLookupService,
        private notify: NotificationService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen'] && this.isOpen) {
            this.reset();
        }
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    private isFormValid(): boolean {
        if (!this.docNumber.trim() || !this.businessName.trim()) return false;
        if (!/^\d{11}$/.test(this.docNumber.trim())) return false;
        return true;
    }

    get canLookup(): boolean {
        return /^\d{11}$/.test(this.docNumber.trim());
    }

    lookupDocument(): void {
        if (!this.canLookup || this.isLookingUp) return;
        this.isLookingUp = true;

        const s = this.documentLookupService.queryRuc(this.docNumber.trim()).subscribe({
            next: res => {
                const d = res.data;
                if (d) {
                    this.businessName = d.name ?? '';
                }
                this.isLookingUp = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo consultar el RUC');
                this.isLookingUp = false;
            },
        });
        this.sub.add(s);
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;

        this.isSubmitting = true;
        const s = this.carrierService.create({
            docType: 'RUC',
            docNumber: this.docNumber.trim(),
            businessName: this.businessName.trim(),
        }).subscribe({
            next: res => {
                this.isSubmitting = false;
                this.notify.success(res?.message ?? 'Transportista registrado correctamente');
                this.onCreated.emit(res.data!);
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo registrar el transportista.');
            },
        });
        this.sub.add(s);
    }

    close(): void {
        this.onClose.emit();
    }

    private reset(): void {
        this.submitted = false;
        this.isSubmitting = false;
        this.docNumber = '';
        this.businessName = '';
    }
}
