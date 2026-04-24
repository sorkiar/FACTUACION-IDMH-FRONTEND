import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { ConfigurationService } from '../../services/configuration.service';
import { ConfigurationResponse } from '../../dto/configuration.response';
import { UserService } from '../../services/user.service';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { ExchangeRateResponse } from '../../dto/exchange-rate.response';
import { NotificationService } from '../../shared/components/ui/notification/notification.service';

interface ConfigGroup {
    label: string;
    configs: (ConfigurationResponse & { editValue: string })[];
}

@Component({
    selector: 'app-configuration',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuration.component.html',
})
export class ConfigurationComponent implements OnInit {

    groups: ConfigGroup[] = [];
    loading = false;
    saving = false;

    private readonly GROUP_LABELS: { [key: string]: string } = {
        'empresa_emisora': 'Datos de la empresa',
        'detraccion_retencion': 'Parámetros tributarios',
        'sunat_envio': 'Configuración SUNAT',
        'tipo_cambio': 'Tipo de cambio',
        'consulta_externa': 'Consultas Externas',
    };

    // Claves a excluir de la interfaz (certificados y campos sensibles internos)
    private readonly EXCLUDED_KEYS = new Set([
        'emprCertificadoLlavePublica',
        'emprCertificadoLlavePrivada',
        'emprCodigoEstablecimientoSunat',
        'emprGuiaId',
        'emprGuiaClave',
        'emprProduccion',
        'ubigUbigeo',
        'ubigDepartamento',
        'ubigProvincia',
        'ubigDistrito',
        'emprUsuarioSecundario',
        'emprClaveUsuarioSecundario',
        'sunat_token',
        'fetch_hour',
    ]);

    // Password change state
    newPassword = '';
    confirmPassword = '';
    savingPassword = false;
    passwordSubmitted = false;

    get passwordError(): string {
        if (!this.newPassword) return 'La contraseña es obligatoria';
        if (this.newPassword.length < 6) return 'Debe tener al menos 6 caracteres';
        if (this.newPassword !== this.confirmPassword) return 'Las contraseñas no coinciden';
        return '';
    }

    savePassword(): void {
        this.passwordSubmitted = true;
        if (this.passwordError) return;

        this.savingPassword = true;
        this.userService.changePassword(this.newPassword).subscribe({
            next: res => {
                this.savingPassword = false;
                this.passwordSubmitted = false;
                this.newPassword = '';
                this.confirmPassword = '';
                this.notify.success(res?.message ?? 'Contraseña actualizada correctamente');
            },
            error: err => {
                this.savingPassword = false;
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar la contraseña');
            },
        });
    }

    resetPassword(): void {
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordSubmitted = false;
    }

    // Exchange rate state
    todayRate?: ExchangeRateResponse;
    tcTodayLoading = false;
    tcRangeFrom = this.localToday();
    tcRangeTo   = this.localToday();
    tcRangeLoading = false;
    tcRangeSubmitted = false;

    get tcRangeError(): string {
        if (!this.tcRangeFrom || !this.tcRangeTo) return 'Ambas fechas son requeridas';
        if (this.tcRangeFrom > this.tcRangeTo) return 'La fecha inicial no puede ser mayor a la final';
        const [fy, fm] = this.tcRangeFrom.split('-');
        const [ty, tm] = this.tcRangeTo.split('-');
        if (fy !== ty || fm !== tm) return 'El rango debe estar dentro del mismo mes y año';
        return '';
    }

    onTcFromChange(e: { dateStr: string }): void { this.tcRangeFrom = e.dateStr; }
    onTcToChange(e: { dateStr: string }): void { this.tcRangeTo = e.dateStr; }

    updateTodayRate(): void {
        const today = this.localToday();
        this.tcTodayLoading = true;
        this.exchangeRateService.bulkImport(today, today).subscribe({
            next: res => {
                this.tcTodayLoading = false;
                this.todayRate = res.data?.[0] ?? this.todayRate;
                this.notify.success(res?.message ?? 'Tipo de cambio del día actualizado', 'Tipo de cambio');
            },
            error: err => {
                this.tcTodayLoading = false;
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar el tipo de cambio');
            },
        });
    }

