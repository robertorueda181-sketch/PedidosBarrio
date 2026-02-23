import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ClientService, ClientAddress, ClientProfile, ClientAddressRequest } from '../../../shared/services/client.service';
import { LocationService, LocationItem } from '../../../shared/services/location.service';
import { AuthService } from '../../../shared/services/auth.service';
// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DataViewModule } from 'primeng/dataview';
import { CheckboxModule } from 'primeng/checkbox';
import * as L from 'leaflet';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    TabsModule,
    SelectModule,
    TableModule,
    DataViewModule,
    CheckboxModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ClientProfileComponent implements OnInit {
  private clientService = inject(ClientService);
  private locationService = inject(LocationService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  public authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  activeTabIndex: number = 0;
  
  // Profile Form
  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    email: [{value: '', disabled: true}],
    phone: ['']
  });

  // Addresses
  addresses = signal<ClientAddress[]>([]);
  showAddressDialog = signal(false);
  isEditingAddress = signal(false);
  selectedAddressId = signal<string | null>(null);

  // Address Form (Signals for map integration)
  addrName = signal(''); // "Casa", "Oficina"
  addrLine = signal(''); // "Av. Arequipa..."
  addrLat = signal(-12.0464);
  addrLng = signal(-77.0428);
  addrDept = signal('');
  addrProv = signal('');
  addrDist = signal('');
  addrRef = signal('');
  addrIsMain = signal(false);
  addrZip = signal('');

  // Location Data
  departments = signal<LocationItem[]>([]);
  provinces = signal<LocationItem[]>([]);
  districts = signal<LocationItem[]>([]);

  // Map
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  
  ngOnInit() {
    this.fixLeafletIcon();
    this.loadProfile();
    this.loadAddresses();
    this.loadDepartments();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.clientService.getProfile().subscribe({
        next: (profile: ClientProfile) => {
            if (profile) {
                this.profileForm.patchValue({
                    fullName: profile.nombre || '',
                    email: profile.email || '',
                    phone: profile.telefono || ''
                });
            }
            this.isLoading.set(false);
        },
        error: (err) => {
            console.error('Error loading profile', err);
            // Fallback to local storage if API fails or user just registered but profile endpoint is empty
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            if (user && user.email) {
                 this.profileForm.patchValue({
                    fullName: user.name || (user.firstName ? user.firstName + ' ' + user.lastName : ''),
                    email: user.email,
                    phone: user.phone || ''
                });
            }
            this.isLoading.set(false);
        }
    });
  }

  saveProfile() {
      if (this.profileForm.invalid) return;
      
      this.isLoading.set(true);
      const payload: Partial<ClientProfile> = {
          nombre: this.profileForm.value.fullName,
          telefono: this.profileForm.value.phone
      };

      this.clientService.updateProfile(payload).subscribe({
          next: () => {
              this.toastr.success('Perfil actualizado correctamente');
              this.isLoading.set(false);
          },
          error: (err) => {
              this.toastr.error('Error al actualizar el perfil');
              this.isLoading.set(false);
          }
      });
  }

  loadAddresses() {
    this.isLoading.set(true);
    this.clientService.getAddresses().subscribe({
        next: (data) => {
            this.addresses.set(data || []);
             this.isLoading.set(false);
        },
        error: (err) => {
            console.error('Error loading addresses', err);
            this.addresses.set([]); // Ensure empty array on error
            this.isLoading.set(false);
        }
    });
  }

  loadDepartments() {
    this.locationService.getDepartments().subscribe(d => this.departments.set(d));
  }

  // --- Address Logic ---

  openNewAddress() {
    this.isEditingAddress.set(false);
    this.selectedAddressId.set(null);
    this.resetAddressForm();
    this.showAddressDialog.set(true);
    // Use timeout to ensure DOM element exists
    setTimeout(() => this.initMap(), 300);
  }

  editAddress(addr: ClientAddress) {
    this.isEditingAddress.set(true);
    this.selectedAddressId.set(addr.id);
    
    this.addrName.set(addr.nombre);
    this.addrLine.set(addr.direccionTexto);
    this.addrLat.set(addr.latitud);
    this.addrLng.set(addr.longitud);
    this.addrRef.set(addr.referencia || '');
    this.addrIsMain.set(addr.esPrincipal);
    this.addrZip.set(addr.codigoPostal || '');

    // Reverse lookup for dropdowns (Name -> Code)
    const dept = this.departments().find(d => this.isMatch(d.name, addr.departamento));
    if (dept) {
        this.addrDept.set(dept.code);
        this.locationService.getProvinces(dept.code).subscribe(p => {
            this.provinces.set(p);
            const prov = p.find(pr => this.isMatch(pr.name, addr.provincia));
            if (prov) {
                this.addrProv.set(prov.code);
                this.locationService.getDistricts(prov.code).subscribe(d => {
                    this.districts.set(d);
                    const dist = d.find(di => this.isMatch(di.name, addr.distrito));
                    if(dist) this.addrDist.set(dist.code);
                });
            }
        });
    }

    this.showAddressDialog.set(true);
    setTimeout(() => this.initMap(), 300);
  }

  saveAddress() {
    if (!this.addrName() || !this.addrLine() || !this.addrDept() || !this.addrProv() || !this.addrDist()) {
        this.toastr.warning('Por favor completa todos los campos requeridos', 'Formulario incompleto');
        return;
    }

    const deptName = this.departments().find(d => d.code == this.addrDept())?.name || '';
    const provName = this.provinces().find(p => p.code == this.addrProv())?.name || '';
    const distName = this.districts().find(d => d.code == this.addrDist())?.name || '';

    const payload: ClientAddressRequest = {
        nombre: this.addrName(),
        direccionTexto: this.addrLine(),
        latitud: this.addrLat(),
        longitud: this.addrLng(),
        departamento: deptName,
        provincia: provName,
        distrito: distName,
        referencia: this.addrRef(),
        esPrincipal: this.addrIsMain(),
        codigoPostal: this.addrZip()
    };

    if (this.isEditingAddress() && this.selectedAddressId()) {
        this.clientService.updateAddress(this.selectedAddressId()!, payload).subscribe({
            next: () => {
                this.toastr.success('Dirección actualizada');
                this.loadAddresses();
                this.showAddressDialog.set(false);
            },
            error: () => this.toastr.error('Error al actualizar dirección')
        });
    } else {
        this.clientService.addAddress(payload).subscribe({
            next: () => {
                this.toastr.success('Dirección agregada');
                this.loadAddresses();
                this.showAddressDialog.set(false);
            },
            error: () => this.toastr.error('Error al guardar dirección')
        });
    }
  }

  deleteAddress(id: string) {
      if(confirm('¿Estás seguro de eliminar esta dirección?')) {
          this.clientService.deleteAddress(id).subscribe({
              next: () => {
                  this.toastr.info('Dirección eliminada');
                  this.loadAddresses();
              },
              error: () => this.toastr.error('Error al eliminar dirección')
          });
      }
  }

  resetAddressForm() {
      this.addrName.set('');
      this.addrLine.set('');
      this.addrLat.set(-12.0464);
      this.addrLng.set(-77.0428);
      this.addrDept.set('');
      this.addrProv.set('');
      this.addrDist.set('');
      this.addrRef.set('');
      this.addrIsMain.set(false);
      this.addrZip.set('');
      // Don't reset lists immediately if caching is desired, but good for clean state
      this.provinces.set([]);
      this.districts.set([]);
  }

  // --- Location Dropdowns ---

  onDepartmentChange() {
      const id = this.addrDept();
      this.provinces.set([]);
      this.districts.set([]);
      this.addrProv.set('');
      this.addrDist.set('');
      if(id) this.locationService.getProvinces(id).subscribe(p => this.provinces.set(p));
  }

  onProvinceChange() {
      const id = this.addrProv();
      this.districts.set([]);
      this.addrDist.set('');
      if(id) this.locationService.getDistricts(id).subscribe(d => this.districts.set(d));
  }

  // --- Map Logic ---

  fixLeafletIcon() {
    // Basic fix for leaflet marker icons
     const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;
  }

  private initMap() {
    // Destroy existing map instance if any to prevent initialization errors
    if (this.map) {
        this.map.remove();
        this.map = null;
    }
    
    // Safety check for container
    const container = document.getElementById('addressMap');
    if(!container) return;

    this.map = L.map('addressMap').setView([this.addrLat(), this.addrLng()], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marker = L.marker([this.addrLat(), this.addrLng()], { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.addrLat.set(pos.lat);
        this.addrLng.set(pos.lng);
        this.reverseGeocode(pos.lat, pos.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.addrLat.set(e.latlng.lat);
        this.addrLng.set(e.latlng.lng);
        if(this.marker) this.marker.setLatLng(e.latlng);
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    
    // Crucial for map rendering in modal
    setTimeout(() => {
        this.map?.invalidateSize();
    }, 100);
  }

  private reverseGeocode(lat: number, lng: number, forceUpdateAddress: boolean = false) {
      if(!this.locationService) return;
      this.locationService.reverseGeocode(lat, lng).subscribe((data: any) => {
          if (data && (data.display_name || data.address)) {
              if(!this.addrLine() || forceUpdateAddress) {
                  this.addrLine.set(data.display_name);
              }
              if (data.address) {
                this.matchLocation(data.address);
                if (data.address.postcode) {
                    this.addrZip.set(data.address.postcode);
                }
              }
          }
      });
  }

  private matchLocation(address: any) {
       const deptCandidate = address.state || address.region || address.province || '';
       const provCandidate = address.county || address.state_district || address.city || address.region || '';
       const distCandidate = address.suburb || address.neighbourhood || address.village || address.town || address.hamlet || address.quarter || address.municipality || '';

       // 1. Buscar Departamento (Nombre -> ID)
       const dept = this.departments().find(d => this.isMatch(d.name, deptCandidate));
       
       if (dept) {
           this.addrDept.set(dept.code);
           this.locationService.getProvinces(dept.code).subscribe(provs => {
               this.provinces.set(provs);
               
               // 2. Buscar Provincia (Nombre -> ID)
               const prov = provs.find(p => this.isMatch(p.name, provCandidate))
                   || provs.find(p => this.isMatch(p.name, distCandidate));
               
               if (prov) {
                   this.addrProv.set(prov.code);
                   this.locationService.getDistricts(prov.code).subscribe(dists => {
                       this.districts.set(dists);
                       
                       // 3. Buscar Distrito (Nombre -> ID)
                       const dist = dists.find(d => this.isMatch(d.name, distCandidate))
                           || dists.find(d => this.isMatch(d.name, address.road || '')) 
                           || dists.find(d => this.isMatch(d.name, provCandidate));

                       if(dist) {
                           this.addrDist.set(dist.code);
                       } else {
                           console.warn('Distrito no encontrado. Candidatos:', distCandidate);
                           this.addrDist.set('');
                       }
                   });
               } else {
                   console.warn('Provincia no encontrada. Candidatos:', provCandidate);
                   this.addrProv.set('');
                   this.addrDist.set('');
                   this.districts.set([]);
               }
           });
       } else {
            console.warn('Departamento no encontrado. Candidatos:', deptCandidate);
            this.addrDept.set('');
            this.addrProv.set('');
            this.addrDist.set('');
            this.provinces.set([]);
            this.districts.set([]);
       }
  }

  private isMatch(localName: string, externalName: string): boolean {
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
    this.toastr.info('Obteniendo tu ubicación actual...', 'Geolocalización');
    try {
        const position = await this.locationService.getCurrentPosition();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        this.addrLat.set(lat);
        this.addrLng.set(lng);

        if (this.map) {
            this.map.setView([lat, lng], 16);
            if (this.marker) {
                this.marker.setLatLng([lat, lng]);
            } else {
                this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
            }
        }
        
        // Reverse Geocode and Update Form
        this.reverseGeocode(lat, lng, true);
        this.toastr.success('Ubicación actualizada');
    } catch (error) {
        console.error('Error getting location', error);
        this.toastr.error('No se pudo obtener tu ubicación. Por favor permite el acceso o inténtalo nuevamente.');
    }
  }
}
