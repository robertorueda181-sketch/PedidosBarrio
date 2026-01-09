import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Negocio, NegocioService } from '../../shared/services/negocio.service';

@Component({
    selector: 'app-negocios',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './negocios.html',
})
export class NegociosComponent implements OnInit {
    private negocioService = inject(NegocioService);
    private router = inject(Router);

    negocios = signal<Negocio[]>([]);
    loading = signal<boolean>(true);

    ngOnInit() {
        this.loadNegocios();
    }

    loadNegocios() {
        this.negocioService.getNegocios().subscribe({
            next: (data) => {
                this.negocios.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading negocios', err);
                this.loading.set(false);
            }
        });
    }

    goToNegocio(url: string) {
        if (url) {
            window.open(url, '_blank');
        }
    }
}
