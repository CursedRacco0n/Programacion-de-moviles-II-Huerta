import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import axios from 'axios';

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

  async getRegionStatistics(): Promise<RegionStatistic[]> {
    const response = Capacitor.isNativePlatform()
      ? await this.getWithNativeHttp()
      : await this.getWithAxios();

    if (!response.success || !response.data) {
      throw new Error(response.message ?? 'No se pudieron cargar las estadisticas.');
    }

    return response.data;
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
