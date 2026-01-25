import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { ProgressService } from '../services/progress.service';
import { LocationService, LocationItem } from '../../../shared/services/location.service';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import * as L from 'leaflet';

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
    TextareaModule,
    TabsModule,
    TooltipModule,
    DialogModule,
    ImageCropperComponent,
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
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(false);
  showImageCropper = signal(false);
  currentImageForCrop = signal<string | null>(null);
  croppedImage: any = '';
  imageChangedEvent: any = '';

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
    name: 'Mi Negocio',
    description: 'Descripción de mi negocio. Esto ayudará a que los clientes encuentren tu negocio más rápido en las búsquedas.',
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
        id: '1',
        name: 'Local Principal',
        address: 'Av. Principal 123, Lima',
        lat: -12.0464,
        lng: -77.0428,
        isMain: true,
        distrito: 'Miraflores',
        provincia: 'Lima',
        departamento: 'Lima'
      }
    ]
  };

  ngOnInit() {
    this.updateProgress();
    this.loadDepartments();
    this.fixLeafletIcon();
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
    if (prov) {
      this.locationService.getDistricts(prov).subscribe(data => {
        this.districts.set(data);
      });
    }
  }

  onDistrictChange() {
    if (this.addrDist() && this.addrProv() && this.addrDept()) {
      const query = `${this.addrDist()}, ${this.addrProv()}, ${this.addrDept()}, Perú`;
      this.updateMapBySearch(query);
    }
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
    console.log('Cargando perfil');
  }

  updateProgress() {
    this.progressService.updateProgress({
      hasLogo: !!this.companyProfile.logo,
      hasBasicInfo: this.companyProfile.name.trim() !== 'Mi Negocio' && this.companyProfile.description.length > 50,
      hasSocialMedia: !!(this.companyProfile.socialMedia.facebook || this.companyProfile.socialMedia.instagram || this.companyProfile.socialMedia.whatsapp),
      hasContactInfo: !!this.companyProfile.contact.email && !!this.companyProfile.contact.phone,
      hasAddress: this.companyProfile.addresses.length > 0
    });
  }

  async saveProfile() {
    this.isLoading.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.updateProgress();
      this.toastr.success('Los cambios se han guardado correctamente', 'Perfil actualizado');
    } catch (error) {
      this.toastr.error('Error al guardar los cambios', 'Error');
    } finally {
      this.isLoading.set(false);
    }
  }

  // === GESTIÓN DE IMAGEN ===
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      this.toastr.warning('La imagen no debe superar los 4MB', 'Archivo muy grande');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentImageForCrop.set(e.target.result);
      this.imageChangedEvent = event;
      this.showImageCropper.set(true);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  imageLoaded(image: LoadedImage) { }
  cropperReady() { }
  loadImageFailed() {
    this.toastr.error('No se pudo cargar la imagen', 'Error');
  }

  saveCroppedImage() {
    if (this.croppedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.companyProfile.logo = reader.result as string;
        this.toastr.success('El logo se ha actualizado correctamente', 'Logo actualizado');
        this.closeImageCropper();
      };
      reader.readAsDataURL(this.croppedImage as Blob);
    } else {
      this.closeImageCropper();
    }
  }

  closeImageCropper() {
    this.showImageCropper.set(false);
    this.currentImageForCrop.set(null);
    this.imageChangedEvent = '';
    this.croppedImage = '';
  }

  removeLogo() {
    this.companyProfile.logo = '';
    this.toastr.info('El logo se ha eliminado', 'Logo eliminado');
  }

  // === GESTIÓN DE DIRECCIONES ===
  openAddressDialog(address?: Address) {
    if (address) {
      this.editingAddress = address;
      this.addrId.set(address.id);
      this.addrName.set(address.name);
      this.addrLine.set(address.address);
      this.addrLat.set(address.lat);
      this.addrLng.set(address.lng);
      this.addrIsMain.set(address.isMain);
      this.addrDept.set(address.departamento || '');
      this.addrProv.set(address.provincia || '');
      this.addrDist.set(address.distrito || '');
    } else {
      this.editingAddress = null;
      this.addrId.set(Date.now().toString());
      this.addrName.set('');
      this.addrLine.set('');
      this.addrLat.set(-12.0464);
      this.addrLng.set(-77.0428);
      this.addrIsMain.set(this.companyProfile.addresses.length === 0);
      this.addrDept.set('');
      this.addrProv.set('');
      this.addrDist.set('');
    }
    this.showAddressDialog.set(true);

    if (this.addrDept()) {
      this.locationService.getProvinces(this.addrDept()).subscribe(data => {
        this.provinces.set(data);
        if (this.addrProv()) {
          this.locationService.getDistricts(this.addrProv()).subscribe(dataDist => {
            this.districts.set(dataDist);
          });
        }
      });
    }

    setTimeout(() => this.initMap(), 100);
  }

  saveAddress() {
    if (!this.addrName().trim() || !this.addrLine().trim()) {
      this.toastr.warning('Por favor completa todos los campos', 'Campos requeridos');
      return;
    }

    const addressObj: Address = {
      id: this.addrId(),
      name: this.addrName(),
      address: this.addrLine(),
      lat: this.addrLat(),
      lng: this.addrLng(),
      isMain: this.addrIsMain(),
      departamento: this.addrDept(),
      provincia: this.addrProv(),
      distrito: this.addrDist()
    };

    if (this.editingAddress) {
      const index = this.companyProfile.addresses.findIndex(a => a.id === this.editingAddress!.id);
      if (index !== -1) {
        this.companyProfile.addresses[index] = addressObj;
      }
    } else {
      this.companyProfile.addresses.push(addressObj);
    }

    if (addressObj.isMain) {
      this.companyProfile.addresses.forEach(a => {
        if (a.id !== addressObj.id) {
          a.isMain = false;
        }
      });
    }

    this.toastr.success(
      this.editingAddress ? 'Dirección actualizada' : 'Nueva dirección agregada',
      'Dirección guardada'
    );

    this.closeAddressDialog();
  }

  deleteAddress(addressId: string) {
    this.companyProfile.addresses = this.companyProfile.addresses.filter(a => a.id !== addressId);
    this.toastr.success('La dirección se ha eliminado', 'Dirección eliminada');
  }

  setMainAddress(addressId: string) {
    this.companyProfile.addresses.forEach(addr => {
      addr.isMain = addr.id === addressId;
    });
    this.toastr.success('Se ha establecido como dirección principal', 'Dirección principal actualizada');
  }

  closeAddressDialog() {
    this.showAddressDialog.set(false);
    this.editingAddress = null;
    this.addressSuggestions = [];
    this.showSuggestions.set(false);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

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
    this.toastr.success('Ubicación actualizada', 'Dirección seleccionada');
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
    const provCandidate = addressData.county || addressData.state_district || addressData.city || addressData.region || '';
    const distCandidate = addressData.suburb || addressData.neighbourhood || addressData.village || addressData.town || addressData.hamlet || addressData.quarter || addressData.municipality || '';
    console.log(addressData);
    const matchedDept = this.departments().find(d => this.isNameMatch(d.name, deptCandidate));
    console.log(matchedDept);
    if (matchedDept) {
      this.addrDept.set(matchedDept.name);
      this.locationService.getProvinces(matchedDept.name).subscribe(provs => {
        console.log(provs);
        this.provinces.set(provs);
        const matchedProv = provs.find(p => this.isNameMatch(p.name, provCandidate)) || provs.find(p => this.isNameMatch(p.name, distCandidate));
        console.log(matchedProv);
        if (matchedProv) {
          this.addrProv.set(matchedProv.name);
          this.locationService.getDistricts(matchedProv.name).subscribe(dists => {
            this.districts.set(dists);
            const matchedDist = dists.find(d => this.isNameMatch(d.name, distCandidate)) || dists.find(d => this.isNameMatch(d.name, addressData.road || '')) || dists.find(d => this.isNameMatch(d.name, provCandidate));
            if (matchedDist) {
              this.addrDist.set(matchedDist.name);
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
