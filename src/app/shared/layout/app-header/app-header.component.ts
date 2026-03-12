import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import { SwitchComponent } from '../../components/form/input/switch.component';
import { SunatSendConfigService } from '../../../services/sunat-send-config.service';
import { NotificationService } from '../../components/ui/notification/notification.service';
import { LabelComponent } from '../../components/form/label/label.component';
import { SelectComponent, Option } from '../../components/form/select/select.component';
import { ModalComponent } from '../../components/ui/modal/modal.component';
import { ButtonComponent } from '../../components/ui/button/button.component';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    UserDropdownComponent,
    SwitchComponent,
    LabelComponent,
    SelectComponent,
    ModalComponent,
    ButtonComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent implements OnInit {
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;

  isOnlineMode = false;
  configLoaded = false;
  savingConfig = false;

  showOfflineModal = false;
  intervals = { boleta: '15', factura: '15', notaCredito: '15', notaDebito: '15', guiaRemision: '15' };

  readonly intervalOptions: Option[] = [
    { value: '5',  label: '5 minutos' },
    { value: '15', label: '15 minutos' },
    { value: '30', label: '30 minutos' },
    { value: '60', label: '60 minutos' },
  ];

  readonly docTypeLabels = [
    { key: 'boleta',       label: 'Boleta de Venta' },
    { key: 'factura',      label: 'Factura' },
    { key: 'notaCredito',  label: 'Nota de Crédito' },
    { key: 'notaDebito',   label: 'Nota de Débito' },
    { key: 'guiaRemision', label: 'Guía de Remisión' },
  ] as const;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    public sidebarService: SidebarService,
    private configService: SunatSendConfigService,
    private notify: NotificationService,
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    this.configService.getConfig().subscribe({
      next: res => {
        const modo = res.data?.boleta?.modo ?? res.data?.factura?.modo ?? 'OFFLINE';
        this.isOnlineMode = modo === 'ONLINE';
        if (res.data?.boleta?.intervaloMinutos)       this.intervals.boleta       = String(res.data.boleta.intervaloMinutos);
        if (res.data?.factura?.intervaloMinutos)      this.intervals.factura      = String(res.data.factura.intervaloMinutos);
        if (res.data?.notaCredito?.intervaloMinutos)  this.intervals.notaCredito  = String(res.data.notaCredito.intervaloMinutos);
        if (res.data?.notaDebito?.intervaloMinutos)   this.intervals.notaDebito   = String(res.data.notaDebito.intervaloMinutos);
        if (res.data?.guiaRemision?.intervaloMinutos) this.intervals.guiaRemision = String(res.data.guiaRemision.intervaloMinutos);
        this.configLoaded = true;
      },
      error: () => { this.configLoaded = true; }
    });
  }

  onModeChange(isOnline: boolean): void {
    if (!isOnline) {
      this.showOfflineModal = true;
      return;
    }
    this.configService.updateConfig('ONLINE').subscribe({
      next: () => {
        this.isOnlineMode = true;
        this.notify.success('Modo de envío SUNAT: ONLINE', 'Configuración');
        this.reloadSwitch();
      },
      error: () => {
        this.notify.error('Error al actualizar la configuración de envío');
        this.reloadSwitch();
      }
    });
  }

  confirmOfflineConfig(): void {
    this.savingConfig = true;
    const parsed = {
      boleta:       Number(this.intervals.boleta),
      factura:      Number(this.intervals.factura),
      notaCredito:  Number(this.intervals.notaCredito),
      notaDebito:   Number(this.intervals.notaDebito),
      guiaRemision: Number(this.intervals.guiaRemision),
    };
    this.configService.updateConfig('OFFLINE', parsed).subscribe({
      next: () => {
        this.isOnlineMode = false;
        this.showOfflineModal = false;
        this.savingConfig = false;
        this.notify.success('Modo de envío SUNAT: OFFLINE', 'Configuración');
        this.reloadSwitch();
      },
      error: () => {
        this.savingConfig = false;
        this.notify.error('Error al actualizar la configuración de envío');
        this.showOfflineModal = false;
        this.reloadSwitch();
      }
    });
  }

  cancelOfflineConfig(): void {
    this.showOfflineModal = false;
    this.reloadSwitch();
  }

  private reloadSwitch(): void {
    this.configLoaded = false;
    setTimeout(() => this.configLoaded = true, 0);
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };
}
