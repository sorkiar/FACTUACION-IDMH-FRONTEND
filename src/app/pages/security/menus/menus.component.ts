import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { Option, SelectComponent } from '../../../shared/components/form/select/select.component';
import { NotificationService } from '../../../shared/components/ui/notification/notification.service';
import { MenuService } from '../../../services/menu.service';
import { MenuResponse } from '../../../dto/menu.response';
import { MenuRequest } from '../../../dto/menu.request';

interface MenuNode extends MenuResponse {
    children: MenuNode[];
    expanded: boolean;
}

@Component({
    selector: 'app-menus',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent, BadgeComponent, SelectComponent],
    templateUrl: './menus.component.html',
})
export class MenusComponent implements OnInit {

    menus: MenuResponse[] = [];
    tree: MenuNode[] = [];
    loading = false;

    // Modal
    showModal = false;
    isEditing = false;
    submitting = false;

    form: MenuRequest = { name: '', path: '', parentId: undefined, sortOrder: 1, menuType: 'SIDEBAR' };
    editingId: number | null = null;
    formSubmitted = false;
    editingHasChildren = false;

    get pathDisabled(): boolean {
        // Es hijo → siempre habilitado
        if (!!this.form.parentId || !!this.parentIdStr) return false;
        // Es raíz en edición con hijos → deshabilitado
        return this.editingHasChildren;
    }

    readonly menuTypeOptions: Option[] = [
        { value: 'SIDEBAR',   label: 'Sidebar — visible en menú lateral' },
        { value: 'NAVBAR',    label: 'Navbar — visible en barra superior' },
        { value: 'INTERNAL',  label: 'Internal — solo permisos, no visible' },
    ];

    menuTypeColors: Record<string, string> = {
        SIDEBAR:  'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400',
        NAVBAR:   'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
        INTERNAL: 'text-gray-500 bg-gray-100 dark:bg-white/10 dark:text-gray-400',
    };

    get parentMenus(): MenuResponse[] {
        return this.menus.filter(m => !m.parentId);
    }

    get parentMenuOptions(): Option[] {
        return this.parentMenus.map(m => ({ value: String(m.id), label: m.name }));
    }

    get parentIdStr(): string {
        return this.form.parentId != null ? String(this.form.parentId) : '';
    }

    set parentIdStr(val: string) {
        if (val) {
            const parent = this.menus.find(m => m.id === Number(val));
            if (parent?.path) {
                this.notify.warning(`"${parent.name}" tiene una ruta asignada. Elimínala antes de asignarle submenús.`);
                return;
            }
        }
        this.form.parentId = val ? Number(val) : undefined;
        if (!val) this.form.path = '';
    }

    menuTypeLabel(type: string): string {
        return { SIDEBAR: 'Sidebar', NAVBAR: 'Navbar', INTERNAL: 'Internal' }[type] ?? type;
    }

    constructor(
        private menuService: MenuService,
        private notify: NotificationService,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.menuService.getAll().subscribe({
            next: res => {
                this.menus = res.data ?? [];
                this.buildTree();
                this.loading = false;
            },
            error: () => {
                this.notify.error('Error al cargar menús');
                this.loading = false;
            }
        });
    }

    private buildTree(): void {
        const roots = this.menus.filter(m => !m.parentId);
        this.tree = roots
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(r => ({
                ...r,
                expanded: true,
                children: this.menus
                    .filter(m => m.parentId === r.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(c => ({ ...c, expanded: false, children: [] }))
            }));
    }

    openCreate(parentId?: number): void {
        this.isEditing = false;
        this.editingId = null;
        this.editingHasChildren = false;
        this.formSubmitted = false;
        this.form = { name: '', path: '', parentId: parentId ?? undefined, sortOrder: 1, menuType: 'SIDEBAR' };
        this.showModal = true;
    }

    openEdit(menu: MenuResponse): void {
        this.isEditing = true;
        this.editingId = menu.id;
        this.formSubmitted = false;
        const node = this.tree.find(n => n.id === menu.id);
        this.editingHasChildren = !!(node && node.children.length > 0);
        this.form = {
            name: menu.name,
            path: menu.path ?? '',
            parentId: menu.parentId ?? undefined,
            sortOrder: menu.sortOrder,
            menuType: menu.menuType ?? 'SIDEBAR',
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    get formError(): string {
        if (!this.form.name?.trim()) return 'El nombre es obligatorio';
        if (this.form.sortOrder == null) return 'El orden es obligatorio';
        return '';
    }

    save(): void {
        this.formSubmitted = true;
        if (this.formError) return;
        this.submitting = true;
        const req: MenuRequest = {
            name: this.form.name.trim(),
            path: !this.pathDisabled ? (this.form.path?.trim() || undefined) : undefined,
            parentId: this.form.parentId || undefined,
            sortOrder: this.form.sortOrder,
            menuType: this.form.menuType || 'SIDEBAR',
        };
        const op$ = this.isEditing
            ? this.menuService.update(this.editingId!, req)
            : this.menuService.create(req);

        op$.subscribe({
            next: res => {
                this.notify.success(res.message ?? 'Guardado correctamente');
                this.submitting = false;
                this.showModal = false;
                this.load();
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al guardar');
                this.submitting = false;
            }
        });
    }

    toggleStatus(menu: MenuResponse): void {
        const newStatus = menu.status === 1 ? 0 : 1;
        this.menuService.updateStatus(menu.id, { status: newStatus }).subscribe({
            next: () => {
                menu.status = newStatus;
                this.notify.success(`Menú ${newStatus === 1 ? 'activado' : 'desactivado'}`);
            },
            error: err => this.notify.error(err?.error?.message ?? 'Error al cambiar estado')
        });
    }

    toggleExpand(node: MenuNode): void {
        node.expanded = !node.expanded;
    }
}
