import { Component, inject, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterService } from '../../../shared/services/register.service';
import { ToastrService } from 'ngx-toastr';
import { GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-business-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MultiSelectModule, InputMaskModule, CheckboxModule, SelectModule,
    FormsModule, GoogleSigninButtonModule, RouterLink,RouterModule],
  templateUrl: './business-register.html',
  styleUrl: './business-register.css',
})
export class BusinessRegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private authService = inject(SocialAuthService);
  private ngZone = inject(NgZone);

  // SOCIAL USER
  user: SocialUser | null = null;
  loggedIn: boolean = false;

  // CONTROL DE FLUJO
  step = 1;
  registroMetodo: 'EMAIL' | 'GOOGLE' | null = null;
  tiposRegistro = { negocio: true, servicio: true, inmueble: true };
  
  // VERIFICACION DE CORREO
  codigoVerificacion: string = '';
  emailVerificado: boolean = false;
  tiempoRestante: number = 180;
  puedeReenviar: boolean = false;
  timerInterval: any;

  // STEP POLITICAS
  aceptaTerminos: boolean = false;
  aceptaDatos: boolean = false;

  // DATA
  categories = signal<any[]>([]);
  loadingCategories = signal<boolean>(false);
  typeCateg = 'Tipo_Neg'; // Por defecto NEGOCIO (Tipo_Neg)
  selectedCategory: string | null = null; // Nuevo campo para la grilla
  googleBtnWidth: number = 300;  // Default width

  registerForm: FormGroup = this.fb.group({
    registrationType: ['NEGOCIO', Validators.required], // NEGOCIO, SERVICIO, INMUEBLE
    
    // STEP 1
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    
    // STEP 5 (Datos Extra)
    businessName: ['', Validators.required],
    ownerName: ['', Validators.required],
    phone: [''], // Opcional según requerimiento
    category: ['', Validators.required],

    // CAMPOS DE RELLENO (Legacy o para futuro)
    personType: ['NATURAL'],
    idType: ['DNI'],
    fullname: [''], // Puede mapearse a ownerName
    dni: [''],
    ruc: [''],
    address: [''],
    city: [''],
    province: [''],
    department: [''],
    reference: [''],
    lat: [''],
    lng: [''],
    description: ['']
  });

  constructor() {
    // Leer flags de config.json
    const config = (window as any).appConfig || {};
    if (config.registroTipos) {
      this.tiposRegistro = { ...this.tiposRegistro, ...config.registroTipos };
    }
  }

  ngOnInit() {
    this.restoreState(); // Recuperar estado al iniciar
    this.calculateGoogleBtnWidth();

    // Suscribirse a cambios de estado de autenticación (Google)
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      if (this.loggedIn && user) {
        console.log('Google User:', user);
        this.handleGoogleLogin(user);
      }
    });
  }

  handleGoogleLogin(user: SocialUser) {
    this.ngZone.run(() => {
      // Rellenar formulario con datos de Google
      this.registerForm.patchValue({
        email: user.email,
        ownerName: user.name, 
        fullname: user.name,
        // Google no devuelve password, podemos omitirlo o manejarlo internamente
        password: 'GOOGLE_AUTH_USER', 
        confirmPassword: 'GOOGLE_AUTH_USER' 
      });
      
      // Marcar email como verificado
      this.emailVerificado = true;
      
      this.toastr.success(`Bienvenido ${user.name}`, 'Sesión iniciada con Google');

      // Avanzar flujo saltando verificación, si estamos en paso 1
      if (this.step === 1) {
         this.nextStep('GOOGLE');
      }
    });
  }

  calculateGoogleBtnWidth() {
    // Calculamos el ancho disponible considerando el padding (px-8 = 32px * 2 = 64px)
    // y el ancho máximo permitido por el botón de Google (400px)
    const padding = 64; 
    const maxWidth = 400;
    const width = Math.min(window.innerWidth - padding, maxWidth);
    this.googleBtnWidth = width > 0 ? width : 200;
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // --- STATE MANAGEMENT (CACHE) ---
  saveState() {
    const state = {
      step: this.step,
      registroMetodo: this.registroMetodo,
      formValues: this.registerForm.value,
      emailVerificado: this.emailVerificado,
      typeCateg: this.typeCateg,
      selectedCategory: this.selectedCategory
    };
    localStorage.setItem('business_register_state', JSON.stringify(state));
  }

  restoreState() {
    const stored = localStorage.getItem('business_register_state');
    if (stored) {
      const state = JSON.parse(stored);
      this.step = state.step || 1;
      this.registroMetodo = state.registroMetodo;
      this.emailVerificado = state.emailVerificado;
      this.typeCateg = state.typeCateg || 'Tipo_Neg';
      this.selectedCategory = state.selectedCategory;
      
      if (state.formValues) {
        this.registerForm.patchValue(state.formValues);
      }
      
      // Si estamos en pasos avanzados, asegurar cargar data necesaria
      if (this.step >= 4) {
         this.loadCategories();
      }
    }
  }
  
  clearState() {
    localStorage.removeItem('business_register_state');
  }

  // --- STEP 1: LOGIN / SIGNUP ---
  onSubmitStep1() {
    if (this.registerForm.get('email')?.invalid || this.registerForm.get('password')?.invalid) {
      this.toastr.error('Por favor completa correo y contraseña correctamente', 'Error');
      return;
    }
    if (this.registerForm.get('password')?.value !== this.registerForm.get('confirmPassword')?.value) {
      this.toastr.error('Las contraseñas no coinciden', 'Error');
      return;
    }
    this.nextStep('EMAIL');
  }

  // --- FLOW MANAGEMENT ---
  prevStep() {
    if (this.step > 1) {
      if (this.step === 3 && this.registroMetodo === 'GOOGLE') {
        this.step = 1; 
      } else {
        this.step--;
      }
      this.saveState();
    }
  }

  nextStep(metodo?: 'EMAIL' | 'GOOGLE') {
    if (metodo) {
      this.registroMetodo = metodo;
      if (metodo === 'EMAIL') {
        this.step = 2;
        this.enviarCodigoVerificacion();
        this.saveState();
        return;
      }
      if (metodo === 'GOOGLE') {
        // Skip verification for Google? Or different flow
        this.step = 3;
        this.saveState();
        return;
      }
    }
    this.step++;
    this.saveState();
  }

  // --- STEP 2: VERIFICATION ---
  enviarCodigoVerificacion() {
    // Simular envío
    // TODO: Llamar al backend para enviar email
    this.startTimer();
    this.toastr.info(`Se ha enviado un código a ${this.registerForm.get('email')?.value}`, 'Código Enviado');
  }

  verificarCodigo() {
    // Mock verificación
    if (this.codigoVerificacion === '123456') {
      this.emailVerificado = true;
      clearInterval(this.timerInterval);
      this.toastr.success('Correo verificado éxitosamente', 'Éxito');
      this.nextStep(); // Ir a paso 3
    } else {
      this.toastr.error('Código incorrecto (prueba 123456)', 'Error');
    }
  }

  reenviarCodigo() {
    if (!this.puedeReenviar) return;
    this.enviarCodigoVerificacion();
  }

  startTimer() {
    this.tiempoRestante = 180; // 3 minutos
    this.puedeReenviar = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        this.puedeReenviar = true;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // --- STEP 4: SELECTION TYPE ---
  setRegistrationType(type: 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE') {
    this.registerForm.get('registrationType')?.setValue(type);
    
    // Cargar categorías según el tipo
    this.categories.set([]); // Clear previous
    this.selectedCategory = null; // Reset selection on type change

    if (type === 'NEGOCIO') this.typeCateg = 'Tipo_Neg'; 
    else if (type === 'SERVICIO') this.typeCateg = 'Tipo_Ser';
    else if (type === 'INMUEBLE') this.typeCateg = 'Tipo_Inm'; 
    
    this.loadCategories();
    this.nextStep();
  }
  
  // --- SELECCION DE CATEGORIA EN GRID ---
  selectCategory(catName: string) {
    this.selectedCategory = catName;
    this.registerForm.get('category')?.setValue(catName);
    this.saveState();
  }

  loadCategories() {
    this.loadingCategories.set(true);
    console.log('Loading categories for type:', this.typeCateg);
    this.registerService.getCategories(this.typeCateg).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loadingCategories.set(false);
      },
      error: (err) => {
        console.error('Error loading categories', err);
        // Fallback or empty
        this.loadingCategories.set(false);
      }
    });
  }

  // --- FINAL SUBMIT ---
  finalizarRegistro() {
    if (this.registerForm.invalid) {
      if(this.registerForm.get('businessName')?.invalid) this.toastr.warning('Falta el nombre del negocio');
      else if(this.registerForm.get('ownerName')?.invalid) this.toastr.warning('Falta el nombre del dueño');
      else if(this.registerForm.get('category')?.invalid) this.toastr.warning('Selecciona una categoría');
      else this.toastr.warning('Por favor completa todos los campos requeridos', 'Formulario Incompleto');
      return;
    }

    // Preparar objeto para enviar
    const formVal = this.registerForm.value;
    // Mapear campos nuevos a estructura vieja si es necesario
    formVal.fullname = formVal.ownerName; 

    // TODO: Llamar al servicio de registro real
    console.log('Registrando:', formVal);
    
    // Simulación
    this.toastr.success('Registro completado con éxito', 'Bienvenido');
    this.clearState(); // Limpiar cache al finalizar
    this.router.navigate(['/auth/business-auth']); // O dashboard
  }
}
