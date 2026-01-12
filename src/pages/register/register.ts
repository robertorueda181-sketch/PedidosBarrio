import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { RegisterService } from '../../shared/services/register.service';
import { RegisterRequest } from '../../shared/interfaces/register.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, MultiSelectModule, InputMaskModule, CheckboxModule, SelectModule, ToastModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private typeCateg = 'CATEG';

  categories = signal<any[]>([]);
  loadingCategories = signal<boolean>(false);

  registerForm: FormGroup = this.fb.group({
    registrationType: ['NEGOCIO', Validators.required],
    personType: ['NATURAL', Validators.required],
    idType: ['DNI', Validators.required],
    fullname: ['', Validators.required],
    dni: ['', [Validators.pattern(/^[0-9]{8}$/)]],
    ruc: ['', [Validators.pattern(/^[0-9]{11}$/)]],
    businessName: [''],
    category: [''],
    schedules: this.fb.array([]),
    address: [''],
    city: [''],
    province: [''],
    department: [''],
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
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  loadingLocation = false;

  constructor() {
    this.addSchedule();
    this.fixLeafletIcon();
  }

  ngOnInit() {
    this.loadCategories();

    // Update validators based on idType
    this.registerForm.get('idType')?.valueChanges.subscribe(value => {
      const dniControl = this.registerForm.get('dni');
      const rucControl = this.registerForm.get('ruc');

      if (value === 'DNI') {
        dniControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
        rucControl?.clearValidators();
      } else {
        rucControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);
        dniControl?.clearValidators();
      }
      dniControl?.updateValueAndValidity();
      rucControl?.updateValueAndValidity();
    });
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

  nextStep() {
    if (this.step < 3) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  setRegistrationType(type: 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE') {
    this.registerForm.patchValue({ registrationType: type });
    this.nextStep();
  }

  toggleMap() {
    const useMap = this.registerForm.get('useMap')?.value;
    if (useMap) {
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }

    const defaultLat = -12.0464;
    const defaultLng = -77.0428;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

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

    this.registerService.reverseGeocode(lat, lng).subscribe({
      next: (data) => {
        if (data && data.address) {
          const addr = data.address;
          // Nominatim returns different fields depending on the location
          const city = addr.city || addr.town || addr.village || addr.suburb || '';
          const province = addr.county || addr.state_district || '';
          const department = addr.state || '';
          const displayAddress = data.display_name || '';

          this.registerForm.patchValue({
            address: displayAddress,
            city: city,
            province: province,
            department: department
          });
        }
      },
      error: (err) => {
        console.error('Error in reverse geocoding', err);
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const formData = {
      ...this.registerForm.value,
      tipoEmpresa: this.registerForm.value.registrationType === 'NEGOCIO' ? 1 : 2,
      nombre: this.registerForm.value.fullname,
      apellido: ' ',
      nombreUsuario: this.registerForm.value.email.split('@')[0],
      contrasena: this.registerForm.value.password,
      nombreEmpresa: this.registerForm.value.businessName || this.registerForm.value.fullname,
      categoria: this.registerForm.value.category,
      telefono: this.registerForm.value.phone,
      descripcion: this.registerForm.value.description || '',
      direccion: this.registerForm.value.address || '',
      referencia: this.registerForm.value.reference || '',
      provider: '',
      socialId: '',
      idToken: ''
    } as RegisterRequest;

    console.log('Datos enviados:', formData);

    this.registerService.registerBusiness(formData).subscribe({
      next: (response: any) => {
        console.log('Registro exitoso:', response);
        // Store user info/type in local storage if needed for dashboard
        localStorage.setItem('userType', formData.registrationType || 'NEGOCIO');
        this.router.navigate(['/empresa/inicio']);
      },
      error: (error: any) => {
        console.error('Error en el registro:', error);
        const errorMessage = error.error?.message || error.error || 'Hubo un error al registrar. Por favor, inténtalo de nuevo.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el registro',
          detail: typeof errorMessage === 'string' ? errorMessage : 'Error de validación (400)'
        });
      }
    });
  }
}
