import { CommonModule } from '@angular/common';
import { Component, NgZone, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isAxiosError } from 'axios';
import { ContactService } from '../services/contact.service';

interface ContactForm {
  names: string;
  phone: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class Tab1Page {
  formData: ContactForm = {
    names: '',
    phone: '',
    email: '',
    message: '',
  };

  errors: string[] = [];
  successMessage = '';
  isSubmitting = false;

  private readonly contactService = inject(ContactService);
  private readonly zone = inject(NgZone);

  async submitContactForm(): Promise<void> {
    this.errors = [];
    this.successMessage = '';

    if (!this.formData.names.trim()) {
      this.errors.push('Escriba un nombre.');
    }

    if (!this.formData.email.trim()) {
      this.errors.push('Ingrese un correo.');
    }

    if (!this.formData.message.trim()) {
      this.errors.push('Escriba un mensaje.');
    }

    if (this.errors.length > 0) {
      return;
    }

    this.isSubmitting = true;

    try {
      await this.contactService.create({ ...this.formData });
      this.zone.run(() => {
        this.isSubmitting = false;
        this.successMessage = 'Mensaje enviado correctamente.';
        this.formData = { names: '', phone: '', email: '', message: '' };
      });
    } catch (error: unknown) {
      const apiMessage = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;

      this.zone.run(() => {
        this.isSubmitting = false;
        this.errors = [apiMessage ?? 'No se pudo guardar el mensaje.'];
      });
    }
  }
}
