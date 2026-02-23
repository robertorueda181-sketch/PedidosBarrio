import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ClientService, ClientAddress, ClientProfile } from '../../../shared/services/client.service';
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
    this.addrLine.set(addr.direccion);
    this.addrLat.set(addr.latitud);
    this.addrLng.set(addr.longitud);
    this.addrRef.set(addr.referencia || '');
    this.addrIsMain.set(addr.esPrincipal);

    // Load dependent dropdowns
    this.addrDept.set(addr.departamentoId);
    if (addr.departamentoId) {
        this.locationService.getProvinces(addr.departamentoId).subscribe(p => {
            this.provinces.set(p);
            this.addrProv.set(addr.provinciaId);
            if(addr.provinciaId) {
                this.locationService.getDistricts(addr.provinciaId).subscribe(d => {
                    this.districts.set(d);
                    this.addrDist.set(addr.distritoId);
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

    const payload: Omit<ClientAddress, 'id'> = {
        nombre: this.addrName(),
        direccion: this.addrLine(),
        latitud: this.addrLat(),
        longitud: this.addrLng(),
        departamentoId: this.addrDept(),
        provinciaId: this.addrProv(),
        distritoId: this.addrDist(),
        referencia: this.addrRef(),
        esPrincipal: this.addrIsMain()
    };

    if (this.isEditingAddress() && this.selectedAddressId()) {
        this.clientService.updateAddress(this.selectedAddressId()!, payload as Partial<ClientAddress>).subscribe({
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

  private reverseGeocode(lat: number, lng: number) {
      if(!this.locationService) return;
      this.locationService.reverseGeocode(lat, lng).subscribe((data: any) => {
          if (data && (data.display_name || data.address)) {
              if(!this.addrLine()) {
                  this.addrLine.set(data.display_name);
              }
              if (data.address) {
                this.matchLocation(data.address);
              }
          }
      });
  }

  private matchLocation(address: any) {
       // Match Department
       const deptName = address.state || address.region || address.city;
       if (!deptName) return;

       const dept = this.departments().find(d => this.isMatch(d.name, deptName));
       if (dept) {
           this.addrDept.set(dept.code);
           this.locationService.getProvinces(dept.code).subscribe(provs => {
               this.provinces.set(provs);
               
               // Match Province
               const provName = address.province || address.county || address.city; 
               const prov = provs.find(p => this.isMatch(p.name, provName));
               
               if (prov) {
                   this.addrProv.set(prov.code);
                   this.locationService.getDistricts(prov.code).subscribe(dists => {
                       this.districts.set(dists);
                       
                       // Match District
                       const distName = address.suburb || address.neighbourhood || address.town || address.city_district;
                       const dist = dists.find(d => this.isMatch(d.name, distName));
                       if(dist) this.addrDist.set(dist.code);
                   });
               }
           });
       }
  }

  private isMatch(local: string, remote: string) {
      if(!local || !remote) return false;
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalize(local) === normalize(remote) || normalize(remote).includes(normalize(local));
  }
}
