import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ExploreContainerComponent],
})
export class Tab1Page {
  constructor() {}
}
