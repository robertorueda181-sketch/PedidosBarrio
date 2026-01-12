import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

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
export class Perfil implements OnInit {
  private messageService = inject(MessageService);
  isEditing = false;
  isLoading = false;
  saveSuccess = false;
  userType: string = 'NEGOCIO';

  companyProfile: any = {
    name: 'Mi Empresa S.A.',
    description: 'Somos una empresa dedicada a ofrecer servicios de calidad en el barrio.',
    email: 'contacto@miempresa.com',
    phone: '+51 987 654 321',
    address: 'Calle Principal 123',
    category: 'Restaurantes',
    socialMedia: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    },
    banner: {
      url: '',
      title: '',
      description: ''
    },
    servicesProvided: [],
    images: [],
    propertyDetails: {
      bathrooms: 0,
      rooms: 0,
      area: 0,
      type: ''
    }
  };

  ngOnInit() {
    this.userType = localStorage.getItem('userType') || 'NEGOCIO';
  }

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
      this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado exitosamente' });

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);

    } catch (error) {
      console.error('Error al guardar:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar los cambios. Inténtalo de nuevo.' });
    } finally {
      this.isLoading = false;
    }
  }

  cancelEdit() {
    // Aquí podrías recargar los datos originales desde el backend
    this.isEditing = false;
    this.saveSuccess = false;
  }

  removeImage(profile: any, index: number) {
    if (profile.images) {
      profile.images.splice(index, 1);
    }
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
