import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import axios from 'axios';
import { AppStorageService } from './storage.service';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: { id: number; email: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://192.168.1.100:9000/mobiles2-api/login.php';

  constructor(private readonly appStorage: AppStorageService) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = Capacitor.isNativePlatform()
      ? await this.loginWithNativeHttp(email, password)
      : await this.loginWithAxios(email, password);

    if (!data.success || !data.token) {
      throw new Error('El API no devolvio una sesion valida.');
    }

    await this.setSessionValue('auth_token', data.token);
    await this.setSessionValue('auth_user', data.user);
    return data;
  }

  private async loginWithNativeHttp(email: string, password: string): Promise<LoginResponse> {
    const response = await CapacitorHttp.post({
      url: this.apiUrl,
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      connectTimeout: 10000,
      readTimeout: 10000,
      responseType: 'json',
    });

    if (response.status >= 400) {
      throw new Error(response.data?.message ?? `API HTTP ${response.status}`);
    }

    return response.data as LoginResponse;
  }

  private async loginWithAxios(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, { email, password }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getSessionValue<string>('auth_token');
    if (token) {
      return true;
    }

    // Migrate sessions created by the previous localStorage implementation.
    const legacyToken = localStorage.getItem('auth_token');
    if (!legacyToken) {
      return false;
    }

    await this.setSessionValue('auth_token', legacyToken);
    const legacyUser = localStorage.getItem('auth_user');
    if (legacyUser) {
      await this.setSessionValue('auth_user', JSON.parse(legacyUser));
    }

    return true;
  }

  async logout(): Promise<void> {
    await Promise.all([
      this.appStorage.remove('auth_token'),
      this.appStorage.remove('auth_user'),
      Preferences.remove({ key: 'auth_token' }),
      Preferences.remove({ key: 'auth_user' }),
    ]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  private async setSessionValue<T>(key: string, value: T): Promise<void> {
    await Preferences.set({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    });

    try {
      await this.withTimeout(this.appStorage.set(key, value), 3000);
      return;
    } catch {
      // Preferences already contains the session and remains the native fallback.
    }
  }

  private async getSessionValue<T>(key: string): Promise<T | null> {
    // Read the native persistent store first so app restarts keep the session.
    const nativeValue = await Preferences.get({ key });
    if (nativeValue.value !== null) {
      return this.parseStoredValue<T>(nativeValue.value);
    }

    try {
      const value = await this.withTimeout(this.appStorage.get<T>(key), 1500);
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Use Capacitor Preferences when the web storage driver is unavailable.
    }

    return null;
  }

  private parseStoredValue<T>(value: string): T {
    if (value.startsWith('{') || value.startsWith('[')) {
      return JSON.parse(value) as T;
    }

    return value as T;
  }

  private async withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Storage timeout')), milliseconds);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
