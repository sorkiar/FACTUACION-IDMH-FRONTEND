import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { AuthGuard } from './security/auth.guard';
import { GuestGuard } from './security/guest.guard';
import { ClientsComponent } from './pages/clients/clients.component';
import { ProductComponent } from './pages/product/product.component';
import { ServiceComponent } from './pages/services/service.component';
import { SaleComponent } from './pages/sales/sale.component';
import { CreditDebitNoteComponent } from './pages/credit-debit-notes/credit-debit-note.component';
import { RemissionGuideComponent } from './pages/remission-guides/remission-guide.component';
import { SunatDocumentsComponent } from './pages/sunat-documents/sunat-documents.component';
import { SalesReportComponent } from './pages/reports/sales-report/sales-report.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Inicio | IDMH Perú',
      },
      {
        path: 'clients',
        component: ClientsComponent,
        title: 'Clientes | IDMH Perú'
      },
      {
        path: 'products',
        component: ProductComponent,
        title: 'Productos | IDMH Perú'
      },
      {
        path: 'services',
        component: ServiceComponent,
        title: 'Servicios | IDMH Perú'
      },
      {
        path: 'sales',
        component: SaleComponent,
        title: 'Ventas | IDMH Perú'
      },
      {
        path: 'credit-debit-notes',
        component: CreditDebitNoteComponent,
        title: 'Notas de Crédito / Débito | IDMH Perú'
      },
      {
        path: 'remission-guides',
        component: RemissionGuideComponent,
        title: 'Guías de Remisión | IDMH Perú'
      },
      {
        path: 'sunat-documents',
        component: SunatDocumentsComponent,
        title: 'Adm. Comprobantes | IDMH Perú'
      },
      {
        path: 'reports/sales',
        component: SalesReportComponent,
        title: 'Reporte de Ventas | IDMH Perú'
      },
    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [GuestGuard],
    title: 'Iniciar Sesión | IDMH Perú'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [GuestGuard],
    title: 'Registro | IDMH Perú'
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    canActivate: [GuestGuard],
    title: 'Not Found | IDMH Perú'
  },
];
