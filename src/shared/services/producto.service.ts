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
    categoriaID?: number;
    activo: boolean;
}

export interface Categoria {
    categoriaID: number;
    empresaID: string;
    descripcion: string;
    color?: string;
    icono?: string;
    orden?: number;
    activo: boolean;
}

export interface CategoriasProductosResponse {
    categorias: Categoria[];
    productos: Producto[];
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

    getCategorias(): Observable<Categoria[]> {
        return this.http.get<Categoria[]>(`${this.config.apiUrl}/Categorias`);
    }

    getCategoriasConProductos(): Observable<CategoriasProductosResponse> {
        return this.http.get<CategoriasProductosResponse>(`${this.config.apiUrl}/Categorias/getAll`).pipe(
            map(response => ({
                categorias: response.categorias || [],
                productos: response.productos?.map(p => this.transformProducto(p)) || []
            }))
        );
    }

    crearCategoria(categoria: { descripcion: string; color: string }): Observable<Categoria> {
        return this.http.post<Categoria>(`${this.config.apiUrl}/Categorias`, categoria);
    }

    actualizarCategoria(id: number, categoria: { descripcion: string; color: string }): Observable<Categoria> {
        return this.http.put<Categoria>(`${this.config.apiUrl}/Categorias/${id}`, categoria);
    }

    eliminarCategoria(id: number): Observable<any> {
        return this.http.delete(`${this.config.apiUrl}/Categorias/${id}`);
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
