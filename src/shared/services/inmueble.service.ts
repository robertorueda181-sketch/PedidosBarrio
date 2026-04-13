import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface InmuebleImagen {
    urlImagen: string;
    descripcion: string;
}

export interface Inmueble {
    inmuebleID: number;
    empresaID: string;
    tiposID: number;
    tipoInmueble?: string | null;
    operacionID?: number | null;
    tipoOperacion?: string | null;
    tipo?: string; // For backward compatibility
    precio: number;
    medidas: string;
    ubicacion: string;
    dormitorios: number;
    banos: number;
    descripcion: string;
    latitud?: string;
    longitud?: string;
    imagenes?: InmuebleImagen[];
    urlImagen?: string; // For backward compatibility
    // UI fields
    operacion?: string;
    titulo?: string;
}

@Injectable({
    providedIn: 'root'
})
export class InmuebleService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);

    getInmuebles(): Observable<Inmueble[]> {
        return this.http.get<Inmueble[]>(`${this.config.apiUrl}/Inmuebles`).pipe(
            map(inmuebles => inmuebles.map(item => this.transformInmueble(item)))
        );
    }

    getInmuebleById(id: number): Observable<Inmueble> {
        return this.http.get<Inmueble>(`${this.config.apiUrl}/Inmuebles/${id}`).pipe(
            map(item => this.transformInmueble(item))
        );
    }

    private transformInmueble(item: Inmueble): Inmueble {
        // Handle imagenes array - transform local paths to web URLs
        let transformedImages: InmuebleImagen[] = [];
        if (item.imagenes && item.imagenes.length > 0) {
            transformedImages = item.imagenes.map(img => {
                const nombreArchivo = img.urlImagen ? img.urlImagen.split(/[/\\]/).pop() : '';
                return {
                    urlImagen: nombreArchivo ? `${this.config.baseUrl}/images/${nombreArchivo}` : '',
                    descripcion: img.descripcion
                };
            });
        }

        // For backward compatibility, set urlImagen from first image
        const urlImagen = transformedImages.length > 0
            ? transformedImages[0].urlImagen
            : (item.urlImagen ? `${this.config.baseUrl}/images/${item.urlImagen.split(/[/\\]/).pop()}` :
                '/assets/image-default.webp');

        // Set tipo from tipoInmueble if available, otherwise keep existing
        const tipo = item.tipoInmueble || item.tipo || 'Inmueble';

        // Set operacion from tipoOperacion if available
        const operacion = item.tipoOperacion || item.operacion || 'Alquiler';

        return {
            ...item,
            imagenes: transformedImages,
            urlImagen,
            tipo,
            operacion,
            titulo: `${tipo} en ${item.ubicacion}`
        };
    }
}
