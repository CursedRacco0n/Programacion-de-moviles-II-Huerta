import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

interface PositionLike {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  readonly currentLocation = signal<UserLocation | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  private readonly storageKey = 'last_user_location';

  async loadSaved(): Promise<UserLocation | null> {
    const saved = await Preferences.get({ key: this.storageKey });
    if (!saved.value) return null;

    try {
      const location = JSON.parse(saved.value) as UserLocation;
      this.currentLocation.set(location);
      return location;
    } catch {
      return null;
    }
  }

  async locateUser(): Promise<UserLocation> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const position = Capacitor.isNativePlatform()
        ? await this.getNativePosition()
        : await this.getBrowserPosition();
      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString(),
      };

      this.currentLocation.set(location);
      await Preferences.set({ key: this.storageKey, value: JSON.stringify(location) });
      return location;
    } catch (error) {
      this.errorMessage.set(error instanceof Error
        ? error.message
        : 'No fue posible obtener la ubicacion del dispositivo.');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  regionForCoordinates(latitude: number, longitude: number): string {
    if (latitude >= 30 && longitude >= -170 && longitude <= -30) {
      return 'norteamerica';
    }
    if (latitude >= 35 && latitude <= 72 && longitude >= -25 && longitude <= 45) {
      return 'europa';
    }
    if (longitude >= 45 || (latitude >= 20 && longitude > 30)) {
      return 'asia';
    }
    return 'latinoamerica';
  }

  private async getNativePosition(): Promise<PositionLike> {
    const permissions = await Geolocation.checkPermissions();
    if (permissions.location !== 'granted') {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== 'granted') {
        throw new Error('Permiso de ubicacion denegado.');
      }
    }

    return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
  }

  private getBrowserPosition(): Promise<PositionLike> {
    if (!navigator.geolocation) {
      return Promise.reject(new Error('La geolocalizacion no esta disponible en este navegador.'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, (error) => {
        reject(new Error(this.browserErrorMessage(error.code)));
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
    });
  }

  private browserErrorMessage(code: number): string {
    if (code === 1) return 'Permiso de ubicacion denegado.';
    if (code === 2) return 'No se pudo determinar la ubicacion.';
    if (code === 3) return 'La ubicacion tardo demasiado en responder.';
    return 'No fue posible obtener la ubicacion.';
  }
}
