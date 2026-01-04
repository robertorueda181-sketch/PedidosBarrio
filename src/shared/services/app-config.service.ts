import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private http = inject(HttpClient);
    private config: any = {};

    async loadConfig(): Promise<void> {
        try {
            this.config = await lastValueFrom(this.http.get('/assets/config.json'));
        } catch (error) {
            console.error('Error loading config', error);
        }
    }

    get apiUrl(): string {
        return this.config.apiUrl;
    }

    get baseUrl(): string {
        return this.config.baseUrl;
    }
}
