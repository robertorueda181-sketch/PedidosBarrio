import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { CookieConsent } from '../../app/shared/cookie-consent/cookie-consent';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, CookieConsent],
  templateUrl: './layout.html',
})
export class Layout {
}
