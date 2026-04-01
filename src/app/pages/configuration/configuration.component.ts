import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { ConfigurationResponse } from '../../dto/configuration.response';
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

    constructor(
        private configService: ConfigurationService,
        private notify: NotificationService
    ) { }

    ngOnInit(): void {
        this.load();
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
