import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { SearchResult } from '../../pages/search-results/search-results.component';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);

    search(query: string): Observable<SearchResult[]> {
        return this.http.get<SearchResult[]>(`${this.config.apiUrl}/Search?q=${query}`).pipe(
            map(results => results.map(item => ({
                ...item
            })))
        );
    }

    private transformImageUrl(url: string | null | undefined): string | null {
        if (!url) return null;

        // Si ya es una URL completa, no la tocamos
        if (url.startsWith('http')) return url;

        // Extraemos el nombre del archivo (manejando slashes y backslashes)
        const fileName = url.split(/[/\\]/).pop();
        if (!fileName) return null;

        // Construimos la URL completa usando la baseUrl configurada
        return `${this.config.baseUrl}/images/${fileName}`;
    }
}
