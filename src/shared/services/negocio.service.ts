import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface NegocioImagen {
    urlImagen: string;
    descripcion: string;
}

export interface Negocio {
    negocioID: number;
    empresaID: string;
    tiposID: number;
    urlNegocio: string;
    descripcion: string;
    fechaRegistro: string;
    nombre?: string;
    urlImagen?: string;
    imagenes?: NegocioImagen[];
}

export interface NegocioDetalle {
    nombre: string;
    descripcion: string;
    email: string;
    telefono: string | null;
    direccion: string;
    referencia: string | null;
    urlBanner?: string;
    productos: any[];
}

@Injectable({
    providedIn: 'root'
})
export class NegocioService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);

    getNegocios(): Observable<Negocio[]> {
        return this.http.get<Negocio[]>(`${this.config.apiUrl}/Negocios`).pipe(
            map(negocios => negocios.map(n => this.transformNegocio(n)))
        );
    }

    getNegocioBySlug(slug: string): Observable<Negocio | undefined> {
        return this.getNegocios().pipe(
            map(negocios => negocios.find(n =>
                n.nombre?.toLowerCase().includes(slug.toLowerCase()) ||
                n.urlNegocio?.toLowerCase().includes(slug.toLowerCase())
            ))
        );
    }

    getNegocioByCodigo(codigo: string): Observable<NegocioDetalle> {
        return this.http.get<NegocioDetalle>(`${this.config.apiUrl}/Negocios/codigo/${codigo}`).pipe(
            map(detalle => ({
                ...detalle,
                productos: detalle.productos.map(p => ({
                    ...p,
                    urlImagen: p.urlImagen ? `${this.config.baseUrl}/${p.urlImagen.replace(/\\/g, '/')}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
                }))
            }))
        );
    }

    private transformNegocio(item: Negocio): Negocio {
        // Handle imagenes array - transform local paths to web URLs
        let transformedImages: NegocioImagen[] = [];
        if (item.imagenes && item.imagenes.length > 0) {
            transformedImages = item.imagenes.map(img => {
                const nombreArchivo = img.urlImagen ? img.urlImagen.split(/[/\\]/).pop() : '';
                return {
                    urlImagen: nombreArchivo ? `${this.config.baseUrl}/images/${nombreArchivo}` : '',
                    descripcion: img.descripcion
                };
            });
        }

        // Set urlImagen from first image or fallback to urlImagen field
        const urlImagen = transformedImages.length > 0
            ? transformedImages[0].urlImagen
            : (item.urlImagen ? `${this.config.baseUrl}/images/${item.urlImagen.split(/[/\\]/).pop()}` :
                'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=800&q=60');

        return {
            ...item,
            imagenes: transformedImages,
            urlImagen
        };
    }
}
