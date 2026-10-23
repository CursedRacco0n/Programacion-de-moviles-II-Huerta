import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { PhotoService } from '../services/photo.service';

interface PhotoFilter {
  id: string;
  label: string;
  css: string;
}

@Component({
  selector: 'app-camera',
  templateUrl: 'camera.page.html',
  styleUrls: ['camera.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class CameraPage {
  readonly image = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly filters: PhotoFilter[] = [
    { id: 'none', label: 'Original', css: 'none' },
    { id: 'warm', label: 'Calido', css: 'sepia(.35) saturate(1.35)' },
    { id: 'mono', label: 'Blanco y negro', css: 'grayscale(1)' },
    { id: 'night', label: 'Nocturno', css: 'brightness(.72) contrast(1.2) saturate(1.15)' },
    { id: 'vivid', label: 'Intenso', css: 'saturate(1.8) contrast(1.12)' },
  ];
  selectedFilter = this.filters[0];
  private capturedWidth = 0;
  private capturedHeight = 0;

  private readonly photoService = inject(PhotoService);
  private readonly router = inject(Router);

  async takePhoto(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      const dataUrl = await this.photoService.capturePhoto();
      const dimensions = await this.getImageDimensions(dataUrl);
      this.capturedWidth = dimensions.width;
      this.capturedHeight = dimensions.height;
      this.image.set(dataUrl);
    } catch (error) {
      this.errorMessage.set(error instanceof Error
        ? error.message
        : 'No fue posible acceder a la camara.');
    }
  }

  selectFilter(filter: PhotoFilter): void {
    this.selectedFilter = filter;
  }

  async savePhoto(): Promise<void> {
    const original = this.image();
    if (!original) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    try {
      const filteredImage = await this.applyFilter(original, this.selectedFilter.css);
      await this.photoService.saveEditedPhoto(
        filteredImage,
        this.selectedFilter.id,
        this.capturedWidth,
        this.capturedHeight,
      );
      this.successMessage.set('Foto guardada correctamente.');
    } catch (error) {
      this.errorMessage.set(error instanceof Error
        ? error.message
        : 'No fue posible guardar la foto.');
    } finally {
      this.isSaving.set(false);
    }
  }

  openMetadata(): void {
    void this.router.navigateByUrl('/tabs/photo-metadata');
  }

  filterStyle(): string {
    return this.selectedFilter.css === 'none' ? 'none' : this.selectedFilter.css;
  }

  private applyFilter(dataUrl: string, cssFilter: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('No se pudo preparar el filtro de la imagen.'));
          return;
        }
        context.filter = cssFilter;
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', .92));
      };
      image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      image.src = dataUrl;
    });
  }

  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('No se pudieron leer las dimensiones de la imagen.'));
      image.src = dataUrl;
    });
  }
}
