import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { isAxiosError } from 'axios';
import { ContactMessage, ContactService } from '../services/contact.service';

@Component({
  selector: 'app-tab5',
  templateUrl: 'tab5.page.html',
  styleUrls: ['tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab5Page {
  messages: ContactMessage[] = [];
  newMessage: ContactMessage = this.emptyMessage();
  editingMessage: ContactMessage | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  private readonly contactService = inject(ContactService);

  constructor() {
    void this.loadMessages();
  }

  async loadMessages(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.contactService.getAll();
      this.messages = Array.isArray(response.data) ? response.data : [];
    } catch (error: unknown) {
      this.errorMessage = this.getErrorMessage(error, 'No se pudieron cargar los mensajes.');
    } finally {
      this.isLoading = false;
    }
  }

  async createMessage(): Promise<void> {
    this.resetFeedback();
    if (!this.isValid(this.newMessage)) {
      this.errorMessage = 'Nombre, correo y mensaje son obligatorios.';
      return;
    }

    this.isSaving = true;
    try {
      await this.contactService.create({ ...this.newMessage });
      this.newMessage = this.emptyMessage();
      this.successMessage = 'Mensaje creado correctamente.';
      await this.loadMessages();
    } catch (error: unknown) {
      this.errorMessage = this.getErrorMessage(error, 'No se pudo crear el mensaje.');
    } finally {
      this.isSaving = false;
    }
  }

  startEditing(message: ContactMessage): void {
    this.resetFeedback();
    this.editingMessage = { ...message };
  }

  cancelEditing(): void {
    this.editingMessage = null;
  }

  async updateMessage(): Promise<void> {
    if (!this.editingMessage?.id || !this.isValid(this.editingMessage)) {
      this.errorMessage = 'El registro editado no tiene datos válidos.';
      return;
    }

    await this.saveEditedMessage('patch');
  }

  async replaceMessage(): Promise<void> {
    if (!this.editingMessage?.id || !this.isValid(this.editingMessage)) {
      this.errorMessage = 'El registro editado no tiene datos válidos.';
      return;
    }

    await this.saveEditedMessage('put');
  }

  async deleteMessage(message: ContactMessage): Promise<void> {
    if (!message.id) return;

    this.resetFeedback();
    this.isSaving = true;
    try {
      await this.contactService.delete(message.id);
      this.successMessage = 'Mensaje eliminado correctamente.';
      await this.loadMessages();
    } catch (error: unknown) {
      this.errorMessage = this.getErrorMessage(error, 'No se pudo eliminar el mensaje.');
    } finally {
      this.isSaving = false;
    }
  }

  private async saveEditedMessage(method: 'patch' | 'put'): Promise<void> {
    if (!this.editingMessage?.id) return;

    this.resetFeedback();
    this.isSaving = true;
    const message = { ...this.editingMessage };
    const messageId = this.editingMessage.id;
    try {
      if (method === 'patch') {
        await this.contactService.update(messageId, message);
      } else {
        await this.contactService.replace(messageId, message);
      }
      this.editingMessage = null;
      this.successMessage = method === 'patch'
        ? 'Mensaje actualizado con PATCH.'
        : 'Mensaje reemplazado con PUT.';
      await this.loadMessages();
    } catch (error: unknown) {
      this.errorMessage = this.getErrorMessage(error, 'No se pudo guardar el mensaje.');
    } finally {
      this.isSaving = false;
    }
  }

  private isValid(message: ContactMessage): boolean {
    return Boolean(message.names.trim() && message.email.trim() && message.message.trim());
  }

  private resetFeedback(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return isAxiosError(error) ? error.response?.data?.message ?? fallback : fallback;
  }

  private emptyMessage(): ContactMessage {
    return { names: '', phone: '', email: '', message: '' };
  }
}
