import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { mail, map, book, barChart, settings } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { ConnectivityService } from '../services/connectivity.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonLabel,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonTitle,
    IonToolbar,
  ],
})
export class TabsPage {
  private readonly connectivity = inject(ConnectivityService);
  readonly isOnline = this.connectivity.isOnline;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    addIcons({ mail, map, book, barChart, settings });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
