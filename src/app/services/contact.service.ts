import { Injectable } from '@angular/core';
import axios from 'axios';

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
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly apiUrl = 'http://localhost:9000/mobiles2-api/contact_messages.php';

  async create(message: ContactMessage): Promise<ContactApiResponse> {
    const response = await axios.post<ContactApiResponse>(this.apiUrl, message, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }

  async getAll(): Promise<ContactApiResponse> {
    const response = await axios.get<ContactApiResponse>(this.apiUrl);
    return response.data;
  }

  async getById(id: number): Promise<ContactApiResponse> {
    const response = await axios.get<ContactApiResponse>(this.apiUrl, { params: { id } });
    return response.data;
  }

  async update(id: number, message: Partial<ContactMessage>): Promise<ContactApiResponse> {
    const response = await axios.patch<ContactApiResponse>(this.apiUrl, message, {
      params: { id },
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }

  async replace(id: number, message: ContactMessage): Promise<ContactApiResponse> {
    const response = await axios.put<ContactApiResponse>(this.apiUrl, message, {
      params: { id },
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }

  async delete(id: number): Promise<ContactApiResponse> {
    const response = await axios.delete<ContactApiResponse>(this.apiUrl, { params: { id } });
    return response.data;
  }
}
