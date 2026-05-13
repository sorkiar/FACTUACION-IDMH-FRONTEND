import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavStateService {
    private _paths = new BehaviorSubject<string[]>([]);
    readonly paths$ = this._paths.asObservable();

    private readonly _sidebarReload = new Subject<void>();
    readonly sidebarReload$ = this._sidebarReload.asObservable();

    setPaths(paths: string[]): void {
        this._paths.next(paths);
    }

    hasPath(path: string): boolean {
        return this._paths.value.includes(path);
    }

    reloadSidebar(): void {
        this._sidebarReload.next();
    }
}
