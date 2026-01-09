import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Servicio, ServicioService } from '../../shared/services/servicio.service';

@Component({
    selector: 'app-servicio-detalle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './servicio-detalle.html',
})
export class ServicioDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private servicioService = inject(ServicioService);

    servicio = signal<Servicio | null>(null);
    loading = signal<boolean>(true);
    activeImage = signal<string>('');

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            if (id) {
                this.loadServicio(id);
            }
        });
    }

    loadServicio(id: number) {
        this.servicioService.getServicioById(id).subscribe({
            next: (data) => {
                this.servicio.set(data);
                this.activeImage.set(data.urlImagen || '');
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading servicio detail', err);
                this.loading.set(false);
            }
        });
    }

    setActiveImage(url: string) {
        this.activeImage.set(url);
    }
}
