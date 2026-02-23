import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, switchMap } from 'rxjs';

export interface LocationItem {
    name: string;
    code: string;
}

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private http = inject(HttpClient);

    private depts$: Observable<any[]> | null = null;
    private provs$: Observable<any[]> | null = null;
    private dists$: Observable<any[]> | null = null;

    private readonly DEPTS_URL = 'assets/data/ubigeo_departamentos.json';
    private readonly PROVS_URL = 'assets/data/ubigeo_provincias.json';
    private readonly DISTS_URL = 'assets/data/ubigeo_distritos.json';

    getCurrentPosition(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocalización no soportada por el navegador');
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    }

    saveLocation(location: any) {
        localStorage.setItem('user_location', JSON.stringify(location));
    }

    getSavedLocation(): any {
        const saved = localStorage.getItem('user_location');
        return saved ? JSON.parse(saved) : null;
    }

    private getDepartmentsData(): Observable<any[]> {
        if (!this.depts$) {
            this.depts$ = this.http.get<any[]>(this.DEPTS_URL).pipe(shareReplay(1));
        }
        return this.depts$;
    }

    private getProvincesData(): Observable<any[]> {
        if (!this.provs$) {
            this.provs$ = this.http.get<any[]>(this.PROVS_URL).pipe(shareReplay(1));
        }
        return this.provs$;
    }

    private getDistrictsData(): Observable<any[]> {
        if (!this.dists$) {
            this.dists$ = this.http.get<any[]>(this.DISTS_URL).pipe(shareReplay(1));
        }
        return this.dists$;
    }

    getDepartments(): Observable<LocationItem[]> {
        return this.getDepartmentsData().pipe(
            map(data => data.map(d => ({ name: d.name, code: d.id })))
        );
    }

    getProvinces(departmentId: string): Observable<LocationItem[]> {
        return this.getProvincesData().pipe(
            map(provs => provs
                .filter(p => p.department_id == departmentId)
                .map(p => ({ name: p.name, code: p.id }))
            )
        );
    }

    getDistricts(provinceId: string): Observable<LocationItem[]> {
        return this.getDistrictsData().pipe(
            map(dists => dists
                .filter(d => d.province_id == provinceId)
                .map(d => ({ name: d.name, code: d.id }))
            )
        );
    }

    reverseGeocode(lat: number, lon: number): Observable<any> {
        // Using OpenStreetMap Nominatim API for reverse geocoding
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        return this.http.get(url);
    }
}
