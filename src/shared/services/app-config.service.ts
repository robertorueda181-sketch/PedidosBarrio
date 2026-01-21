import { Injectable, inject, isDevMode } from '@angular/core';
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
            // En producción carga config.prod.json, en desarrollo config.json
            const configFile = isDevMode() ? '/assets/config.json' : '/assets/config.prod.json';
            this.config = await lastValueFrom(this.http.get(configFile));
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

    get phoneNumber(): string {
        return this.config.phoneNumber;
    }

    get phoneNumberDisplay(): string {
        return this.config.phoneNumberDisplay;
    }
}
