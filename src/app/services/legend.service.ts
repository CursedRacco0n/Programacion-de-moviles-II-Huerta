import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import axios from 'axios';

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
  data?: UrbanLegend;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class LegendService {
  private readonly apiUrl = 'http://192.168.1.100:9000/mobiles2-api/urban_legends.php';

  async getByRegion(region: string): Promise<UrbanLegend> {
    const data = Capacitor.isNativePlatform()
      ? await this.getWithNativeHttp(region)
      : await this.getWithAxios(region);

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'No se encontro una leyenda.');
    }

    return data.data;
  }

  private async getWithNativeHttp(region: string): Promise<LegendApiResponse> {
    const response = await CapacitorHttp.get({
      url: this.apiUrl,
      params: { region },
      connectTimeout: 10000,
      readTimeout: 10000,
      responseType: 'json',
    });

    if (response.status >= 400) {
      throw new Error(response.data?.message ?? `API HTTP ${response.status}`);
    }

    return this.parseResponse(response.data);
  }

  private async getWithAxios(region: string): Promise<LegendApiResponse> {
    const response = await axios.get<LegendApiResponse>(this.apiUrl, {
      params: { region },
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
