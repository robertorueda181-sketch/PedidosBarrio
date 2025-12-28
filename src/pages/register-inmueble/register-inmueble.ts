import { Component, inject, OnInit, signal } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { RegisterService } from '../../shared/services/register.service';
import { RegisterRequest } from '../../shared/interfaces/register.interface';

@Component({
    selector: 'app-register-inmueble',
    imports: [ReactiveFormsModule, CommonModule, MultiSelectModule, InputMaskModule, CheckboxModule, SelectModule],
    templateUrl: './register-inmueble.html',
    styleUrl: './register-inmueble.css',
})
export class RegisterInmueble implements OnInit {
    private fb = inject(FormBuilder);
    private registerService = inject(RegisterService);

    registerForm: FormGroup = this.fb.group({
        fullname: ['', Validators.required],
        dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
        propertyType: ['', Validators.required],
        squareMeters: ['', Validators.required],
        bathrooms: ['', Validators.required],
        rooms: ['', Validators.required],
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

    propertyTypeOptions = [
        { label: 'Venta de terreno', value: 'VENTA_TERRENO' },
        { label: 'Alquiler', value: 'ALQUILER' },
        { label: 'Departamento', value: 'DEPARTAMENTO' },
        { label: 'Casa', value: 'CASA' },
        { label: 'Local comercial', value: 'LOCAL_COMERCIAL' }
    ];

    map: L.Map | undefined;
    marker: L.Marker | undefined;
    loadingLocation = false;

    constructor() {
        this.fixLeafletIcon();
    }

    ngOnInit() {
        // No categories to load for Inmueble
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

    toggleMap() {
        const useMap = this.registerForm.get('useMap')?.value;
        if (useMap) {
            setTimeout(() => {
                this.initMap();
            }, 100);
        } else {
            // Optional: Clear map or reset location?
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
            registrationType: 'REAL_ESTATE'
        } as RegisterRequest;

        console.log('Datos enviados:', formData);

        this.registerService.registerBusiness(formData).subscribe({
            next: (response) => {
                console.log('Registro exitoso:', response);
                alert(`Gracias por registrar tu inmueble, ${formData.fullname}!`);
                this.registerForm.reset();
            },
            error: (error) => {
                console.error('Error en el registro:', error);
                alert('Hubo un error al registrar el inmueble. Por favor, inténtalo de nuevo.');
            }
        });
    }
}
