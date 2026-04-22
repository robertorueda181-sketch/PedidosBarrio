import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from '../../services/cookie.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cookie-banner" *ngIf="showBanner()">
      <div class="cookie-content">
        <div class="cookie-icon">🍪</div>
        <div class="cookie-text">
          <h3>Usamos cookies</h3>
          <p>
            Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio 
            y recordar tus preferencias. Al hacer clic en "Aceptar", aceptas el uso de cookies.
          </p>
        </div>
        <div class="cookie-actions">
          <button class="btn-settings" (click)="showSettings()">
            Configurar
          </button>
          <button class="btn-accept" (click)="acceptAll()">
            Aceptar todas
          </button>
        </div>
      </div>

      <!-- Panel de configuración -->
      <div class="cookie-settings" *ngIf="showSettingsPanel()">
        <h4>Configuración de Cookies</h4>
        
        <div class="cookie-option">
          <label class="cookie-toggle">
            <input type="checkbox" checked disabled>
            <span class="toggle-slider"></span>
          </label>
          <div class="option-info">
            <div class="option-title">Cookies necesarias</div>
            <div class="option-desc">
              Requeridas para el funcionamiento básico del sitio. No se pueden desactivar.
            </div>
          </div>
        </div>

        <div class="cookie-option">
          <label class="cookie-toggle">
            <input 
              type="checkbox" 
              [(ngModel)]="analyticsEnabled"
              (change)="updatePreferences()">
            <span class="toggle-slider"></span>
          </label>
          <div class="option-info">
            <div class="option-title">Cookies de análisis</div>
            <div class="option-desc">
              Nos ayudan a entender cómo usas el sitio para mejorarlo. Incluyen 
              seguimiento de páginas visitadas, tiempo de permanencia y búsquedas.
            </div>
          </div>
        </div>

        <div class="cookie-option">
          <label class="cookie-toggle">
            <input 
              type="checkbox" 
              [(ngModel)]="marketingEnabled"
              (change)="updatePreferences()">
            <span class="toggle-slider"></span>
          </label>
          <div class="option-info">
            <div class="option-title">Cookies de marketing</div>
            <div class="option-desc">
              Usadas para mostrar anuncios relevantes basados en tus intereses.
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn-cancel" (click)="closeSettings()">
            Cancelar
          </button>
          <button class="btn-save" (click)="savePreferences()">
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .cookie-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .cookie-icon {
      font-size: 3rem;
    }

    .cookie-text {
      flex: 1;
    }

    .cookie-text h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .cookie-text p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .cookie-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-settings,
    .btn-accept {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-settings {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-settings:hover {
      background: #e5e7eb;
    }

    .btn-accept {
      background: #3b82f6;
      color: white;
    }

    .btn-accept:hover {
      background: #2563eb;
    }

    .cookie-settings {
      border-top: 1px solid #e5e7eb;
      padding: 1.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .cookie-settings h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .cookie-option {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .cookie-option:last-child {
      border-bottom: none;
    }

    .cookie-toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 28px;
      flex-shrink: 0;
    }

    .cookie-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #d1d5db;
      transition: 0.3s;
      border-radius: 28px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: #3b82f6;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    input:disabled + .toggle-slider {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    .option-info {
      flex: 1;
    }

    .option-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .option-desc {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .settings-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .btn-cancel,
    .btn-save {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-save {
      background: #3b82f6;
      color: white;
    }

    .btn-save:hover {
      background: #2563eb;
    }

    @media (max-width: 768px) {
      .cookie-content {
        flex-direction: column;
        align-items: flex-start;
        padding: 1rem;
      }

      .cookie-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn-settings,
      .btn-accept {
        width: 100%;
      }
    }
  `]
})
export class CookieConsentComponent {
  private cookieService = inject(CookieService);

  showBanner = signal(false);
  showSettingsPanel = signal(false);
  analyticsEnabled = true;
  marketingEnabled = false;

  constructor() {
    // Verificar si el usuario ya aceptó las cookies
    if (!this.cookieService.exists('cookie_consent')) {
      this.showBanner.set(true);
    }
  }

  acceptAll() {
    this.saveCookieConsent(true, true);
    this.showBanner.set(false);
  }

  showSettings() {
    this.showSettingsPanel.set(true);
  }

  closeSettings() {
    this.showSettingsPanel.set(false);
  }

  updatePreferences() {
    // Método llamado cuando cambian los toggles
  }

  savePreferences() {
    this.saveCookieConsent(this.analyticsEnabled, this.marketingEnabled);
    this.showBanner.set(false);
    this.showSettingsPanel.set(false);
  }

  private saveCookieConsent(analytics: boolean, marketing: boolean) {
    const consent = {
      analytics,
      marketing,
      necessary: true, // Siempre true
      timestamp: new Date().toISOString()
    };

    this.cookieService.setObject('cookie_consent', consent, {
      expires: 365,
      sameSite: 'Lax'
    });
  }
}
