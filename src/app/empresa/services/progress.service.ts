import { Injectable, signal, computed } from '@angular/core';

export interface ProgressStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
  isPro?: boolean;
  action?: string; // Opcional para acciones específicas como abrir un modal
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // Datos simulados - en producción vendrían del backend
  private hasLogo = signal(false);
  private hasBasicInfo = signal(false);
  private hasSocialMedia = signal(false);
  private hasContactInfo = signal(false);
  private hasAddress = signal(false);
  private hasCategories = signal(false);
  private hasProducts = signal(false);
  private hasBanner = signal(false);

  // Computar progreso
  steps = computed<ProgressStep[]>(() => [
    {
      id: 1,
      title: 'Agrega tu logo',
      description: 'Sube el logo de tu negocio',
      completed: this.hasLogo(),
      route: '/empresa/perfil',
      icon: 'pi-image'
    },
    {
      id: 2,
      title: 'Completa tu información básica',
      description: 'Nombre y descripción del negocio',
      completed: this.hasBasicInfo(),
      route: '/empresa/perfil',
      icon: 'pi-info-circle'
    },
    {
      id: 3,
      title: 'Agrega tu banner principal',
      description: 'Imagen de portada de tu negocio',
      completed: this.hasBanner(),
      route: '/empresa/banner',
      icon: 'pi-images'
    },
    {
      id: 4,
      title: 'Conecta tus redes sociales',
      description: 'Facebook, Instagram, WhatsApp',
      completed: this.hasSocialMedia(),
      route: '/empresa/perfil',
      icon: 'pi-share-alt'
    },
    {
      id: 5,
      title: 'Agrega datos de contacto',
      description: 'Email y teléfono',
      completed: this.hasContactInfo(),
      route: '/empresa/perfil',
      icon: 'pi-phone'
    },
    {
      id: 6,
      title: 'Crea categorías',
      description: 'Organiza tus productos',
      completed: this.hasCategories(),
      route: '/empresa/productos',
      icon: 'pi-tags',
      action: 'createCategory'
    },
    {
      id: 7,
      title: 'Agrega tu primer producto',
      description: 'Publica lo que vendes',
      completed: this.hasProducts(),
      route: '/empresa/productos',
      icon: 'pi-box',
      action: 'createProduct'
    },
    {
      id: 8,
      title: 'Registra tu dirección',
      description: 'Ubicación de tu local',
      completed: this.hasAddress(),
      route: '/empresa/perfil',
      icon: 'pi-map-marker',
      isPro: true
    }
  ]);

  progressPercentage = computed(() => {
    const allSteps = this.steps();
    const completedSteps = allSteps.filter(s => s.completed).length;
    return Math.round((completedSteps / allSteps.length) * 100);
  });

  pendingStepsCount = computed(() => {
    return this.steps().filter(s => !s.completed).length;
  });

  isComplete = computed(() => {
    return this.progressPercentage() === 100;
  });

  // Métodos para actualizar el progreso
  updateProgress(data: {
    hasLogo?: boolean;
    hasBasicInfo?: boolean;
    hasSocialMedia?: boolean;
    hasContactInfo?: boolean;
    hasAddress?: boolean;
    hasCategories?: boolean;
    hasProducts?: boolean;
    hasBanner?: boolean;
  }) {
    if (data.hasLogo !== undefined) this.hasLogo.set(data.hasLogo);
    if (data.hasBasicInfo !== undefined) this.hasBasicInfo.set(data.hasBasicInfo);
    if (data.hasSocialMedia !== undefined) this.hasSocialMedia.set(data.hasSocialMedia);
    if (data.hasContactInfo !== undefined) this.hasContactInfo.set(data.hasContactInfo);
    if (data.hasAddress !== undefined) this.hasAddress.set(data.hasAddress);
    if (data.hasCategories !== undefined) this.hasCategories.set(data.hasCategories);
    if (data.hasProducts !== undefined) this.hasProducts.set(data.hasProducts);
    if (data.hasBanner !== undefined) this.hasBanner.set(data.hasBanner);
  }

  // Cargar progreso desde el backend
  async loadProgress() {
    // TODO: Implementar llamada al backend
    // Por ahora, datos de ejemplo
    this.updateProgress({
      hasLogo: false,
      hasBasicInfo: false,
      hasSocialMedia: false,
      hasContactInfo: false,
      hasAddress: false,
      hasCategories: false,
      hasProducts: false,
      hasBanner: false
    });
  }
}
