import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../shared/services/app-config.service';

export interface BannerData {
  titulo?: string;
  descripcion?: string;
  textoBoton?: string;
  link?: string;
  redireccion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  fechaExpiracion: Date;
  imagen?: File;
  urlImagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get apiUrl() {
    return this.config.apiUrl;
  }

  crearBanner(data: BannerData): Observable<any> {
    const formData = new FormData();

    if (data.titulo) formData.append('titulo', data.titulo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.textoBoton) formData.append('textoBoton', data.textoBoton);
    if (data.link) formData.append('link', data.link);
    if (data.redireccion) formData.append('redireccion', data.redireccion);
    
    // Formato ISO para fechas
    formData.append('fechaInicio', data.fechaInicio.toISOString());
    formData.append('fechaFin', data.fechaFin.toISOString());
    formData.append('fechaExpiracion', data.fechaExpiracion.toISOString());
    
    // Archivo de imagen o URL
    if (data.imagen) {
      formData.append('imagen', data.imagen, data.imagen.name);
    } else if (data.urlImagen) {
      formData.append('imagenUrl', data.urlImagen);
    }

    return this.http.post(`${this.apiUrl}/banner`, formData);
  }

  actualizarBanner(id: string, data: BannerData): Observable<any> {
    const formData = new FormData();

    if (data.titulo) formData.append('titulo', data.titulo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.textoBoton) formData.append('textoBoton', data.textoBoton);
    if (data.link) formData.append('link', data.link);
    if (data.redireccion) formData.append('redireccion', data.redireccion);
    
    formData.append('fechaInicio', data.fechaInicio.toISOString());
    formData.append('fechaFin', data.fechaFin.toISOString());
    formData.append('fechaExpiracion', data.fechaExpiracion.toISOString());
    
    if (data.imagen) {
      formData.append('imagen', data.imagen, data.imagen.name);
    } else if (data.urlImagen) {
      formData.append('imagenUrl', data.urlImagen);
    }

    return this.http.put(`${this.apiUrl}/banner/${id}`, formData);
  }

  obtenerBanners(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/banner`);
  }

  obtenerBannersPublicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Banner/publicos`);
  }

  eliminarBanner(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/banner/${id}`);
  }
}
