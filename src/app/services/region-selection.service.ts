import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AppStorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class RegionSelectionService {
  private readonly appStorage = inject(AppStorageService);
  private readonly storageKey = 'selected_region_id';

  readonly selectedRegionId = signal<string | null>(null);
  private initialized = false;

  async load(): Promise<string | null> {
    if (!this.initialized) {
      const nativeValue = await Preferences.get({ key: this.storageKey });
      const savedRegionId = nativeValue.value
        ?? await this.appStorage.get<string>(this.storageKey);

      // A selection can happen while the first storage read is pending.
      // Do not overwrite that newer selection with the old stored value.
      if (!this.initialized) {
        this.selectedRegionId.set(savedRegionId);
        this.initialized = true;
      }
    }

    return this.selectedRegionId();
  }

  async select(regionId: string): Promise<void> {
    this.selectedRegionId.set(regionId);
    this.initialized = true;
    await Preferences.set({ key: this.storageKey, value: regionId });

    try {
      await this.appStorage.set(this.storageKey, regionId);
    } catch {
      // Preferences is the persistent store used by the native app.
    }
  }
}
