import { Injectable } from '@angular/core';
import axios from 'axios';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: { id: number; email: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:9000/mobiles2-api/login.php';

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, { email, password }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = response.data;

    if (!data.success || !data.token) {
      throw new Error('El API no devolvió una sesión válida.');
    }

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}
