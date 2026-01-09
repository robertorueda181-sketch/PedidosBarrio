import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NegocioService, NegocioDetalle } from '../../../shared/services/negocio.service';

@Component({
  selector: 'app-stacion64',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stacion64.html',
  styleUrl: './stacion64.css',
})
export class Stacion64 implements OnInit {
  private negocioService = inject(NegocioService);

  negocio = signal<NegocioDetalle | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadData('stacion64');
  }

  loadData(codigo: string) {
    this.negocioService.getNegocioByCodigo(codigo).subscribe({
      next: (data) => {
        this.negocio.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading negocio detail', err);
        this.loading.set(false);
      }
    });
  }
}
