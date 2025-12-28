import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css',
})
export class CookieConsent {
  private readonly CONSENT_KEY = 'cookie_consent_accepted';
  showConsent = signal<boolean>(false);

  constructor() {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem(this.CONSENT_KEY);
    if (!hasAccepted) {
      this.showConsent.set(true);
    }
  }

  acceptCookies() {
    localStorage.setItem(this.CONSENT_KEY, 'true');
    this.showConsent.set(false);
  }

  rejectCookies() {
    // For now, just hide the banner. In a real app, you might want to disable non-essential cookies
    localStorage.setItem(this.CONSENT_KEY, 'rejected');
    this.showConsent.set(false);
  }
}
