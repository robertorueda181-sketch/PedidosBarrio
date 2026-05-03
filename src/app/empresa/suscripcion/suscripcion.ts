import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { Plan } from '../shared/interfaces/plan.interface';
@Component({
  selector: 'app-suscripcion',
  imports: [CommonModule, FormsModule],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css',
})
export class Suscripcion {
  private toastr = inject(ToastrService);
  currentPlanId: string = 'free';
  currentPlan: string = 'Gratuito';

  plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      period: 'mes',
      features: [
        'Hasta 10 productos',
        'Hasta 5 inmuebles',
        'Hasta 3 servicios',
        'Soporte básico',
        'Anuncios limitados'
      ]
    },
    {
      id: 'pro',
      name: 'Profesional',
      price: 29.99,
      period: 'mes',
      popular: true,
      features: [
        'Productos ilimitados',
        'Inmuebles ilimitados',
        'Servicios ilimitados',
        'Soporte prioritario',
        'Anuncios destacados',
        'Estadísticas avanzadas',
        'API access',
        'Múltiples usuarios'
      ]
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      price: 99.99,
      period: 'mes',
      features: [
        'Todo lo del plan Profesional',
        'Integraciones personalizadas',
        'Soporte 24/7',
        'Consultoría dedicada',
        'SLA garantizado',
        'Análisis predictivo',
        'White-label'
      ]
    }
  ];

  selectPlan(planId: string) {
    if (planId === 'pro') {
      this.toastr.info('Redirigiendo al proceso de pago para el Plan Profesional...', 'Plan Profesional');
    } else if (planId === 'enterprise') {
      this.toastr.info('Contacta a nuestro equipo de ventas para el Plan Empresarial', 'Plan Empresarial');
    }
  }

  isCurrentPlan(planId: string): boolean {
    return planId === this.currentPlanId;
  }

  // Método para simular cambio de plan (para desarrollo/demo)
  setCurrentPlan(planId: string) {
    this.currentPlanId = planId;
    const plan = this.plans.find(p => p.id === planId);
    if (plan) {
      this.currentPlan = plan.name;
    }
  }
}
