import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type ImagenOptimizeTipo = 'Banner' | 'Producto' | 'Empresa' | 'Categoria' | 'Avatar' | 'Original';

@Injectable({
  providedIn: 'root'
})
export class ImagenesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  optimizeImage(imagen: File, tipo: ImagenOptimizeTipo): Observable<string> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('tipo', tipo);

    return this.http.post<any>(`${this.config.apiUrl}/imagenes/optimize`, formData).pipe(
      map(response => this.extractUrl(response))
    );
  }

  private extractUrl(response: any): string {
    const raw =
      (typeof response === 'string' ? response : null)
      || response?.url
      || response?.imageUrl
      || response?.ruta
      || response?.path
      || response?.data?.url
      || response?.data?.ruta
      || response?.resultado?.url
      || response?.resultado?.ruta;

    if (!raw || typeof raw !== 'string') {
      throw new Error('La API de optimize no retornó una URL válida.');
    }

    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }

    if (raw.startsWith('/')) {
      return `${this.config.baseUrl}${raw}`;
    }

    return `${this.config.baseUrl}/${raw}`;
  }
}
