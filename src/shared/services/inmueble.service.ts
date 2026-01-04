import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface Inmueble {
    inmuebleID: number;
    empresaID: string;
    tiposID: number;
    tipo: string;
    precio: number;
    medidas: string;
    ubicacion: string;
    dormitorios: number;
    banos: number;
    descripcion: string;
    urlImagen?: string;
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
        // Extract filename from local path if present
        // Example: D:\...\images/inmueble-1-fachada.jpg -> inmueble-1-fachada.jpg
        const nombreArchivo = item.urlImagen ? item.urlImagen.split(/[/\\]/).pop() : '';

        // Construct URL pointing to backend static files
        const urlImagen = nombreArchivo
            ? `${this.config.baseUrl}/images/${nombreArchivo}`
            : 'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=800&q=60'; // Fallback

        return {
            ...item,
            urlImagen,
            titulo: `${item.tipo} en ${item.ubicacion}`
        };
    }
}
