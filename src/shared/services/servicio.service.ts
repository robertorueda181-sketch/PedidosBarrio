import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface ServicioImagen {
    urlImagen: string;
    descripcion: string;
}

export interface Servicio {
    servicioID: number;
    empresaID: string;
    tiposID: number;
    nombre: string;
    descripcion: string;
    precio: number;
    unidadMedida?: string;
    experiencia?: string;
    garantia?: string;
    atencion?: string;
    verificado?: boolean;
    urlImagen?: string;
    imagenes?: ServicioImagen[];
    serviciosDetallados?: {
        titulo: string;
        descripcion: string;
        precio: number;
        icono?: string;
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class ServicioService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);

    getServicios(): Observable<Servicio[]> {
        return this.http.get<Servicio[]>(`${this.config.apiUrl}/Oficios`).pipe(
            map(servicios => servicios.map(s => this.transformServicio(s)))
        );
    }

    getServicioById(id: number): Observable<Servicio> {
        return this.http.get<Servicio>(`${this.config.apiUrl}/Oficios/${id}`).pipe(
            map(s => this.transformServicio(s))
        );
    }

    private transformServicio(item: Servicio): Servicio {
        let transformedImages: ServicioImagen[] = [];
        if (item.imagenes && item.imagenes.length > 0) {
            transformedImages = item.imagenes.map(img => {
                const nombreArchivo = img.urlImagen ? img.urlImagen.split(/[/\\]/).pop() : '';
                return {
                    urlImagen: nombreArchivo ? `${this.config.baseUrl}/images/${nombreArchivo}` : '',
                    descripcion: img.descripcion
                };
            });
        }

        const urlImagen = transformedImages.length > 0
            ? transformedImages[0].urlImagen
            : (item.urlImagen ? `${this.config.baseUrl}/images/${item.urlImagen.split(/[/\\]/).pop()}` :
                'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800');

        return {
            ...item,
            imagenes: transformedImages,
            urlImagen,
            // Mock data for missing fields based on the template
            experiencia: item.experiencia || '10 años',
            garantia: item.garantia || '6 meses',
            atencion: item.atencion || '24/7',
            verificado: item.verificado !== undefined ? item.verificado : true,
            unidadMedida: item.unidadMedida || 'Visita técnica básica',
            serviciosDetallados: item.serviciosDetallados || [
                { titulo: 'Instalaciones Eléctricas', descripcion: 'Cableado completo para departamentos, casas y locales comerciales.', precio: 150, icono: 'pi pi-bolt' },
                { titulo: 'Pozos a Tierra', descripcion: 'Mantenimiento, medición y certificación de pozos a tierra con protocolo.', precio: 280, icono: 'pi pi-shield' },
                { titulo: 'Reparación de Cortos', descripcion: 'Detección y reparación de fallas eléctricas de emergencia.', precio: 80, icono: 'pi pi-wrench' }
            ]
        };
    }
}
