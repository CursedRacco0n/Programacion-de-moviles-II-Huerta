import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import axios from 'axios';
import { AppStorageService } from './storage.service';

export interface RegionStatistic {
  region: string;
  origin: string;
  legend_count: number;
}

export interface StatisticsResponse {
  success: boolean;
  data?: RegionStatistic[];
  total_legends?: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly apiUrl = 'http://localhost:9000/mobiles2-api/region_stats.php';

  constructor(private readonly appStorage: AppStorageService) {}

  async getRegionStatistics(): Promise<RegionStatistic[]> {
    try {
      const response = Capacitor.isNativePlatform()
        ? await this.getWithNativeHttp()
        : await this.getWithAxios();

      if (!response.success || !response.data) {
        throw new Error(response.message ?? 'No se pudieron cargar las estadisticas.');
      }

      await this.appStorage.set('region_statistics_cache', response.data);
      return response.data;
    } catch (error) {
      const cached = await this.appStorage.get<RegionStatistic[]>('region_statistics_cache');
      if (cached?.length) {
        return cached;
      }
      throw error;
    }
  }

  private async getWithNativeHttp(): Promise<StatisticsResponse> {
    const response = await CapacitorHttp.get({
      url: this.apiUrl,
      connectTimeout: 10000,
      readTimeout: 10000,
      responseType: 'json',
    });

    if (response.status >= 400) {
      throw new Error(response.data?.message ?? `API HTTP ${response.status}`);
    }

    return this.parseResponse(response.data);
  }

  private async getWithAxios(): Promise<StatisticsResponse> {
    const response = await axios.get<StatisticsResponse>(this.apiUrl, { timeout: 10000 });
    return response.data;
  }

  private parseResponse(value: unknown): StatisticsResponse {
    if (typeof value === 'string') {
      return JSON.parse(value) as StatisticsResponse;
    }

    return value as StatisticsResponse;
  }
}
