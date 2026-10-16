import { Injectable } from '@angular/core';
import axios from 'axios';
import { AppStorageService } from './storage.service';
import { ConnectivityService } from './connectivity.service';

export interface ContactMessage {
  id?: number;
  names: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactApiResponse {
  success: boolean;
  id?: number;
  message?: string;
  data?: ContactMessage | ContactMessage[];
  queued?: boolean;
}

interface PendingContact {
  type: 'create' | 'update' | 'replace' | 'delete';
  id?: number;
  message?: ContactMessage | Partial<ContactMessage>;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly apiUrl = 'http://localhost:9000/mobiles2-api/contact_messages.php';
  private readonly cacheKey = 'contact_messages_cache';
  private readonly pendingKey = 'pending_contact_messages';
  private syncing = false;

  constructor(
    private readonly appStorage: AppStorageService,
    private readonly connectivity: ConnectivityService,
  ) {
    this.connectivity.onOnline(() => void this.flushPending());
  }

  async create(message: ContactMessage): Promise<ContactApiResponse> {
    if (!this.connectivity.isOnline()) {
      await this.queueOperation({ type: 'create', message: { ...message } });
      return {
        success: true,
        queued: true,
        message: 'Mensaje guardado localmente. Se enviara al recuperar la conexion.',
      };
    }

    try {
      const response = await axios.post<ContactApiResponse>(this.apiUrl, message, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      await this.clearCache();
      return response.data;
    } catch (error) {
      if (!this.isNetworkError(error)) {
        throw error;
      }

      await this.queueOperation({ type: 'create', message: { ...message } });
      return {
        success: true,
        queued: true,
        message: 'Sin conexion. El mensaje quedo guardado y se sincronizara despues.',
      };
    }
  }

  async getAll(): Promise<ContactApiResponse> {
    try {
      const response = await axios.get<ContactApiResponse>(this.apiUrl, { timeout: 10000 });
      if (Array.isArray(response.data.data)) {
        await this.appStorage.set(this.cacheKey, response.data.data);
      }
      return response.data;
    } catch (error) {
      const cached = await this.appStorage.get<ContactMessage[]>(this.cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Mostrando datos guardados localmente.',
        };
      }
      throw error;
    }
  }

  async getById(id: number): Promise<ContactApiResponse> {
    const response = await axios.get<ContactApiResponse>(this.apiUrl, { params: { id } });
    return response.data;
  }

  async update(id: number, message: Partial<ContactMessage>): Promise<ContactApiResponse> {
    if (!this.connectivity.isOnline()) {
      await this.queueOperation({ type: 'update', id, message: { ...message } });
      return this.queuedResponse('Los cambios se sincronizaran al recuperar la conexion.');
    }

    try {
      const response = await axios.patch<ContactApiResponse>(this.apiUrl, message, {
        params: { id },
        headers: { 'Content-Type': 'application/json' },
      });
      await this.clearCache();
      return response.data;
    } catch (error) {
      if (!this.isNetworkError(error)) throw error;
      await this.queueOperation({ type: 'update', id, message: { ...message } });
      return this.queuedResponse('Sin conexion. Los cambios se sincronizaran despues.');
    }
  }

  async replace(id: number, message: ContactMessage): Promise<ContactApiResponse> {
    if (!this.connectivity.isOnline()) {
      await this.queueOperation({ type: 'replace', id, message: { ...message } });
      return this.queuedResponse('Los cambios se sincronizaran al recuperar la conexion.');
    }

    try {
      const response = await axios.put<ContactApiResponse>(this.apiUrl, message, {
        params: { id },
        headers: { 'Content-Type': 'application/json' },
      });
      await this.clearCache();
      return response.data;
    } catch (error) {
      if (!this.isNetworkError(error)) throw error;
      await this.queueOperation({ type: 'replace', id, message: { ...message } });
      return this.queuedResponse('Sin conexion. Los cambios se sincronizaran despues.');
    }
  }

  async delete(id: number): Promise<ContactApiResponse> {
    if (!this.connectivity.isOnline()) {
      await this.queueOperation({ type: 'delete', id });
      return this.queuedResponse('La eliminacion se sincronizara al recuperar la conexion.');
    }

    try {
      const response = await axios.delete<ContactApiResponse>(this.apiUrl, { params: { id } });
      await this.clearCache();
      return response.data;
    } catch (error) {
      if (!this.isNetworkError(error)) throw error;
      await this.queueOperation({ type: 'delete', id });
      return this.queuedResponse('Sin conexion. La eliminacion se sincronizara despues.');
    }
  }

  private async queueOperation(operation: PendingContact): Promise<void> {
    const pending = await this.appStorage.get<PendingContact[]>(this.pendingKey) ?? [];
    pending.push(operation);
    await this.appStorage.set(this.pendingKey, pending);
  }

  private async flushPending(): Promise<void> {
    if (this.syncing || !this.connectivity.isOnline()) return;

    this.syncing = true;
    try {
      const pending = await this.appStorage.get<PendingContact[]>(this.pendingKey) ?? [];
      const remaining: PendingContact[] = [];

      for (const [index, operation] of pending.entries()) {
        try {
          if (operation.type === 'create') {
            await axios.post<ContactApiResponse>(this.apiUrl, operation.message, this.jsonConfig());
          } else if (operation.type === 'update') {
            await axios.patch<ContactApiResponse>(this.apiUrl, operation.message, {
              ...this.jsonConfig(),
              params: { id: operation.id },
            });
          } else if (operation.type === 'replace') {
            await axios.put<ContactApiResponse>(this.apiUrl, operation.message, {
              ...this.jsonConfig(),
              params: { id: operation.id },
            });
          } else {
            await axios.delete<ContactApiResponse>(this.apiUrl, { params: { id: operation.id }, timeout: 10000 });
          }
        } catch (error) {
          if (this.isNetworkError(error)) {
            remaining.push(...pending.slice(index));
            break;
          }
        }
      }

      await this.appStorage.set(this.pendingKey, remaining);
      if (remaining.length !== pending.length) {
        await this.clearCache();
      }
    } finally {
      this.syncing = false;
    }
  }

  private async clearCache(): Promise<void> {
    await this.appStorage.remove(this.cacheKey);
  }

  private isNetworkError(error: unknown): boolean {
    return axios.isAxiosError(error) && !error.response;
  }

  private jsonConfig() {
    return {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  private queuedResponse(message: string): ContactApiResponse {
    return { success: true, queued: true, message };
  }
}
