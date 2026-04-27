import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { NotificationService } from '../../../shared/components/ui/notification/notification.service';
import { ProfileService } from '../../../services/profile.service';
import { MenuService } from '../../../services/menu.service';
import { ProfileResponse } from '../../../dto/profile.response';
import { MenuResponse } from '../../../dto/menu.response';

interface MenuTreeNode {
    parent: MenuResponse;
    children: (MenuResponse & { checked: boolean })[];
    allChecked: boolean;
    someChecked: boolean;
    expanded: boolean;
}

@Component({
    selector: 'app-profiles',
    standalone: true,
    imports: [CommonModule, FormsModule, PageBreadcrumbComponent, BadgeComponent],
    templateUrl: './profiles.component.html',
})
export class ProfilesComponent implements OnInit {

    // Profiles list
    profiles: ProfileResponse[] = [];
    loading = false;
    searchTerm = '';

    // Create/Edit modal
    showModal = false;
    isEditing = false;
    submitting = false;
    formSubmitted = false;
    editingId: number | null = null;
    formName = '';
    formStatus = 1;

    // Permissions panel
    selectedProfile: ProfileResponse | null = null;
    menuTree: MenuTreeNode[] = [];
    loadingPermissions = false;
    savingPermissions = false;

    get filteredProfiles(): ProfileResponse[] {
        const t = this.searchTerm.trim().toLowerCase();
        return t ? this.profiles.filter(p => p.name.toLowerCase().includes(t)) : this.profiles;
    }

    get selectedMenuIds(): number[] {
        const ids: number[] = [];
        for (const node of this.menuTree) {
            const checkedChildren = node.children.filter(c => c.checked);
            if (checkedChildren.length > 0) {
                ids.push(node.parent.id);
                checkedChildren.forEach(c => ids.push(c.id));
            }
        }
        return ids;
    }

    constructor(
        private profileService: ProfileService,
        private menuService: MenuService,
        private notify: NotificationService,
    ) {}

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.profileService.getAll().subscribe({
            next: res => {
                this.profiles = res.data ?? [];
                this.loading = false;
            },
            error: () => {
                this.notify.error('Error al cargar perfiles');
                this.loading = false;
            }
        });
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingId = null;
        this.formSubmitted = false;
        this.formName = '';
        this.formStatus = 1;
        this.showModal = true;
    }

    openEdit(profile: ProfileResponse): void {
        this.isEditing = true;
        this.editingId = profile.id;
        this.formSubmitted = false;
        this.formName = profile.name;
        this.formStatus = profile.status;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    get formError(): string {
        if (!this.formName.trim()) return 'El nombre es obligatorio';
        return '';
    }

    saveProfile(): void {
        this.formSubmitted = true;
        if (this.formError) return;
        this.submitting = true;
        const req = { name: this.formName.trim(), status: this.formStatus };
        const op$ = this.isEditing
            ? this.profileService.update(this.editingId!, req)
            : this.profileService.create(req);

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

    toggleStatus(profile: ProfileResponse): void {
        const newStatus = profile.status === 1 ? 0 : 1;
        this.profileService.updateStatus(profile.id, { status: newStatus }).subscribe({
            next: () => {
                profile.status = newStatus;
                this.notify.success(`Perfil ${newStatus === 1 ? 'activado' : 'desactivado'}`);
            },
            error: err => this.notify.error(err?.error?.message ?? 'Error al cambiar estado')
        });
    }

    selectProfile(profile: ProfileResponse): void {
        this.selectedProfile = profile;
        this.loadPermissions(profile.id);
    }

    private loadPermissions(profileId: number): void {
        this.loadingPermissions = true;
        this.menuTree = [];

        this.menuService.getAll().subscribe({
            next: allRes => {
                this.profileService.getMenus(profileId).subscribe({
                    next: assignedRes => {
                        const allMenus = allRes.data ?? [];
                        const assignedIds = new Set((assignedRes.data ?? []).map(m => m.id));
                        this.buildMenuTree(allMenus, assignedIds);
                        this.loadingPermissions = false;
                    },
                    error: () => {
                        this.notify.error('Error al cargar permisos del perfil');
                        this.loadingPermissions = false;
                    }
                });
            },
            error: () => {
                this.notify.error('Error al cargar menús');
                this.loadingPermissions = false;
            }
        });
    }

    private buildMenuTree(allMenus: MenuResponse[], assignedIds: Set<number>): void {
        const parents = allMenus.filter(m => !m.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
        this.menuTree = parents.map(parent => {
            const children = allMenus
                .filter(m => m.parentId === parent.id)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(c => ({ ...c, checked: assignedIds.has(c.id) }));

            const allChecked = children.length > 0 && children.every(c => c.checked);
            const someChecked = children.some(c => c.checked);
            return { parent, children, allChecked, someChecked, expanded: true };
        }).filter(n => n.children.length > 0);
    }

    toggleParent(node: MenuTreeNode): void {
        const newVal = !node.allChecked;
        node.children.forEach(c => c.checked = newVal);
        this.updateNodeState(node);
    }

    toggleChild(node: MenuTreeNode, child: MenuResponse & { checked: boolean }): void {
        child.checked = !child.checked;
        this.updateNodeState(node);
    }

    private updateNodeState(node: MenuTreeNode): void {
        node.allChecked = node.children.length > 0 && node.children.every(c => c.checked);
        node.someChecked = node.children.some(c => c.checked);
    }

    toggleNodeExpand(node: MenuTreeNode): void {
        node.expanded = !node.expanded;
    }

    savePermissions(): void {
        if (!this.selectedProfile) return;
        this.savingPermissions = true;
        this.profileService.updateMenus(this.selectedProfile.id, { menuIds: this.selectedMenuIds }).subscribe({
            next: res => {
                this.notify.success(res.message ?? 'Permisos guardados correctamente');
                this.savingPermissions = false;
            },
            error: err => {
                this.notify.error(err?.error?.message ?? 'Error al guardar permisos');
                this.savingPermissions = false;
            }
        });
    }

    get permissionsCount(): number {
        return this.selectedMenuIds.length;
    }

    checkedCount(node: MenuTreeNode): number {
        return node.children.filter(c => c.checked).length;
    }
}
