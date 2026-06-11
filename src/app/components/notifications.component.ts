import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service'; 

@Component({
  selector: 'app-notifications-list', // ✅ Changement de sélecteur pour éviter le conflit avec la page principale
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <h2>Mes Notifications Bancaires</h2>
      <ul *ngIf="notifications && notifications.length > 0">
        <li *ngFor="let notif of notifications">
          <p>{{ notif.message }}</p>
          <small>{{ notif.created_at | date:'short' }}</small>
        </li>
      </ul>
      <p *ngIf="notifications.length === 0">Aucune notification disponible.</p>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];

  // ✅ Injection du bon service ici
  constructor(private notifService: NotificationService) {} 

  ngOnInit(): void {
    // ✅ getNotifications attend un numéro de page (ex: 1) et renvoie un objet avec la propriété .results
    this.notifService.getNotifications(1).subscribe({
      next: (res: any) => {
        this.notifications = res.results || [];
      },
      error: (err) => {
        console.error('Erreur de chargement Django', err);
      }
    });
  }
}
