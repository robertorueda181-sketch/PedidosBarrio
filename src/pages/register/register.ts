import { Component, inject, OnInit, signal } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { RegisterService } from '../../shared/services/register.service';
import { RegisterRequest } from '../../shared/interfaces/register.interface';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, MultiSelectModule, InputMaskModule, CheckboxModule, SelectModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private typeCateg = 'CATEG';

  categories = signal<any[]>([]);
  loadingCategories = signal<boolean>(false);

  registerForm: FormGroup = this.fb.group({
    fullname: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    businessName: ['', Validators.required],
    ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
    category: ['', Validators.required],
    schedules: this.fb.array([], Validators.required),
    address: ['', Validators.required],
    reference: [''],
    useMap: [false],
    lat: [''],
    lng: [''],
    phone: ['', [Validators.required, Validators.pattern(/^[9][0-9]{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    description: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  daysOptions = [
    { label: 'Lunes', value: 'Lunes' },
    { label: 'Martes', value: 'Martes' },
    { label: 'Miércoles', value: 'Miércoles' },
    { label: 'Jueves', value: 'Jueves' },
    { label: 'Viernes', value: 'Viernes' },
    { label: 'Sábado', value: 'Sábado' },
    { label: 'Domingo', value: 'Domingo' }
  ];

  step = 1;
  selectedPlan: string | null = null;
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  loadingLocation = false;

  constructor() {
    this.addSchedule();
    this.fixLeafletIcon();
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loadingCategories.set(true);
    this.registerService.getCategories(this.typeCateg).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loadingCategories.set(false);
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.loadingCategories.set(false);
      }
    });
  }

  fixLeafletIcon() {
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
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
  }

  get schedules() {
    return this.registerForm.get('schedules') as FormArray;
  }

  addSchedule() {
    const scheduleGroup = this.fb.group({
      days: [[], Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
    this.schedules.push(scheduleGroup);
  }

  removeSchedule(index: number) {
    this.schedules.removeAt(index);
  }

  goToStep2() {
    if (!this.selectedPlan) return;
    this.step = 2;
  }

  toggleMap() {
    const useMap = this.registerForm.get('useMap')?.value;
    if (useMap) {
      setTimeout(() => {
        this.initMap();
      }, 100); // Wait for DOM to render map container
    } else {
      // Optional: Clear map or reset location?
    }
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }

    // Default to a central location (e.g., Lima, Peru) if geolocation fails
    const defaultLat = -12.0464;
    const defaultLng = -77.0428;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Try to get user location
    if (navigator.geolocation) {
      this.loadingLocation = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.updateLocation(lat, lng);
          this.map?.setView([lat, lng], 15);
          this.loadingLocation = false;
        },
        (error) => {
          console.error('Error getting location', error);
          this.updateLocation(defaultLat, defaultLng);
          this.loadingLocation = false;
        }
      );
    } else {
      this.updateLocation(defaultLat, defaultLng);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  updateLocation(lat: number, lng: number) {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map!);
      this.marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.updateFormLocation(position.lat, position.lng);
      });
    }
    this.updateFormLocation(lat, lng);
  }

  updateFormLocation(lat: number, lng: number) {
    this.registerForm.patchValue({
      lat: lat,
      lng: lng
    });
    // Optional: Reverse geocoding here to update address field
    // For now, we just set the coordinates.
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // if (!this.selectedPlan) {
    //   alert('Seleccione un plan');
    //   this.step = 1;
    //   return;
    // }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const formData = {
      ...this.registerForm.value,
      registrationType: 'PRODUCT'
    } as RegisterRequest;
    console.log('Datos enviados:', formData);

    this.registerService.registerBusiness(formData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        alert(`Gracias por registrar tu negocio, ${formData.fullname}!`);
        this.registerForm.reset();
        this.schedules.clear();
        this.addSchedule();
        this.step = 1;
        this.selectedPlan = null;
      },
      error: (error) => {
        console.error('Error en el registro:', error);
        alert('Hubo un error al registrar el negocio. Por favor, inténtalo de nuevo.');
      }
    });
  }
}
