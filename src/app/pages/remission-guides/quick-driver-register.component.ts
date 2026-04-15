import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';
import { DriverService } from '../../services/driver.service';
import { DriverResponse } from '../../dto/driver.response';
import { DocumentLookupService } from '../../services/document-lookup.service';

@Component({
    selector: 'app-quick-driver-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalComponent,
        LabelComponent,
        InputFieldComponent,
    ],
    templateUrl: './quick-driver-register.component.html',
})
export class QuickDriverRegisterComponent implements OnChanges, OnDestroy {

    @Input() isOpen = false;
    @Output() onClose = new EventEmitter<void>();
    @Output() onCreated = new EventEmitter<DriverResponse>();

    private sub = new Subscription();

    submitted = false;
    isSubmitting = false;
    isLookingUp = false;

    readonly docType = 'DNI';
    docNumber = '';
    firstName = '';
    lastName = '';
    licenseNumber = '';

    constructor(
        private driverService: DriverService,
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
        if (!this.docType || !this.docNumber.trim() || !this.firstName.trim() || !this.lastName.trim()) return false;
        if (!this.licenseNumber.trim()) return false;
        return true;
    }

    get canLookup(): boolean {
        return this.docType === 'DNI' && /^\d{8}$/.test(this.docNumber.trim());
    }

    lookupDocument(): void {
        if (!this.canLookup || this.isLookingUp) return;
        this.isLookingUp = true;
        
        const s = this.documentLookupService.queryDni(this.docNumber.trim()).subscribe({
            next: res => {
                const d = res.data;
                if (d) {
                    this.firstName = d.firstName ?? '';
                    this.lastName = [d.lastNamePaternal, d.lastNameMaternal].filter(Boolean).join(' ');
                }
                this.isLookingUp = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'No se pudo consultar el DNI');
                this.isLookingUp = false;
            },
        });
        this.sub.add(s);
    }

    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid()) return;

        this.isSubmitting = true;
        const s = this.driverService.create({
            docType: this.docType,
            docNumber: this.docNumber.trim(),
            firstName: this.firstName.trim(),
            lastName: this.lastName.trim(),
            licenseNumber: this.licenseNumber.trim().toUpperCase(),
        }).subscribe({
            next: res => {
                this.isSubmitting = false;
                this.notify.success(res?.message ?? 'Conductor registrado correctamente');
                this.onCreated.emit(res.data!);
            },
            error: err => {
                this.isSubmitting = false;
                this.notify.error(err?.error?.message ?? 'No se pudo registrar el conductor.');
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
        this.firstName = '';
        this.lastName = '';
        this.licenseNumber = '';
    }
}
