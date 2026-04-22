import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { NegocioService } from './negocio.service';

export interface Empresa {
    empresaID: string;
    nombre: string;
    descripcion: string;
    urlBanner?: string;
    urlLogo?: string;
    telefono?: string;
    direccion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmpresaService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);
    private negocioService = inject(NegocioService);

    /**
     * Obtiene los datos de una empresa buscando por su nombre o slug.
     * Internamente resuelve el UUID para consultar la API.
     */
    getEmpresaByNombre(nombre: string): Observable<Empresa | null> {
        return this.negocioService.getNegocioBySlug(nombre).pipe(
            switchMap(negocio => {
                if (negocio && negocio.empresaID) {
                    return this.getEmpresaById(negocio.empresaID);
                }
                return of(null);
            })
        );
    }

    getEmpresaById(empresaID: string): Observable<Empresa> {
        return this.http.get<Empresa>(`${this.config.apiUrl}/Empresas/${empresaID}`).pipe(
            map(empresa => this.transformEmpresa(empresa))
        );
    }

    private transformEmpresa(empresa: Empresa): Empresa {
        const nombreBanner = empresa.urlBanner ? empresa.urlBanner.split(/[/\\]/).pop() : '';
        const nombreLogo = empresa.urlLogo ? empresa.urlLogo.split(/[/\\]/).pop() : '';

        return {
            ...empresa,
            urlBanner: nombreBanner ? `${this.config.baseUrl}/images/${nombreBanner}` : '',
            urlLogo: nombreLogo ? `${this.config.baseUrl}/images/${nombreLogo}` : ''
        };
    }

    getSede(): Observable<any> {
        return this.http.get<any>(`${this.config.apiUrl}/Empresa/sede`);
    }

    updateSede(data: any): Observable<any> {
        return this.http.post<any>(`${this.config.apiUrl}/Empresa/sede`, data);
    }

    updateLogo(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.config.apiUrl}/Empresa/profile-image`, formData);
    }
}
