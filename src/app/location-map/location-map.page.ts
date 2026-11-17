import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import * as L from 'leaflet';
import { LocationService, UserLocation } from '../services/location.service';

@Component({
  selector: 'app-location-map',
  templateUrl: 'location-map.page.html',
  styleUrls: ['location-map.page.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class LocationMapPage implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement') private mapElement?: ElementRef<HTMLDivElement>;

  private readonly locationService = inject(LocationService);

  readonly location = this.locationService.currentLocation;
  readonly isLoading = this.locationService.isLoading;
  readonly errorMessage = this.locationService.errorMessage;
  readonly mapError = signal('');
  regionName = '';
  private map?: L.Map;
  private marker?: L.CircleMarker;
  private tileLayer?: L.TileLayer;

  async ngAfterViewInit(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    this.createMap();
    const saved = await this.locationService.loadSaved();
    if (saved) {
      this.showLocation(saved);
    }
    try {
      const current = await this.locationService.locateUser();
      this.showLocation(current);
    } catch {
      // A saved location remains visible when current permission or GPS fails.
    }
  }

  ionViewDidEnter(): void {
    // Leaflet needs the final size after the Ionic tab transition completes.
    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 400);
  }

  async refreshLocation(): Promise<void> {
    try {
      const current = await this.locationService.locateUser();
      this.showLocation(current);
    } catch {
      // The service exposes the error message for the template.
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private createMap(): void {
    if (!this.mapElement || this.map) return;

    this.map = L.map(this.mapElement.nativeElement, { zoomControl: true }).setView([23.6345, -102.5528], 3);
    this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.tileLayer.on('tileerror', () => {
      this.mapError.set('No se pudo cargar el mapa base. Verifica la conexion a Internet.');
    });
    this.map.invalidateSize();
  }

  private showLocation(location: UserLocation): void {
    if (!this.map) return;

    const point: L.LatLngExpression = [location.latitude, location.longitude];
    this.marker?.remove();
    this.marker = L.circleMarker(point, {
      radius: 9,
      color: '#173042',
      fillColor: '#c56a3b',
      fillOpacity: .9,
      weight: 3,
    }).addTo(this.map);
    this.marker.bindPopup('Ubicacion actual del usuario').openPopup();
    this.map.setView(point, 10);
    this.regionName = this.locationService.regionForCoordinates(location.latitude, location.longitude);
  }
}
