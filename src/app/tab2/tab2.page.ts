import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { RegionSelectionService } from '../services/region-selection.service';
import { LegendService, UrbanLegend } from '../services/legend.service';

interface Region {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab2Page implements OnInit {
  private readonly regionSelection = inject(RegionSelectionService);
  private readonly router = inject(Router);
  private readonly legendService = inject(LegendService);

  readonly regions: Region[] = [
    {
      id: 'norteamerica',
      name: 'Norteamérica',
      description: 'Relatos de carreteras, pueblos abandonados y apariciones nocturnas.',
    },
    {
      id: 'latinoamerica',
      name: 'Latinoamérica',
      description: 'Leyendas populares, espíritus protectores y misterios de cada comunidad.',
    },
    {
      id: 'europa',
      name: 'Europa',
      description: 'Castillos, bosques antiguos y relatos transmitidos durante generaciones.',
    },
    {
      id: 'asia',
      name: 'Asia',
      description: 'Historias urbanas modernas mezcladas con mitos y tradiciones ancestrales.',
    },
  ];

  selectedRegionId = this.regions[0].id;
  confirmedRegion: Region | null = null;
  availableLegends: UrbanLegend[] = [];
  selectedLegendId: number | null = null;
  isLoadingLegends = false;
  selectionError = '';

  async ngOnInit(): Promise<void> {
    const savedRegionId = await this.regionSelection.load();
    if (savedRegionId && this.regions.some((region) => region.id === savedRegionId)) {
      this.selectedRegionId = savedRegionId;
      this.confirmedRegion = this.regions.find((region) => region.id === savedRegionId) ?? null;
      await this.loadLegendsForSelection();
    }
  }

  async loadLegendsForSelection(): Promise<void> {
    this.availableLegends = [];
    this.selectedLegendId = null;
    this.selectionError = '';
    this.isLoadingLegends = true;

    try {
      this.availableLegends = await this.legendService.getAllByRegion(this.selectedRegionId);
      if (this.availableLegends.length === 1) {
        this.selectedLegendId = this.availableLegends[0].id;
      }
    } catch (error) {
      this.selectionError = error instanceof Error
        ? error.message
        : 'No fue posible cargar las leyendas de la región.';
    } finally {
      this.isLoadingLegends = false;
    }
  }

  async selectRegion(): Promise<void> {
    if (this.availableLegends.length === 0 && !this.isLoadingLegends) {
      await this.loadLegendsForSelection();
    }

    if (this.isLoadingLegends || this.availableLegends.length === 0) {
      return;
    }

    if (this.availableLegends.length > 1 && !this.selectedLegendId) {
      this.selectionError = 'Selecciona una leyenda para continuar.';
      return;
    }

    this.confirmedRegion =
      this.regions.find((region) => region.id === this.selectedRegionId) ?? null;
    await this.regionSelection.select(this.selectedRegionId);
    await this.router.navigate(['/tabs/tab3'], {
      queryParams: { region: this.selectedRegionId, legend: this.selectedLegendId },
    });
  }
}
