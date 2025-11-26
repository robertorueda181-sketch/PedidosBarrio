import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  step = 1;
  selectedPlan: string | null = null;
  formData = {
    fullname: '',
    businessName: '',
    category: '',
    schedule: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  };

  goToStep2() {
    if (!this.selectedPlan) return;
    this.step = 2;
  }
  onSubmit() {
    if (!this.selectedPlan) {
      alert('Seleccione un plan');
      this.step = 1;
      return;
    }
    // Validar campos (opcional, Angular se encarga en el formulario)
    // Aquí puedes enviar formData con selectedPlan al backend
    console.log('Datos enviados:', { plan: this.selectedPlan, ...this.formData });
    alert(`Gracias por registrar tu negocio, ${this.formData.fullname}!`);
    this.resetForm();
  }
  resetForm() {
    this.step = 1;
    this.selectedPlan = null;
    this.formData = {
      fullname: '',
      businessName: '',
      category: '',
      schedule: '',
      address: '',
      phone: '',
      email: '',
      description: '',
    };
  
  }  
}

