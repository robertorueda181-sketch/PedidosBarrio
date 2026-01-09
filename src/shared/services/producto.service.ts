import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { NegocioService } from './negocio.service';

export interface Producto {
    productoID: number;
    empresaID: string;
    nombre: string;
    descripcion: string;
    precio: number;
    urlImagen?: string;
    categoria?: string;
    activo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ProductoService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);
    private negocioService = inject(NegocioService);

    /**
     * Obtiene los productos de una empresa buscando por su nombre o slug.
     * Internamente resuelve el UUID para consultar la API.
     */
    getProductosByNombre(nombre: string): Observable<Producto[]> {
        return this.negocioService.getNegocioBySlug(nombre).pipe(
            switchMap(negocio => {
                if (negocio && negocio.empresaID) {
                    return this.getProductosByEmpresa(negocio.empresaID);
                }
                return of([]);
            })
        );
    }

    getProductosByEmpresa(empresaID: string): Observable<Producto[]> {
        return this.http.get<Producto[]>(`${this.config.apiUrl}/Productos/Empresa/${empresaID}`).pipe(
            map(productos => productos.map(p => this.transformProducto(p)))
        );
    }

    private transformProducto(producto: Producto): Producto {
        const nombreArchivo = producto.urlImagen ? producto.urlImagen.split(/[/\\]/).pop() : '';
        const urlImagen = nombreArchivo
            ? `${this.config.baseUrl}/images/${nombreArchivo}`
            : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

        return {
            ...producto,
            urlImagen
        };
    }
}
