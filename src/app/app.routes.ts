import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
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
          'Dashboard | IDMH Perú',
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
