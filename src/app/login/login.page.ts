import { Component, inject, signal } from '@angular/core';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { isAxiosError } from 'axios';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = signal('');
  isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  async login(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Ingresa tu correo y contrasena.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.withTimeout(
        this.authService.login(this.email.trim(), this.password),
        15000,
      );
      this.zone.run(() => {
        this.isLoading.set(false);
        void this.router.navigateByUrl('/tabs/tab1');
      });
    } catch (error: unknown) {
      const message = isAxiosError(error)
        ? error.code === 'ECONNABORTED'
          ? 'El API tardo demasiado en responder.'
          : error.code === 'ERR_NETWORK'
            ? 'No se pudo conectar con el API. Verifica la IP, el puerto 9000 y que el telefono este en la misma red.'
          : error.response?.status === 404
            ? 'No se encontro el API. Revisa la carpeta de XAMPP.'
            : error.response?.data?.message
        : error instanceof Error && error.message === 'LOGIN_TIMEOUT'
          ? 'El login tardo demasiado. Verifica que el telefono pueda acceder a la API.'
          : undefined;

      this.zone.run(() => {
        this.isLoading.set(false);
        this.errorMessage.set(message ?? 'No se pudo iniciar sesion.');
      });
    }
  }

  private async withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('LOGIN_TIMEOUT')),
        milliseconds,
      );
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
