import { Injectable, signal } from '@angular/core';

type OnlineListener = () => void;

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly isOnline = signal(this.readInitialStatus());
  private readonly onlineListeners = new Set<OnlineListener>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  onOnline(listener: OnlineListener): () => void {
    this.onlineListeners.add(listener);
    return () => this.onlineListeners.delete(listener);
  }

  private readonly handleOnline = (): void => {
    this.isOnline.set(true);
    this.onlineListeners.forEach((listener) => listener());
  };

  private readonly handleOffline = (): void => {
    this.isOnline.set(false);
  };

  private readInitialStatus(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine;
  }
}
