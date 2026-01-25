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

    getProvinces(departmentName: string): Observable<LocationItem[]> {
        return this.getDepartmentsData().pipe(
            map(depts => depts.find(d => d.name === departmentName)),
            switchMap((dept: any) => {
                if (!dept) return of([]);
                return this.getProvincesData().pipe(
                    map(provs => provs
                        .filter(p => p.department_id === dept.id)
                        .map(p => ({ name: p.name, code: p.id }))
                    )
                );
            })
        );
    }

    getDistricts(provinceName: string): Observable<LocationItem[]> {
        return this.getProvincesData().pipe(
            map(provs => provs.find(p => p.name === provinceName)),
            switchMap((prov: any) => {
                if (!prov) return of([]);
                return this.getDistrictsData().pipe(
                    map(dists => dists
                        .filter(d => d.province_id === prov.id)
                        .map(d => ({ name: d.name, code: d.id }))
                    )
                );
            })
        );
    }
}
