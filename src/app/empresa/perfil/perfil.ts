import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressService } from '../shared/services/progress.service';
import { LocationService, LocationItem } from '../../../shared/services/location.service';
import { EmpresaService } from '../../../shared/services/empresa.service';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import * as L from 'leaflet';
import { InputMaskModule } from 'primeng/inputmask';

interface Address {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isMain: boolean;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

interface CompanyProfile {
  name: string;
  description: string;
  logo?: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    whatsapp: string;
  };
  contact: {
    email: string;
    phone: string;
    phone2?: string;
  };
  addresses: Address[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    TextareaModule,
    TabsModule,
    TooltipModule,
    DialogModule,
    SelectModule,
    CheckboxModule
  ],
  providers: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private toastr = inject(ToastrService);
  private progressService = inject(ProgressService);
  private locationService = inject(LocationService);
  private empresaService = inject(EmpresaService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(false);

  showAddressDialog = signal(false);
  editingAddress: Address | null = null;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  isSearching = signal(false);
  isLoadingSuggestions = signal(false);
  addressSuggestions: any[] = [];
  showSuggestions = signal(false);
  private searchTimeout: any = null;

  departments = signal<LocationItem[]>([]);
  provinces = signal<LocationItem[]>([]);
  districts = signal<LocationItem[]>([]);

  // Individual Form Signals
  addrId = signal('');
  addrName = signal('');
  addrLine = signal('');
  addrLat = signal(-12.0464);
  addrLng = signal(-77.0428);
  addrIsMain = signal(false);
  addrDist = signal('');
  addrProv = signal('');
  addrDept = signal('');

  activeTab = signal('0');

  companyProfile: CompanyProfile = {
    name: '',
    description: '',
    logo: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      whatsapp: ''
    },
    contact: {
      email: '',
      phone: '',
      phone2: ''
    },
    addresses: [
      {
        id: '0',
        name: 'Local Principal',
        address: 'Av. Principal 123, Lima',
        lat: -12.0464,
        lng: -77.0428,
        isMain: true,
        distrito: '150505',
        provincia: '1505',
        departamento: '15'
      }
    ]
  };

  ngOnInit() {
    this.loadProfile();
    this.loadDepartments();
    this.fixLeafletIcon();
    this.initializeAddressSignals();
  }

  initializeAddressSignals() {
    if (this.companyProfile.addresses.length > 0) {
      const addr = this.companyProfile.addresses[0];
      this.addrId.set(addr.id);
      this.addrName.set(addr.name);
      this.addrLine.set(addr.address);
      this.addrLat.set(addr.lat);
      this.addrLng.set(addr.lng);
      this.addrIsMain.set(addr.isMain);

      // 1. Set Departamento Code
      let deptId = addr.departamento || '';
      const foundDept = this.departments().find(d => d.code == deptId || d.name === deptId);
      if (foundDept) deptId = foundDept.code;
      this.addrDept.set(deptId);
      console.log('Departamento encontrado para dirección:', this.addrDept());
      // Load dropdowns based on ID
      if (deptId) {
        this.locationService.getProvinces(deptId).subscribe(data => {
          this.provinces.set(data);

          // 2. Set Provincia Code
          let provId = addr.provincia || '';
          const foundProv = data.find(p => p.code == provId || p.name === provId);
          if (foundProv) provId = foundProv.code;
          this.addrProv.set(provId);

          if (provId) {
            this.locationService.getDistricts(provId).subscribe(dataDist => {
              this.districts.set(dataDist);

              // 3. Set Distrito Code
              let distId = addr.distrito || '';
              const foundDist = dataDist.find(d => d.code == distId || d.name === distId);
              if (foundDist) distId = foundDist.code;
              this.addrDist.set(distId);
              console.log('Id de direccion:', this.companyProfile.addresses[0].id);
              if (this.companyProfile.addresses[0].id == '0') {
                this.addrDept.set('15');
                this.addrProv.set('1505');
                this.addrDist.set('150505');
              }
            });
          }
        });
      }
    }
  }

