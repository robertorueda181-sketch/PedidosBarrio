import { Component, OnInit, inject, signal } from '@angular/core';
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
    ImageCropperComponent
  ],
  providers: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private toastr = inject(ToastrService);
  private progressService = inject(ProgressService);
  
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
  
  activeTab = signal('0');
  newAddress: Address = {
    id: '',
    name: '',
    address: '',
    lat: -12.0464,
    lng: -77.0428,
    isMain: false,
    distrito: '',
    provincia: '',
    departamento: ''
  };

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
  }

  loadProfile() {
    // Aquí cargarías los datos desde el backend
    console.log('Cargando perfil');
  }

  updateProgress() {
    // Actualizar progreso cuando cambian los datos
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
      console.log('Guardando perfil:', this.companyProfile);

      // Actualizar progreso después de guardar
      this.updateProgress();

      this.toastr.success('Los cambios se han guardado correctamente', 'Perfil actualizado');

    } catch (error) {
      console.error('Error al guardar:', error);
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

  imageLoaded(image: LoadedImage) {
    // Imagen cargada
  }

  cropperReady() {
    // Cropper listo
  }

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
      this.newAddress = { ...address };
    } else {
      this.editingAddress = null;
      this.newAddress = {
        id: Date.now().toString(),
        name: '',
        address: '',
        lat: -12.0464,
        lng: -77.0428,
        isMain: this.companyProfile.addresses.length === 0,
        distrito: '',
        provincia: '',
        departamento: ''
      };
    }
    this.showAddressDialog.set(true);
    
    // Inicializar mapa después de que el dialog se renderice
    setTimeout(() => this.initMap(), 100);
  }

  saveAddress() {
    if (!this.newAddress.name.trim() || !this.newAddress.address.trim()) {
      this.toastr.warning('Por favor completa todos los campos', 'Campos requeridos');
      return;
    }

    if (this.editingAddress) {
      const index = this.companyProfile.addresses.findIndex(a => a.id === this.editingAddress!.id);
      if (index !== -1) {
        this.companyProfile.addresses[index] = { ...this.newAddress };
      }
    } else {
      this.companyProfile.addresses.push({ ...this.newAddress });
    }

    if (this.newAddress.isMain) {
      this.companyProfile.addresses.forEach(addr => {
        if (addr.id !== this.newAddress.id) {
          addr.isMain = false;
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
    
    // Limpiar timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    
    // Destruir mapa
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  // === GESTIÓN DEL MAPA ===
  private initMap() {
    if (this.map) {
      this.map.remove();
    }

    // Configurar iconos por defecto de Leaflet
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Inicializar mapa
    this.map = L.map('addressMap').setView(
      [this.newAddress.lat, this.newAddress.lng],
      15
    );

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Agregar marcador
    this.marker = L.marker([this.newAddress.lat, this.newAddress.lng], {
      draggable: true
    }).addTo(this.map);

    // Evento cuando se arrastra el marcador
    this.marker.on('dragend', () => {
      const position = this.marker!.getLatLng();
      this.newAddress.lat = position.lat;
      this.newAddress.lng = position.lng;
      this.reverseGeocode(position.lat, position.lng);
    });

    // Evento cuando se hace clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.newAddress.lat = e.latlng.lat;
      this.newAddress.lng = e.latlng.lng;
      
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      }
      
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  onAddressInput() {
    // Cancelar búsqueda anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const query = this.newAddress.address.trim();
    
    if (query.length < 3) {
      this.addressSuggestions = [];
      this.showSuggestions.set(false);
      return;
    }

    // Debounce de 500ms
    this.searchTimeout = setTimeout(async () => {
      await this.loadAddressSuggestions(query);
    }, 500);
  }

  private async loadAddressSuggestions(query: string) {
    this.isLoadingSuggestions.set(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        this.addressSuggestions = data;
        this.showSuggestions.set(true);
      } else {
        this.addressSuggestions = [];
        this.showSuggestions.set(false);
      }
    } catch (error) {
      console.error('Error buscando sugerencias:', error);
      this.addressSuggestions = [];
      this.showSuggestions.set(false);
    } finally {
      this.isLoadingSuggestions.set(false);
    }
  }

  selectSuggestion(suggestion: any) {
    this.newAddress.address = suggestion.display_name;
    this.newAddress.lat = parseFloat(suggestion.lat);
    this.newAddress.lng = parseFloat(suggestion.lon);
    
    // Extraer detalles de ubicación
    if (suggestion.address) {
      this.newAddress.distrito = suggestion.address.suburb || 
                                 suggestion.address.neighbourhood || 
                                 suggestion.address.hamlet || 
                                 suggestion.address.quarter || 
                                 suggestion.address.city_district || '';
      
      this.newAddress.provincia = suggestion.address.county || 
                                  suggestion.address.state_district || 
                                  suggestion.address.city || '';
      
      this.newAddress.departamento = suggestion.address.state || 
                                     suggestion.address.region || '';
    }
    
    // Actualizar mapa
    if (this.map && this.marker) {
      this.map.setView([this.newAddress.lat, this.newAddress.lng], 15);
      this.marker.setLatLng([this.newAddress.lat, this.newAddress.lng]);
    }
    
    this.addressSuggestions = [];
    this.showSuggestions.set(false);
    
    this.toastr.success('Ubicación actualizada en el mapa', 'Dirección seleccionada');
  }

  async searchAddress() {
    if (!this.newAddress.address.trim()) {
      this.toastr.warning('Ingresa una dirección para buscar', 'Campo vacío');
      return;
    }

    this.isSearching.set(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.newAddress.address)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        this.newAddress.lat = parseFloat(result.lat);
        this.newAddress.lng = parseFloat(result.lon);
        this.newAddress.address = result.display_name;
        
        // Actualizar mapa
        if (this.map && this.marker) {
          this.map.setView([this.newAddress.lat, this.newAddress.lng], 15);
          this.marker.setLatLng([this.newAddress.lat, this.newAddress.lng]);
        }
        
        this.toastr.success('Ubicación actualizada en el mapa', 'Dirección encontrada');
      } else {
        this.toastr.warning('No se encontró la dirección. Intenta con otra búsqueda', 'No encontrada');
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
      this.toastr.error('Error al buscar la dirección', 'Error');
    } finally {
      this.isSearching.set(false);
    }
  }

  private async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        this.newAddress.address = data.display_name;
        
        // Extraer detalles de ubicación
        if (data.address) {
          // Distrito (suburb, neighbourhood, hamlet, quarter)
          this.newAddress.distrito = data.address.suburb || 
                                     data.address.neighbourhood || 
                                     data.address.hamlet || 
                                     data.address.quarter || 
                                     data.address.city_district || '';
          
          // Provincia (county, state_district)
          this.newAddress.provincia = data.address.county || 
                                      data.address.state_district || 
                                      data.address.city || '';
          
          // Departamento (state, region)
          this.newAddress.departamento = data.address.state || 
                                         data.address.region || '';
        }
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    }
  }
}
