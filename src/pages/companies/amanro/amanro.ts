import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NegocioService, NegocioDetalle } from '../../../shared/services/negocio.service';

@Component({
  selector: 'app-amanro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amanro.html',
})
export class Amanro implements OnInit {
  private negocioService = inject(NegocioService);

  negocio = signal<NegocioDetalle | null>(null);
  loading = signal<boolean>(true);

  whatsappPhoneNumber: string = '51954121196';

  ngOnInit() {
    this.loadData('amanro');
  }

  loadData(codigo: string) {
    this.negocioService.getNegocioByCodigo(codigo).subscribe({
      next: (data) => {
        this.negocio.set(data);
        this.loading.set(false);
        console.log(data);
      },
      error: (err) => {
        console.error('Error loading negocio detail', err);
        this.loading.set(false);
      }
    });
  }

  sendWhatsAppOrder() {
    let orderMessage = "¡Hola! Me gustaría hacer un pedido.\n\n¡Espero su confirmación!";
    const encodedMessage = encodeURIComponent(orderMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }
}
