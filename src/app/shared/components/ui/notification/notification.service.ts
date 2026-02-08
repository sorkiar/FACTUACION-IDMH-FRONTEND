import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationVariant = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
    id: string;
    variant: NotificationVariant;
    title?: string;
    message: string;
    durationMs?: number; // 0 = no autoclose
    closable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly _items$ = new BehaviorSubject<NotificationItem[]>([]);
    readonly items$ = this._items$.asObservable();

    show(item: Omit<NotificationItem, 'id'>): string {
        const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

        const notification: NotificationItem = {
            id,
            variant: item.variant ?? 'info',
            title: item.title ?? '',
            message: item.message,
            durationMs: item.durationMs ?? 3500,
            closable: item.closable ?? true,
        };

        const current = this._items$.value;
        this._items$.next([notification, ...current]);

        // autoclose
        if ((notification.durationMs ?? 0) > 0) {
            setTimeout(() => this.dismiss(id), notification.durationMs);
        }

        return id;
    }

    dismiss(id: string) {
        this._items$.next(this._items$.value.filter(n => n.id !== id));
    }

    clear() {
        this._items$.next([]);
    }

    // helpers
    success(message: string, title = 'Éxito', durationMs = 3000) {
        return this.show({ variant: 'success', title, message, durationMs });
    }
    error(message: string, title = 'Error', durationMs = 4500) {
        return this.show({ variant: 'error', title, message, durationMs });
    }
    warning(message: string, title = 'Aviso', durationMs = 4000) {
        return this.show({ variant: 'warning', title, message, durationMs });
    }
    info(message: string, title = 'Info', durationMs = 3500) {
        return this.show({ variant: 'info', title, message, durationMs });
    }
}
