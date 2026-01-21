import { Component, inject } from '@angular/core';
import { AppConfigService } from '../services/app-config.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
})
export class Footer {
  private configService = inject(AppConfigService);
  currentYear = new Date().getFullYear();

  get phoneNumber(): string {
    return this.configService.phoneNumber || '51954121196';
  }

  get phoneNumberDisplay(): string {
    return this.configService.phoneNumberDisplay || '+51 954 121 196';
  }

  get whatsappLink(): string {
    return `https://wa.me/${this.phoneNumber}?text=Hola%20Espacio%20Online,te%20contacto%20desde%20el%20sitio%20web`;
  }
}
