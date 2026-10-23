import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import exifr from 'exifr';
import { PhotoService, UserPhoto } from '../services/photo.service';

interface ImageMetadata {
  fileName: string;
  path: string;
  width: number | string;
  height: number | string;
  filter: string;
  createdAt: string;
  fileSize: string;
  exif: Record<string, unknown>;
}

@Component({
  selector: 'app-photo-metadata',
  templateUrl: 'photo-metadata.page.html',
  styleUrls: ['photo-metadata.page.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class PhotoMetadataPage implements OnInit {
  readonly selectedPhoto = signal<UserPhoto | null>(null);
  readonly metadata = signal<ImageMetadata | null>(null);
  readonly errorMessage = signal('');

  private readonly photoService = inject(PhotoService);
  readonly photos = this.photoService.photos;

  objectKeys(value: Record<string, unknown>): string[] {
    return Object.keys(value);
  }

  objectEntries(value: Record<string, unknown>): [string, unknown][] {
    return Object.entries(value);
  }

  async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
    const photo = this.photos()[0] ?? null;
    if (photo) {
      await this.selectPhoto(photo);
    }
  }

  async selectPhoto(photo: UserPhoto): Promise<void> {
    this.selectedPhoto.set(photo);
    this.errorMessage.set('');
    this.metadata.set(await this.readMetadata(photo));
  }

  private async readMetadata(photo: UserPhoto): Promise<ImageMetadata> {
    const exif = photo.webviewPath
      ? await this.readExif(photo.webviewPath)
      : {};
    const exifWidth = typeof exif['ImageWidth'] === 'number' ? exif['ImageWidth'] : 'No disponible';
    const exifHeight = typeof exif['ImageHeight'] === 'number' ? exif['ImageHeight'] : 'No disponible';
    return {
      fileName: photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1),
      path: photo.filepath,
      width: photo.width ?? exifWidth,
      height: photo.height ?? exifHeight,
      filter: photo.filter ?? 'none',
      createdAt: photo.createdAt ? new Date(photo.createdAt).toLocaleString() : 'No disponible',
      fileSize: photo.size
        ? `${photo.size} bytes`
        : typeof exif['FileSize'] === 'number' ? `${exif['FileSize']} bytes` : 'No disponible',
      exif,
    };
  }

  private async readExif(path: string): Promise<Record<string, unknown>> {
    try {
      const result = await exifr.parse(path, { tiff: true, exif: true, gps: true });
      return result ? this.cleanExif(result as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  private cleanExif(exif: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(exif).filter(([, value]) => {
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    }));
  }
}
