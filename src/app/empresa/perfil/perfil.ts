import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompanyProfile {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  category: string;
  foundedYear: number;
  employeeCount: string;
  logo?: string;
}

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  isEditing = false;
  isLoading = false;
  saveSuccess = false;

  companyProfile: CompanyProfile = {
    name: 'Mi Empresa S.A.',
    description: 'Somos una empresa dedicada a ofrecer servicios de calidad en el barrio. Especializados en productos locales y servicios profesionales.',
    email: 'contacto@miempresa.com',
    phone: '+57 300 123 4567',
    website: 'https://miempresa.com',
    address: {
      street: 'Calle 123 #45-67',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zipCode: '110111',
      country: 'Colombia'
    },
    category: 'Servicios Profesionales',
    foundedYear: 2018,
    employeeCount: '11-50'
  };

  categories = [
    'Servicios Profesionales',
    'Comercio Minorista',
    'Tecnología',
    'Construcción',
    'Salud y Bienestar',
    'Educación',
    'Restaurantes',
    'Transporte',
    'Entretenimiento',
    'Otro'
  ];

  employeeRanges = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '500+'
  ];

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.saveSuccess = false;
  }

  async saveProfile() {
    this.isLoading = true;
    this.saveSuccess = false;

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Aquí iría la lógica para guardar en el backend
      console.log('Guardando perfil:', this.companyProfile);

      this.saveSuccess = true;
      this.isEditing = false;

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  cancelEdit() {
    // Aquí podrías recargar los datos originales desde el backend
    this.isEditing = false;
    this.saveSuccess = false;
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Aquí iría la lógica para subir la imagen
      console.log('Logo seleccionado:', file);
      // this.companyProfile.logo = uploadedUrl;
    }
  }
}
