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

  async ngOnInit(): Promise<void> {
    const savedRegionId = await this.regionSelection.load();
    if (savedRegionId && this.regions.some((region) => region.id === savedRegionId)) {
      this.selectedRegionId = savedRegionId;
      this.confirmedRegion = this.regions.find((region) => region.id === savedRegionId) ?? null;
    }
  }

  async selectRegion(): Promise<void> {
    this.confirmedRegion =
      this.regions.find((region) => region.id === this.selectedRegionId) ?? null;
    await this.regionSelection.select(this.selectedRegionId);
    await this.router.navigate(['/tabs/tab3'], {
      queryParams: { region: this.selectedRegionId },
    });
  }
}
