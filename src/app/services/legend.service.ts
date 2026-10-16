import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import axios from 'axios';
import { AppStorageService } from './storage.service';

export interface UrbanLegend {
  id: number;
  region: string;
  origin: string;
  title: string;
  summary: string;
  details: string;
  source?: string | null;
}

interface LegendApiResponse {
  success: boolean;
  data?: UrbanLegend | UrbanLegend[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class LegendService {
  private readonly apiUrl = 'http://localhost:9000/mobiles2-api/urban_legends.php';

  constructor(private readonly appStorage: AppStorageService) {}

  async getByRegion(region: string): Promise<UrbanLegend> {
    try {
      const data = Capacitor.isNativePlatform()
        ? await this.getWithNativeHttp(region)
        : await this.getWithAxios(region);

      if (!data.success || !data.data || Array.isArray(data.data)) {
        throw new Error(data.message ?? 'No se encontro una leyenda.');
      }

      await this.appStorage.set(this.cacheKey(region), [data.data]);
      await this.appStorage.set(this.legendKey(data.data.id), data.data);
      return data.data;
    } catch (error) {
      const cached = await this.appStorage.get<UrbanLegend[]>(this.cacheKey(region));
      if (cached?.[0]) {
        return cached[0];
      }
      throw error;
    }
  }

  async getAllByRegion(region: string): Promise<UrbanLegend[]> {
    try {
      const data = Capacitor.isNativePlatform()
        ? await this.getWithNativeHttp(region, { all: '1' })
        : await this.getWithAxios(region, { all: '1' });

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message ?? 'No se encontraron leyendas.');
      }

      await this.appStorage.set(this.cacheKey(region), data.data);
      for (const legend of data.data) {
        await this.appStorage.set(this.legendKey(legend.id), legend);
      }
      return data.data;
    } catch (error) {
      const cached = await this.appStorage.get<UrbanLegend[]>(this.cacheKey(region));
      if (cached?.length) {
        return cached;
      }
      throw error;
    }
  }

  async getById(id: number): Promise<UrbanLegend> {
    try {
      const data = Capacitor.isNativePlatform()
        ? await this.getWithNativeHttp('', { id: String(id) })
        : await this.getWithAxios('', { id: String(id) });

      if (!data.success || !data.data || Array.isArray(data.data)) {
        throw new Error(data.message ?? 'No se encontro la leyenda seleccionada.');
      }

      await this.appStorage.set(this.legendKey(id), data.data);
      return data.data;
    } catch (error) {
      const cached = await this.appStorage.get<UrbanLegend>(this.legendKey(id));
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  private cacheKey(region: string): string {
    return `legend_cache_${region}`;
  }

  private legendKey(id: number): string {
    return `legend_cache_id_${id}`;
  }

  private async getWithNativeHttp(region: string, params: Record<string, string> = {}): Promise<LegendApiResponse> {
    const response = await CapacitorHttp.get({
      url: this.apiUrl,
      params: region ? { region, ...params } : params,
      connectTimeout: 10000,
      readTimeout: 10000,
      responseType: 'json',
    });

    if (response.status >= 400) {
      throw new Error(response.data?.message ?? `API HTTP ${response.status}`);
    }

    return this.parseResponse(response.data);
  }

  private async getWithAxios(region: string, params: Record<string, string> = {}): Promise<LegendApiResponse> {
    const response = await axios.get<LegendApiResponse>(this.apiUrl, {
      params: region ? { region, ...params } : params,
      timeout: 10000,
    });

    return response.data;
  }

  private parseResponse(value: unknown): LegendApiResponse {
    if (typeof value === 'string') {
      return JSON.parse(value) as LegendApiResponse;
    }

    return value as LegendApiResponse;
  }
}
