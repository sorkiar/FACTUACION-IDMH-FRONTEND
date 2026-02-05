import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { SelectComponent, Option } from '../../form/select/select.component';

import { DocumentTypeService } from '../../../../services/document-type.service';
import { AuthService } from '../../../../services/auth.service';

import { DocumentTypeResponse } from '../../../../dto/document-type.response';
import { AuthRegisterRequest } from '../../../../dto/auth-register.request';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signup-form.component.html',
})
export class SignupFormComponent implements OnInit {
  private documentTypeService = inject(DocumentTypeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ====== modelo ======
  documentTypeId = '';
  documentNumber = '';
  profileId = 1;
  firstName = '';
  lastName = '';
  username = '';
  password = '';

  // ====== ui ======
  documentTypes: DocumentTypeResponse[] = [];
  documentTypeOptions: Option[] = [];
  showPassword = false;
  isSubmitting = false;
  submitted = false;

  ngOnInit(): void {
    this.loadDocumentTypes();
  }

  private loadDocumentTypes(): void {
    this.documentTypeService.getAll(1).subscribe({
      next: (res) => {
        this.documentTypes = res.data;
        this.documentTypeOptions = res.data.map((dt) => ({
          value: String(dt.id),
          label: dt.name,
        }));
      },
      error: (err) => console.error('Error cargando tipos de documento', err),
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private isValid(): boolean {
    return !!(
      this.documentTypeId &&
      this.documentNumber &&
      this.firstName &&
      this.lastName &&
      this.username &&
      this.password
    );
  }

  onSubmit(): void {
    this.submitted = true;

    if (!this.isValid()) {
      return;
    }

    this.isSubmitting = true;

    const payload: AuthRegisterRequest = {
      documentTypeId: Number(this.documentTypeId),
      profileId: this.profileId,
      documentNumber: this.documentNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      password: this.password,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        console.error('Error en registro', err);
        this.isSubmitting = false;
      },
    });
  }
}