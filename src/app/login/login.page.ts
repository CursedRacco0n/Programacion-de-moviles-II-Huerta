import { Component, inject } from '@angular/core';
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
  errorMessage = '';
  isLoading = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  async login(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email.trim(), this.password);
      this.zone.run(() => {
        this.isLoading = false;
        void this.router.navigateByUrl('/tabs/tab1');
      });
    } catch (error: unknown) {
      const message = isAxiosError(error)
        ? error.code === 'ECONNABORTED'
          ? 'El API tardo demasiado en responder.'
          : error.response?.status === 404
            ? 'No se encontro el API. Revisa la carpeta de XAMPP.'
            : error.response?.data?.message
        : undefined;

      this.zone.run(() => {
        this.isLoading = false;
        this.errorMessage = message ?? 'No se pudo iniciar sesion.';
      });
    }
  }
}