  onTabChange(value: any) {
    this.activeTab.set(value.toString());
    if (value.toString() === '3') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  fixLeafletIcon() {
    const path = '/assets/';
    L.Icon.Default.imagePath = path;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: path + 'marker-icon-2x.png',
      iconUrl: path + 'marker-icon.png',
      shadowUrl: path + 'marker-shadow.png',
    });
  }

  loadDepartments() {
    this.locationService.getDepartments().subscribe(data => {
      this.departments.set(data);
    });
  }

  onDepartmentChange() {
    this.provinces.set([]);
    this.districts.set([]);
    this.addrProv.set('');
    this.addrDist.set('');

    const dept = this.addrDept();
    if (dept) {
      this.locationService.getProvinces(dept).subscribe(data => {
        this.provinces.set(data);
      });
    }
  }

  onProvinceChange() {
    this.districts.set([]);
    this.addrDist.set('');

    const prov = this.addrProv();
    const dept = this.addrDept();

    if (prov) {
      this.locationService.getDistricts(prov).subscribe(data => {
        this.districts.set(data);
      });

      // Update map when province changes
      const provName = this.provinces().find(p => p.code === prov)?.name;
      const deptName = this.departments().find(d => d.code === dept)?.name;

      if (provName && deptName) {
        const query = `${provName}, ${deptName}, Perú`;
        this.updateMapBySearch(query);
      }
    }
  }

  onDistrictChange() {
    // No action on district change regarding map update
  }

  private async updateMapBySearch(query: string) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        this.addrLat.set(lat);
        this.addrLng.set(lng);
        this.addrLine.set(result.display_name);

        if (this.map && this.marker) {
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
        }
      }
    } catch (error) {
      console.error('Error actualizando mapa por selección:', error);
    }
  }

  loadProfile() {
    this.isLoading.set(true);

    forkJoin({
      profile: this.empresaService.getSede(),
      depts: this.locationService.getDepartments()
    }).subscribe({
      next: ({ profile, depts }: { profile: any, depts: LocationItem[] }) => {
        // Set departments first
        this.departments.set(depts);

        const data = profile;
        console.log('Datos de sede recibidos:', data);
        if (data) {
          this.companyProfile.name = data.nombre || '';
          this.companyProfile.description = data.descripcion || '';
          this.companyProfile.logo = data.logoUrl || '';
          this.companyProfile.contact.phone = (data.telefonoPrincipal || '').toString().trim();
          this.companyProfile.contact.email = data.email || '';
          this.companyProfile.contact.phone2 = (data.telefonoSec || '').toString().trim();

          this.companyProfile.socialMedia = {
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            twitter: data.twitter || '',
            tiktok: data.tiktok || '',
            whatsapp: (data.whatsapp || '').toString().trim()
          };

          // Map flat address fields to Address object
          const addr: Address = {
            id: (data.direccionID || 1).toString(),
            name: data.nombreLocal || 'Sede Principal',
            address: data.direccion || '',
            lat: parseFloat(data.latitud || '-12.0464'),
            lng: parseFloat(data.longitud || '-77.0428'),
            isMain: true,
            departamento: data.departamento,
            provincia: data.provincia,
            distrito: data.distrito
          };
          console.log('Dirección mapeada:', addr);
          this.companyProfile.addresses = [addr];
          this.initializeAddressSignals();
        }
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.toastr.error('No se pudo cargar la información del negocio', 'Error');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  saveProfile() {
    this.isLoading.set(true);

    const currentAddress: Address = {
      id: this.addrId() || '0',
      name: this.addrName(),
      address: this.addrLine(),
      lat: this.addrLat(),
      lng: this.addrLng(),
      isMain: true,
      departamento: this.addrDept(),
      provincia: this.addrProv(),
      distrito: this.addrDist()
    };
    console.log('Dirección a guardar:', this.addrDept(), this.addrProv(), this.addrDist(), currentAddress);

    const deptCode = this.addrDept();
    const provCode = this.addrProv();
    const distCode = this.addrDist();

    const payload = {
      nombre: this.companyProfile.name,
      descripcion: this.companyProfile.description,
      telefono: (this.companyProfile.contact.phone ?? "").replace(/\D/g, '').toString().trim(),
      telefono2: (this.companyProfile.contact.phone2 ?? "").replace(/\D/g, '').toString().trim(),
      correo: this.companyProfile.contact.email,
      urlLogo: this.companyProfile.logo,
      redesSociales: {
        facebook: this.companyProfile.socialMedia.facebook,
        instagram: this.companyProfile.socialMedia.instagram,
        twitter: this.companyProfile.socialMedia.twitter,
        tiktok: this.companyProfile.socialMedia.tiktok,
        whatsapp: (this.companyProfile.socialMedia.whatsapp ?? "").replace(/\D/g, '').toString().trim()
      },
      direccion: {
        direccionCompleta: currentAddress.address,
        latitud: currentAddress.lat.toString(),
        longitud: currentAddress.lng.toString(),
        departamento: deptCode,
        provincia: provCode,
        distrito: distCode
      }
    };

    console.log('Enviando payload:', payload);

    this.empresaService.updateSede(payload).subscribe({
      next: (resp) => {
        console.log('Respuesta guardado:', resp);
        this.toastr.success('Los cambios se han guardado correctamente', 'Perfil actualizado');
        this.loadProfile(); // Recargar para asegurar sincronización
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.toastr.error('Error al guardar los cambios', 'Error');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  // === GESTIÓN DE IMAGEN ===
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar extensión y tipo MIME
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.warning('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)', 'Archivo no válido');
      event.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      this.toastr.warning('La imagen no debe superar los 4MB', 'Archivo muy grande');
      event.target.value = '';
      return;
    }

    this.isLoading.set(true);
    this.empresaService.updateLogo(file).subscribe({
      next: (response) => {
        if (response.success) {
          this.companyProfile.logo = response.imageUrl || response.imagePath; // User provided structure has both, prioritize URL
          this.toastr.success(response.message || 'Logo actualizado correctamente', 'Éxito');
        } else {
          this.toastr.error(response.message || 'No se pudo actualizar el logo', 'Error');
        }
      },
      error: (err) => {
        console.error('Error subiendo logo:', err);
        this.toastr.error('Error al subir el logo', 'Error');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
        event.target.value = '';
      }
    });
  }

  removeLogo() {
    this.companyProfile.logo = '';
    this.toastr.info('El logo se ha eliminado', 'Logo eliminado');
  }

  // === GESTIÓN DE DIRECCIONES (Simplificada a 1) ===

  // === GESTIÓN DEL MAPA ===
  private initMap() {
    if (this.map) this.map.remove();

    this.map = L.map('addressMap').setView([this.addrLat(), this.addrLng()], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.marker = L.marker([this.addrLat(), this.addrLng()], {
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();
      this.addrLat.set(pos.lat);
      this.addrLng.set(pos.lng);
      this.reverseGeocode(pos.lat, pos.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addrLat.set(e.latlng.lat);
      this.addrLng.set(e.latlng.lng);
      if (this.marker) this.marker.setLatLng(e.latlng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  onAddressInput() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    const query = this.addrLine().trim();
    if (query.length < 3) {
      this.addressSuggestions = [];
      this.showSuggestions.set(false);
      return;
    }
    this.searchTimeout = setTimeout(() => this.loadAddressSuggestions(query), 500);
  }

  private async loadAddressSuggestions(query: string) {
    this.isLoadingSuggestions.set(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        this.addressSuggestions = data;
        this.showSuggestions.set(true);
      } else {
        this.addressSuggestions = [];
        this.showSuggestions.set(false);
      }
    } catch (error) {
      this.showSuggestions.set(false);
    } finally {
      this.isLoadingSuggestions.set(false);
    }
  }

  selectSuggestion(suggestion: any) {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    this.addrLat.set(lat);
    this.addrLng.set(lng);
    this.addrLine.set(suggestion.display_name);

    if (suggestion.address) this.matchLocationFromGeocode(suggestion.address);

    if (this.map && this.marker) {
      this.map.setView([lat, lng], 15);
      this.marker.setLatLng([lat, lng]);
    }

    this.addressSuggestions = [];
    this.showSuggestions.set(false);
  }

  async searchAddress() {
    const query = this.addrLine().trim();
    if (!query) return;

    this.isSearching.set(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const r = data[0];
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        this.addrLat.set(lat);
        this.addrLng.set(lng);
        this.addrLine.set(r.display_name);
        if (this.map && this.marker) {
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
        }
      }
    } finally {
      this.isSearching.set(false);
    }
  }

  private async reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        this.addrLine.set(data.display_name);
        if (data.address) this.matchLocationFromGeocode(data.address);
      }
    } catch (error) { }
  }

  private matchLocationFromGeocode(addressData: any) {
    const deptCandidate = addressData.state || addressData.region || addressData.province || '';
    // Agregamos más campos posibles para provincia y distrito
    const provCandidate = addressData.county || addressData.state_district || addressData.city || addressData.region || '';
    const distCandidate = addressData.suburb || addressData.neighbourhood || addressData.village || addressData.town || addressData.hamlet || addressData.quarter || addressData.municipality || '';

    // 1. Buscar Departamento (Nombre -> ID)
    const matchedDept = this.departments().find(d => this.isNameMatch(d.name, deptCandidate));
    console.log('Departamento encontrado:', matchedDept);
    if (matchedDept) {
      this.addrDept.set(matchedDept.code);

      // 2. Cargar Provincias con el ID del departamento
      this.locationService.getProvinces(matchedDept.code).subscribe(provs => {
        this.provinces.set(provs);

        // 3. Buscar Provincia (Nombre -> ID)
        const matchedProv = provs.find(p => this.isNameMatch(p.name, provCandidate))
          || provs.find(p => this.isNameMatch(p.name, distCandidate));

        if (matchedProv) {
          this.addrProv.set(matchedProv.code);

          // 4. Cargar Distritos con el ID de la provincia
          this.locationService.getDistricts(matchedProv.code).subscribe(dists => {
            this.districts.set(dists);

            // 5. Buscar Distrito (Nombre -> ID)
            const matchedDist = dists.find(d => this.isNameMatch(d.name, distCandidate))
              || dists.find(d => this.isNameMatch(d.name, addressData.road || ''))
              || dists.find(d => this.isNameMatch(d.name, provCandidate));

            if (matchedDist) {
              this.addrDist.set(matchedDist.code);
            } else {
              this.addrDist.set('');
            }
            this.cdr.detectChanges();
          });
        } else {
          this.addrProv.set('');
          this.districts.set([]);
          this.addrDist.set('');
          this.cdr.detectChanges();
        }
        this.cdr.detectChanges();
      });
    } else {
      this.clearLocationFields();
      this.cdr.detectChanges();
    }
  }

  private clearLocationFields() {
    this.addrDept.set('');
    this.addrProv.set('');
    this.addrDist.set('');
    this.provinces.set([]);
    this.districts.set([]);
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
}
