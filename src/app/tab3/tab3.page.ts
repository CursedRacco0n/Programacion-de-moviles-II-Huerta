import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ExploreContainerComponent, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class Tab3Page {
  constructor() {}
}
