import { ModalComponent } from './../../../shared/components/ui/modal/modal.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientRequest } from '../../../dto/client.request';
import { ClientResponse } from '../../../dto/client.response';
import { ClientService } from '../../../services/client.service';
import { DocumentTypeService } from '../../../services/document-type.service';
import { DocumentTypeResponse } from '../../../dto/document-type.response';

@Component({
    selector: 'app-client-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent],
    templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {

    @Input() isOpen = false;
    @Input() isEdit = false;
    @Input() client?: ClientResponse;

    @Output() saved = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();

    documentTypes: DocumentTypeResponse[] = [];

    // Persona: 1 = Natural, 2 = Jurídica
    personTypeId: 1 | 2 = 1;

    form: ClientRequest = {
        personTypeId: 1,
        documentTypeId: 1,
        documentNumber: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        businessName: '',
        contactPersonName: '',
        phone1: '',
        phone2: '',
        email1: '',
        email2: '',
        address: '',
    };

    errors: Partial<Record<keyof ClientRequest, string>> = {};

    constructor(
        private clientService: ClientService,
        private documentTypeService: DocumentTypeService
    ) { }

    ngOnInit(): void {
        this.loadDocumentTypes();

        if (this.isEdit && this.client) {
            this.form = this.mapResponseToRequest(this.client);
            this.personTypeId = this.form.personTypeId as 1 | 2;
        }
    }

    private emptyForm(): ClientRequest {
        return {
            personTypeId: 1,
            documentTypeId: 1,
            documentNumber: '',
            firstName: '',
            lastName: '',
            birthDate: '',
            businessName: '',
            contactPersonName: '',
            phone1: '',
            phone2: '',
            email1: '',
            email2: '',
            address: '',
        };
    }

    private mapResponseToRequest(client: ClientResponse): ClientRequest {
        return {
            personTypeId: client.personType === 'NATURAL' ? 1 : 2,
            documentTypeId: client.documentTypeId,
            documentNumber: client.documentNumber,
            firstName: client.firstName ?? '',
            lastName: client.lastName ?? '',
            birthDate: client.birthDate ?? '',
            businessName: client.businessName ?? '',
            contactPersonName: client.contactPersonName ?? '',
            phone1: client.phone1 ?? '',
            phone2: client.phone2 ?? '',
            email1: client.email1 ?? '',
            email2: client.email2 ?? '',
            address: client.address ?? '',
        };
    }

    loadDocumentTypes(): void {
        this.documentTypeService.getAll(1).subscribe(res => {
            this.documentTypes = res.data ?? [];
        });
    }

    // ---------------- VALIDACIONES ----------------
    validate(): boolean {
        this.errors = {};

        if (this.personTypeId === 1) {
            if (!this.form.firstName) this.errors.firstName = 'Requerido';
            if (!this.form.lastName) this.errors.lastName = 'Requerido';
            if (!this.form.birthDate) this.errors.birthDate = 'Requerido';
        }

        if (this.personTypeId === 2) {
            if (!this.form.businessName) this.errors.businessName = 'Requerido';
            if (!this.form.contactPersonName) this.errors.contactPersonName = 'Requerido';
        }

        if (!this.form.documentNumber) this.errors.documentNumber = 'Requerido';
        if (!this.form.phone1 || this.form.phone1.length !== 9)
            this.errors.phone1 = 'Teléfono inválido (9 dígitos)';
        if (!this.form.email1 || !this.form.email1.includes('@'))
            this.errors.email1 = 'Correo inválido';
        if (!this.form.address) this.errors.address = 'Requerido';

        return Object.keys(this.errors).length === 0;
    }

    save(): void {
        if (!this.validate()) return;

        this.form.personTypeId = this.personTypeId;

        const req$ = this.isEdit && this.client
            ? this.clientService.update(this.client.id, this.form)
            : this.clientService.create(this.form);

        req$.subscribe(() => {
            this.saved.emit();
            this.close();
        });
    }

    close(): void {
        this.closed.emit();
    }
}
