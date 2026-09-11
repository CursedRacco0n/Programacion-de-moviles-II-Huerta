import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { triangle, images, square } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

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
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    addIcons({ triangle, images, square });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
