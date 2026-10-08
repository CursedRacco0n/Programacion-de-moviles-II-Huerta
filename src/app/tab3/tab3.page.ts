import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { RegionSelectionService } from '../services/region-selection.service';
import { LegendService, UrbanLegend } from '../services/legend.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab3Page implements OnInit {
  private readonly regionSelection = inject(RegionSelectionService);
  private readonly legendService = inject(LegendService);
  private readonly route = inject(ActivatedRoute);

  selectedLegend = signal<UrbanLegend | null>(null);
  loading = signal(false);
  errorMessage = signal('');
  private requestNumber = 0;

  constructor() {
    effect(() => {
      const selectedRegionId = this.regionSelection.selectedRegionId();
      const routeLegendId = this.route.snapshot.queryParamMap.get('legend');
      if (selectedRegionId && !routeLegendId) {
        void this.loadLegend(selectedRegionId);
      }
    });
  }

  ngOnInit(): void {
    void this.refreshLegend();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.refreshLegend();
  }

  private async refreshLegend(): Promise<void> {
    const routeRegionId = this.route.snapshot.queryParamMap.get('region');
    const routeLegendId = Number(this.route.snapshot.queryParamMap.get('legend'));
    const regionId = routeRegionId ?? await this.regionSelection.load();

    if (!regionId) {
      this.selectedLegend.set(null);
      return;
    }

    // Keep the persistent selection synchronized with the route value.
    if (routeRegionId && routeRegionId !== this.regionSelection.selectedRegionId()) {
      await this.regionSelection.select(routeRegionId);
    }

    await this.loadLegend(regionId, routeLegendId > 0 ? routeLegendId : undefined);
  }

  private async loadLegend(regionId: string, legendId?: number): Promise<void> {
    const requestNumber = ++this.requestNumber;
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const legend = legendId
        ? await this.legendService.getById(legendId)
        : await this.legendService.getByRegion(regionId);
      if (requestNumber === this.requestNumber) {
        this.selectedLegend.set(legend);
      }
    } catch (error) {
      if (requestNumber === this.requestNumber) {
        this.selectedLegend.set(null);
        this.errorMessage.set(error instanceof Error
          ? error.message
          : 'No fue posible cargar la leyenda desde la API.');
      }
    } finally {
      if (requestNumber === this.requestNumber) {
        this.loading.set(false);
      }
    }
  }
}
