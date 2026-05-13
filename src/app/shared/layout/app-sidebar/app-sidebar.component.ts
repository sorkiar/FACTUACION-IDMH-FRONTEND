import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { catchError, combineLatest, forkJoin, of, Subscription } from 'rxjs';
import { MenuService } from '../../../services/menu.service';
import { NavStateService } from '../../../services/nav-state.service';
import { SidebarItemResponse } from '../../../dto/sidebar-item.response';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const ICON_MAP: Record<string, string> = {
  'Inicio': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
  'Inventario': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.77344 5.25C7.77344 4.00736 8.7808 3 10.0234 3H14.0234C15.2661 3 16.2734 4.00736 16.2734 5.25V6H19.2736C20.5163 6 21.5236 7.00736 21.5236 8.25V17.25C21.5236 18.4926 20.5163 19.5 19.2736 19.5H4.77344C3.5308 19.5 2.52344 18.4926 2.52344 17.25V8.25C2.52344 7.00736 3.5308 6 4.77344 6H7.77344V5.25ZM14.7734 5.25V6H9.27344V5.25C9.27344 4.83579 9.60922 4.5 10.0234 4.5H14.0234C14.4377 4.5 14.7734 4.83579 14.7734 5.25ZM4.77344 7.5H19.2736C19.6879 7.5 20.0236 7.83579 20.0236 8.25V10.5H14.605C14.3242 9.90876 13.7215 9.5 13.0234 9.5H11.0234C10.3253 9.5 9.72271 9.90876 9.44185 10.5H4.02344V8.25C4.02344 7.83579 4.35922 7.5 4.77344 7.5ZM9.44185 12H4.02344V17.25C4.02344 17.6642 4.35922 18 4.77344 18H19.2736C19.6879 18 20.0236 17.6642 20.0236 17.25V12H14.605C14.3242 12.5912 13.7215 13 13.0234 13H11.0234C10.3253 13 9.72271 12.5912 9.44185 12Z" fill="currentColor"/></svg>`,
  'General': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 7a4 4 0 1 1 8 0A4 4 0 0 1 8 7zm0 6a5 5 0 0 0-5 5 1 1 0 0 0 1 1h14a1 1 0 0 0 1-1 5 5 0 0 0-5-5H8z" fill="currentColor"/></svg>`,
  'Facturación': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5V8H18.5L13 3.5zM8 13a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H8zm0-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2H8z" fill="currentColor"/></svg>`,
  'Reportes': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'Reportes y consultas': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'Seguridad': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25L3.75 5.5v6.25c0 4.556 3.5 8.816 8.25 9.75 4.75-.934 8.25-5.194 8.25-9.75V5.5L12 2.25zM12 4l6.75 2.5v5.25c0 3.614-2.75 6.934-6.75 7.75-4-.816-6.75-4.136-6.75-7.75V6.5L12 4zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4 2a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="currentColor"/></svg>`,
  'Configuración': `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-6 4a6 6 0 1 1 12 0 6 6 0 0 1-12 0zm6-10a1 1 0 0 1 1 1v1.07A8.002 8.002 0 0 1 19.93 10H21a1 1 0 1 1 0 2h-1.07A8.002 8.002 0 0 1 13 19.93V21a1 1 0 1 1-2 0v-1.07A8.002 8.002 0 0 1 4.07 13H3a1 1 0 1 1 0-2h1.07A8.002 8.002 0 0 1 11 4.07V3a1 1 0 0 1 1-1z" fill="currentColor"/></svg>`,
};

const DEFAULT_ICON = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 6a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm1 5a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2H4z" fill="currentColor"/></svg>`;

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [];
  loadingSidebar = true;

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private menuService: MenuService,
    private navState: NavStateService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    this.loadSidebar();

    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(() => {
        this.cdr.detectChanges();
      })
    );

    this.subscription.add(
      this.navState.sidebarReload$.subscribe(() => this.loadSidebar())
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadSidebar(): void {
    this.loadingSidebar = true;
    const empty = of({ data: [] as SidebarItemResponse[] });
    forkJoin({
      sidebar: this.menuService.getSidebar(),
      navbar: this.menuService.getNavbar().pipe(catchError(() => empty)),
      internal: this.menuService.getInternal().pipe(catchError(() => empty)),
    }).subscribe({
      next: ({ sidebar, navbar, internal }) => {
        const items = sidebar.data ?? [];
        this.navItems = items.map(item => this.mapItem(item));
        const paths: string[] = [];
        const addPaths = (list: SidebarItemResponse[]) => list.forEach(item => {
          if (item.path) paths.push(item.path);
          item.subItems?.forEach(s => paths.push(s.path));
        });
        addPaths(items);
        addPaths(navbar.data ?? []);
        addPaths(internal.data ?? []);
        this.navState.setPaths(paths);
        this.loadingSidebar = false;
        this.setActiveMenuFromRoute(this.router.url);
        this.cdr.detectChanges();
      },
      error: () => {
        this.navItems = [];
        this.loadingSidebar = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapItem(item: SidebarItemResponse): NavItem {
    return {
      name: item.name,
      icon: ICON_MAP[item.name] ?? DEFAULT_ICON,
      path: item.path ?? undefined,
      subItems: item.subItems?.map(s => ({ name: s.name, path: s.path })),
    };
  }

  isActive(path: string): boolean {
    if (path === '/') return this.router.url === '/';
    return this.router.url.startsWith(path);
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;
    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;
      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) this.sidebarService.setHovered(true);
    }).unsubscribe();
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) this.sidebarService.setMobileOpen(false);
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    this.navItems.forEach((nav, i) => {
      if (nav.subItems) {
        nav.subItems.forEach(subItem => {
          if (currentUrl === subItem.path || currentUrl.startsWith(subItem.path)) {
            const key = `main-${i}`;
            this.openSubmenu = key;
            setTimeout(() => {
              const el = document.getElementById(key);
              if (el) {
                this.subMenuHeights[key] = el.scrollHeight;
                this.cdr.detectChanges();
              }
            });
          }
        });
      }
    });
  }
}