    updateRangeRate(): void {
        this.tcRangeSubmitted = true;
        if (this.tcRangeError) return;
        this.tcRangeLoading = true;
        this.exchangeRateService.bulkImport(this.tcRangeFrom, this.tcRangeTo).subscribe({
            next: res => {
                this.tcRangeLoading = false;
                this.tcRangeSubmitted = false;
                this.notify.success(res?.message ?? 'Tipos de cambio actualizados', 'Tipo de cambio');
            },
            error: err => {
                this.tcRangeLoading = false;
                this.notify.error(err?.error?.message ?? 'No se pudo actualizar el tipo de cambio');
            },
        });
    }

    private localToday(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    constructor(
        private configService: ConfigurationService,
        private userService: UserService,
        private exchangeRateService: ExchangeRateService,
        private notify: NotificationService
    ) { }

    ngOnInit(): void {
        this.load();
        this.exchangeRateService.getToday().subscribe({
            next: res => { this.todayRate = res.data ?? undefined; },
            error: () => {}
        });
    }

    load(): void {
        this.loading = true;
        this.configService.findEditable().subscribe({
            next: res => {
                const all = (res.data ?? []).filter(c => !this.EXCLUDED_KEYS.has(c.configKey));
                const groupMap = new Map<string, ConfigGroup>();

                const groupOrder = ['empresa_emisora', 'detraccion_retencion', 'sunat_envio', 'tipo_cambio'];

                for (const key of groupOrder) {
                    groupMap.set(key, { label: this.GROUP_LABELS[key] ?? key, configs: [] });
                }

                for (const c of all) {
                    const gKey = c.configGroup;
                    if (!groupMap.has(gKey)) {
                        groupMap.set(gKey, { label: this.GROUP_LABELS[gKey] ?? gKey, configs: [] });
                    }
                    groupMap.get(gKey)!.configs.push({ ...c, editValue: c.configValue ?? '' });
                }

                // Ordenar cada grupo por sortOrder
                for (const group of groupMap.values()) {
                    group.configs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                }

                this.groups = [...groupMap.values()].filter(g => g.configs.length > 0);
                this.loading = false;
            },
            error: () => {
                this.notify.error('No se pudo cargar la configuración', 'Error');
                this.loading = false;
            }
        });
    }

    saveAll(): void {
        const dirty = this.allConfigs.filter(c => c.editValue !== (c.configValue ?? ''));
        if (dirty.length === 0) {
            this.notify.info('No hay cambios que guardar', 'Sin cambios');
            return;
        }

        this.saving = true;
        let pending = dirty.length;
        let hasError = false;

        for (const c of dirty) {
            this.configService.update(c.id, c.editValue, c.editable).subscribe({
                next: () => {
                    c.configValue = c.editValue;
                    pending--;
                    if (pending === 0) {
                        this.saving = false;
                        if (!hasError) this.notify.success('Configuración guardada correctamente', 'Guardado');
                    }
                },
                error: () => {
                    hasError = true;
                    pending--;
                    if (pending === 0) {
                        this.saving = false;
                        this.notify.error('Algunos valores no pudieron guardarse', 'Error parcial');
                    }
                }
            });
        }
    }

    reset(): void {
        for (const c of this.allConfigs) {
            c.editValue = c.configValue ?? '';
        }
        this.notify.info('Cambios descartados', 'Restablecer');
    }

    get allConfigs(): (ConfigurationResponse & { editValue: string })[] {
        return this.groups.flatMap(g => g.configs);
    }

    get hasDirty(): boolean {
        return this.allConfigs.some(c => c.editValue !== (c.configValue ?? ''));
    }

    inputType(datatype: string): string {
        switch (datatype?.toUpperCase()) {
            case 'INTEGER': return 'number';
            case 'DECIMAL': return 'number';
            default: return 'text';
        }
    }

    isTextarea(c: ConfigurationResponse): boolean {
        return c.configKey === 'emprDireccionFiscal';
    }

    isModeSelect(c: ConfigurationResponse): boolean {
        return c.configKey.endsWith('_modo');
    }
}
