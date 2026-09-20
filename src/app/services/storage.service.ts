import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class AppStorageService {
  private readonly storage = inject(Storage);
  private readonly ready = this.storage.create();

  async get<T>(key: string): Promise<T | null> {
    await this.ready;
    return (await this.storage.get(key)) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ready;
    await this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.ready;
    await this.storage.remove(key);
  }
}
