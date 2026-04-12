import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface NegocioImagen {
    urlImagen: string;
    descripcion: string;
}

export interface NegocioVideo {
    url?: string;
    urlVideo?: string;
    titulo?: string;
    title?: string;
    descripcion?: string;
    thumbnail?: string;
}

export interface NegocioSeccion {
    id?: string | number;
    tipo?: number | string;
    type?: number | string;
    titulo?: string;
    title?: string;
    descripcion?: string;
    subtitle?: string;
    urlBanner?: string;
    imageUrl?: string;
    urlImagen?: string;
    imagenes?: NegocioImagen[];
    images?: Array<{
        url?: string;
        imageUrl?: string;
        alt?: string;
        caption?: string;
        descripcion?: string;
    }>;
    videos?: NegocioVideo[];
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
    empresaID: string;
    nombre: string;
    descripcion: string;
    email: string;
    telefono: string | null;
    direccion: string;
    referencia: string | null;
    latitud?: number;
    longitud?: number;
    urlBanner?: string;
    logoUrl?: string;     // Added
    facebook?: string;    // Added
    instagram?: string;   // Added
    twitter?: string;  
    tiktok?: string;      // Added
    whatsapp?: string;    // Added
    tipoPlantilla?: number | string;
    colorBanner?: string;
    colorTexto?: string;
    estiloLetra?: string;
    urlImagen?: string;
    imagenes?: NegocioImagen[];
    videos?: NegocioVideo[];
    secciones?: NegocioSeccion[];
    productos: any[]; // Changed to any[] temporarily or refine based on actual response if needed, kept generic for now as user just said "productos: []"
    categorias: any[]; // Changed to any[]
}

export interface ProductoDetalle {
    productoID: number;
    empresaID: string;
    categoriaID: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    urlImagen: string | null;
    precioAnterior?: number;
}

export interface Categoria {
    categoriaID: number;
    descripcion: string;
    codigo: string;
    mostrar: boolean;
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
                    urlImagen: p.urlImagen ? p.urlImagen : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
                }))
            }))
        );
    }

    getNegocioPorNombre(nombre: string): Observable<NegocioDetalle> {
        return this.http.get<NegocioDetalle>(`${this.config.apiUrl}/Negocios/publico/detalle/${nombre}`);
    }

    private transformNegocio(item: Negocio): Negocio {
        // No transformar las URLs de imagenes, solo devolverlas tal cual vienen del backend
        let transformedImages: NegocioImagen[] = [];
        if (item.imagenes && item.imagenes.length > 0) {
            transformedImages = item.imagenes.map(img => ({
                urlImagen: img.urlImagen || '',
                descripcion: img.descripcion
            }));
        }

        // urlImagen: usar la primera imagen si existe, si no, usar el campo urlImagen, si no, fallback
        const urlImagen = transformedImages.length > 0
            ? transformedImages[0].urlImagen
            : (item.urlImagen ? item.urlImagen :
                'https://images.unsplash.com/photo-1560448072-283bd0dfaa55?auto=format&fit=crop&w=800&q=60');

        return {
            ...item,
            imagenes: transformedImages,
            urlImagen
        };
    }
}
