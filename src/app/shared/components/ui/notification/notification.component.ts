import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotificationItem } from './notification.service';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification.component.html',
})
export class NotificationComponent {
    @Input({ required: true }) item!: NotificationItem;
    @Output() close = new EventEmitter<string>();

    get variantClasses() {
        return {
            success: 'border-success-500/40 bg-success-50 dark:bg-success-500/10',
            error: 'border-error-500/40 bg-error-50 dark:bg-error-500/10',
            warning: 'border-warning-500/40 bg-warning-50 dark:bg-warning-500/10',
            info: 'border-blue-light-500/40 bg-blue-light-50 dark:bg-blue-light-500/10',
        }[this.item.variant];
    }

    get titleClasses() {
        return {
            success: 'text-success-700 dark:text-success-200',
            error: 'text-error-700 dark:text-error-200',
            warning: 'text-warning-700 dark:text-warning-200',
            info: 'text-blue-light-700 dark:text-blue-light-200',
        }[this.item.variant];
    }

    onClose() {
        this.close.emit(this.item.id);
    }
}
