import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationComponent } from './notification.component';
import { NotificationService } from './notification.service';

@Component({
    selector: 'app-notification-container',
    standalone: true,
    imports: [CommonModule, NotificationComponent],
    templateUrl: './notification-container.component.html',
})
export class NotificationContainerComponent {
    constructor(public notifications: NotificationService) { }

    dismiss(id: string) {
        this.notifications.dismiss(id);
    }
}
