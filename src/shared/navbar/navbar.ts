import { Component, OnInit, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';
import { SelectModule } from 'primeng/select';
import * as L from 'leaflet';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.html',
    styleUrl: './navbar.css',
    imports: [RouterModule, RouterLink, CommonModule, FormsModule, SelectModule],
})
export class Navbar implements OnInit {
    private locationService = inject(LocationService);
    public authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID);
    
    // Computed based on auth state
    userProfileLink = computed(() => {
        if (!this.authService.loggedIn()) return '/ingreso';
        // Basic check, ideally this should come from auth service or user state
        const type = this.getUserType();
        return type === 'EMPRESA' ? '/empresa/perfil' : '/mi-perfil';
    });

    getUserType(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('userType');
        }
        return null;
    }

    logout() {
        this.authService.signOut();
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('userType');
        }
        this.router.navigate(['/']);
    }
    
    isSubmenuOpen = signal(false);
    isMenuOpen = signal(false);
    showLocationModal = signal(false);

    // Location Data
    currentLocation = signal<any>(null);
    departments = signal<any[]>([]);
    provinces = signal<any[]>([]);
    districts = signal<any[]>([]);

    selectedDepartment = signal<string>('');
    selectedProvince = signal<string>('');
    selectedDistrict = signal<string>('');
    latitude = signal<number | null>(null);
    longitude = signal<number | null>(null);
    
    isLoadingLocation = signal(false);
    isReverseGeocoding = signal(false);
    locationError = signal<string | null>(null);
    
    private map: L.Map | undefined;
    private marker: L.Marker | undefined;
    
    constructor(private router: Router) { }

    ngOnInit() {
        this.loadDepartments();
        const saved = this.locationService.getSavedLocation();
        if (saved) {
             this.currentLocation.set(saved);
             this.selectedDepartment.set(saved.departmentId);
             this.selectedProvince.set(saved.provinceId);
             this.selectedDistrict.set(saved.districtId);
             this.latitude.set(saved.latitude);
             this.longitude.set(saved.longitude);
             
             // Preload dependent dropdowns
             this.locationService.getProvinces(this.selectedDepartment()).subscribe(p => this.provinces.set(p));
             this.locationService.getDistricts(this.selectedProvince()).subscribe(d => this.districts.set(d));
        }
    }

    loadDepartments() {
        this.locationService.getDepartments().subscribe(deps => {
            console.log('Loaded departments:', deps);
            this.departments.set(deps);
        });
    }

    onDepartmentChange() {
        this.selectedProvince.set('');
        this.selectedDistrict.set('');
        this.provinces.set([]);
        this.districts.set([]);
        const deptId = this.selectedDepartment();
        if (deptId) {
            this.locationService.getProvinces(deptId).subscribe(provs => {
                this.provinces.set(provs);
            });
        }
    }

    onProvinceChange() {
        this.selectedDistrict.set('');
        this.districts.set([]);
        const provId = this.selectedProvince();
        if (provId) {
            this.locationService.getDistricts(provId).subscribe(dists => {
                this.districts.set(dists);
            });
        }
    }

    onDistrictChange() {
        // Validation logic can go here if needed
    }

    openLocationModal() {
        this.showLocationModal.set(true);
        
        // Ensure saved data is loaded correctly if present
        const saved = this.locationService.getSavedLocation();
        if (saved && (!this.selectedDepartment() || this.provinces().length === 0)) {
            // Re-sync with saved data if state is inconsistent
            this.selectedDepartment.set(saved.departmentId);
            this.selectedProvince.set(saved.provinceId);
            this.selectedDistrict.set(saved.districtId);
            this.latitude.set(saved.latitude);
            this.longitude.set(saved.longitude);
            
            this.loadDepartments();
            if (this.selectedDepartment()) {
                 this.locationService.getProvinces(this.selectedDepartment()).subscribe(provs => {
                    this.provinces.set(provs);
                    // Restore province selection after loading
                    if(saved.provinceId) this.selectedProvince.set(saved.provinceId);
                    
                    if (this.selectedProvince()) {
                        this.locationService.getDistricts(this.selectedProvince()).subscribe(dists => {
                            this.districts.set(dists);
                            // Restore district selection
                            if(saved.districtId) this.selectedDistrict.set(saved.districtId);
                        });
                    }
                 });
            }
        } else if (!saved) {
            // Default center if no saved location (e.g., Lima)
            if (!this.latitude()) this.latitude.set(-12.046374);
            if (!this.longitude()) this.longitude.set(-77.042793);
        }

        setTimeout(() => {
            this.initMap();
        }, 100);
    }

    closeLocationModal() {
        this.showLocationModal.set(false);
        this.locationError.set(null);
        if (this.map) {
            this.map.remove();
            this.map = undefined;
            this.marker = undefined;
        }
    }

    private initMap(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        if (this.map) { 
            this.map.remove(); // Clean up if somehow exists
        }

        const initialLat = this.latitude() || -12.046374;
        const initialLng = this.longitude() || -77.042793;
        const zoomLevel = this.latitude() ? 15 : 12;

        this.map = L.map('map', {
            center: [initialLat, initialLng],
            zoom: zoomLevel
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        // Fix marker icon issue using CDN
        const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        this.marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.map);

        this.marker.on('dragend', () => {
             const position = this.marker!.getLatLng();
             this.latitude.set(position.lat);
             this.longitude.set(position.lng);
             this.updateLocationFromCoordinates(position.lat, position.lng);
        });

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (this.marker) {
                this.marker.setLatLng(e.latlng);
            } else {
                this.marker = L.marker(e.latlng, { draggable: true }).addTo(this.map!);
            }
            this.latitude.set(e.latlng.lat);
            this.longitude.set(e.latlng.lng);
            this.updateLocationFromCoordinates(e.latlng.lat, e.latlng.lng);
        });
        
        // Invalidate size to ensure it renders correctly after modal open
        setTimeout(() => {
            this.map?.invalidateSize();
        }, 200);
    }
    
    private updateLocationFromCoordinates(lat: number, lng: number): Promise<void> {
        this.isReverseGeocoding.set(true);
        return new Promise((resolve) => {
            this.locationService.reverseGeocode(lat, lng).subscribe({
                next: (data: any) => {
                    if (data && data.address) {
                        console.log('Reverse geocode:', data.address);
                        this.matchLocationFromGeocode(data.address).then(() => resolve());
                    } else {
                        this.isReverseGeocoding.set(false);
                        resolve();
                    }
                },
                error: (err) => {
                    console.error('Geocoding error:', err);
                    this.isReverseGeocoding.set(false);
                    resolve();
                }
            });
        });
    }

    private matchLocationFromGeocode(addressData: any): Promise<void> {
        return new Promise((resolve) => {
            const deptCandidate = addressData.state || addressData.region || addressData.province || '';
            const provCandidate = addressData.county || addressData.state_district || addressData.city || addressData.region || '';
            const distCandidate = addressData.suburb || addressData.neighbourhood || addressData.village || addressData.town || addressData.hamlet || addressData.quarter || addressData.municipality || '';

            // 1. Buscar Departamento (Nombre -> ID)
            const matchedDept = this.departments().find(d => this.isNameMatch(d.name, deptCandidate));
            console.log('Departamento encontrado:', matchedDept);
            
            if (matchedDept) {
                this.selectedDepartment.set(matchedDept.code);

                // 2. Cargar Provincias con el ID del departamento
                this.locationService.getProvinces(matchedDept.code).subscribe(provs => {
                    this.provinces.set(provs);

                    // 3. Buscar Provincia (Nombre -> ID)
                    const matchedProv = provs.find(p => this.isNameMatch(p.name, provCandidate))
                        || provs.find(p => this.isNameMatch(p.name, distCandidate));

                    if (matchedProv) {
                        this.selectedProvince.set(matchedProv.code);

                        // 4. Cargar Distritos con el ID de la provincia
                        this.locationService.getDistricts(matchedProv.code).subscribe(dists => {
                            this.districts.set(dists);

                            // 5. Buscar Distrito (Nombre -> ID)
                            const matchedDist = dists.find(d => this.isNameMatch(d.name, distCandidate))
                                || dists.find(d => this.isNameMatch(d.name, addressData.road || '')) 
                                || dists.find(d => this.isNameMatch(d.name, provCandidate));

                            if (matchedDist) {
                                this.selectedDistrict.set(matchedDist.code);
                            } else {
                                console.warn('Distrito no encontrado. Candidatos:', distCandidate);
                                this.selectedDistrict.set('');
                            }
                            this.isReverseGeocoding.set(false);
                            resolve();
                        });
                    } else {
                        console.warn('Provincia no encontrada. Candidatos:', provCandidate);
                        this.selectedProvince.set('');
                        this.districts.set([]);
                        this.selectedDistrict.set('');
                        this.isReverseGeocoding.set(false);
                        resolve();
                    }
                });
            } else {
                console.warn('Departamento no encontrado. Candidatos:', deptCandidate);
                this.selectedDepartment.set('');
                this.selectedProvince.set('');
                this.selectedDistrict.set('');
                this.provinces.set([]);
                this.districts.set([]);
                this.isReverseGeocoding.set(false);
                resolve();
            }
        });
    }

    private isNameMatch(localName: string, externalName: string): boolean {
        if (!localName || !externalName) return false;
        const clean = (s: string) => s.toLowerCase()
          .replace(/departamento de |provincia de |distrito de |región de |municipalidad de |gobierno regional de /gi, '')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9 ]/g, '').trim();
        const cL = clean(localName);
        const cE = clean(externalName);
        return cL === cE || cE.includes(cL) || cL.includes(cE);
    }

    async getCurrentLocation() {
        this.isLoadingLocation.set(true);
        this.locationError.set(null);
        try {
            const position = await this.locationService.getCurrentPosition();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log('Current position:', position);
            
            this.latitude.set(lat);
            this.longitude.set(lng);
            
            if (this.map && this.marker) {
                const newLatLng = new L.LatLng(lat, lng);
                this.marker.setLatLng(newLatLng);
                this.map.setView(newLatLng, 15);
            }
            // Trigger auto-selection and wait for it (if we want to keep loading state)
            // But updateLocationFromCoordinates is void.
            // Let's rely on isReverseGeocoding for specific feedback, 
            // but we can extend isLoadingLocation slightly or just let it finish.
            
            // To ensure the user sees "something happened", we call this:
            await this.updateLocationFromCoordinates(lat, lng);

        } catch (error: any) {
            console.error('Error getting location', error);
            this.locationError.set('No se pudo obtener tu ubicación ' + (error.message || 'Error desconocido'));
        } finally {
            this.isLoadingLocation.set(false);
        }
    }

    saveLocation() {
        if (!this.selectedDepartment() || !this.selectedProvince() || !this.selectedDistrict()) {
            this.locationError.set('Por favor selecciona Departamento, Provincia y Distrito');
            return;
        }

        const deptName = this.departments().find(d => d.code == this.selectedDepartment())?.name;
        const provName = this.provinces().find(p => p.code == this.selectedProvince())?.name;
        const distName = this.districts().find(d => d.code == this.selectedDistrict())?.name;

        const locationData = {
            departmentId: this.selectedDepartment(),
            departmentName: deptName,
            provinceId: this.selectedProvince(),
            provinceName: provName,
            districtId: this.selectedDistrict(),
            districtName: distName,
            latitude: this.latitude(),
            longitude: this.longitude()
        };

        this.locationService.saveLocation(locationData);
        window.location.reload(); 
    }

    toggleMenu() {
        this.isMenuOpen.update(v => !v);
    }

    toggleSubmenu() {
        this.isSubmenuOpen.update(v => !v);
    }

    navigateToRegistro(type: string) {
        this.isSubmenuOpen.set(false);

        if (type === 'empresa') {
            this.router.navigate(['/business-auth']);
        } else {
            this.router.navigate(['/ingreso']);
        }
    }

    // Cerrar el submenú cuando se hace click fuera (opcional)
    closeSubmenu() {
        this.isSubmenuOpen.set(false);
    }
}
