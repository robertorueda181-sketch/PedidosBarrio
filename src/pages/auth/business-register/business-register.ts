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
import { RegisterRequest } from '../../../shared/interfaces/register.interface';
import { ToastrService } from 'ngx-toastr';
import { GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { AuthService } from '../../../shared/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-business-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MultiSelectModule, InputMaskModule, CheckboxModule, SelectModule,
    FormsModule, GoogleSigninButtonModule, RouterLink, RouterModule, LoaderComponent],
  templateUrl: './business-register.html',
  styleUrl: './business-register.css',
})
export class BusinessRegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private socialAuthService = inject(SocialAuthService);
  private appAuthService = inject(AuthService);
  private ngZone = inject(NgZone);

  // SOCIAL USER
  user: SocialUser | null = null;
  loggedIn: boolean = false;
  
  // MODAL
  showWelcomeModal = signal<boolean>(false);
  isApproved = signal<boolean>(false);

  // CONTROL DE FLUJO
  step = signal(1);
  loading = signal<boolean>(false);
  registroMetodo = signal<'EMAIL' | 'GOOGLE' | null>(null);
  tiposRegistro = { negocio: true, servicio: true, inmueble: true };
  
  // VERIFICACION DE CORREO
  codigoVerificacion = signal<string>('');
  emailVerificado = signal<boolean>(false);
  tiempoRestante = signal<number>(180);
  puedeReenviar = signal<boolean>(false);
  timerInterval: any;

  // STEP POLITICAS
  aceptaTerminos = signal<boolean>(false);
  aceptaDatos = signal<boolean>(false);

  // DATA
  categories = signal<any[]>([]);
  loadingCategories = signal<boolean>(false);
  typeCateg = 'Tipo_Neg'; // Por defecto NEGOCIO (Tipo_Neg)
  selectedCategory = signal<string | null>(null); // Nuevo campo para la grilla
  googleBtnWidth = signal<number>(300);  // Default width

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
    this.calculateGoogleBtnWidth();
  }

  ngOnInit() {
    this.restoreState(); // Recuperar estado al iniciar

    // Suscribirse a cambios de estado de autenticación (Google)
    this.socialAuthService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      if (this.loggedIn && user) {
        console.log('Google User:', user);
        this.handleGoogleLogin(user);
      }
    });
    if(this.step() === 2 && this.registroMetodo() === 'GOOGLE') this.nextStep('GOOGLE');
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
      this.emailVerificado.set(true);
      
      // Avanzar flujo saltando verificación
      this.nextStep('GOOGLE');
    });
  }

  calculateGoogleBtnWidth() {
    // Calculamos el ancho disponible considerando el padding (px-8 = 32px * 2 = 64px)
    // y el ancho máximo permitido por el botón de Google (400px)
    const padding = 64; 
    const maxWidth = 400;
    const width = Math.min(window.innerWidth - padding, maxWidth);
    this.googleBtnWidth.set(width > 0 ? width : 200);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // --- STATE MANAGEMENT (CACHE) ---
  saveState() {
    const state = {
      step: this.step(),
      registroMetodo: this.registroMetodo(),
      formValues: this.registerForm.value,
      emailVerificado: this.emailVerificado(),
      typeCateg: this.typeCateg,
      selectedCategory: this.selectedCategory()
    };
    localStorage.setItem('business_register_state', JSON.stringify(state));
  }

  restoreState() {
    const stored = localStorage.getItem('business_register_state');
    if (stored) {
      const state = JSON.parse(stored);
      this.step.set(state.step || 1);
      this.registroMetodo.set(state.registroMetodo);
      this.emailVerificado.set(state.emailVerificado);
      this.typeCateg = state.typeCateg || 'Tipo_Neg';
      this.selectedCategory.set(state.selectedCategory);
      
      if (state.formValues) {
        this.registerForm.patchValue(state.formValues);
      }
      
      // Si estamos en pasos avanzados, asegurar cargar data necesaria
      if (this.step() >= 4) {
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
    if (this.step() > 1) {
      if (this.step() === 3 && this.registroMetodo() === 'GOOGLE') {
        this.step.set(1); 
      } else {
        this.step.update(s => s - 1);
      }
      this.saveState();
    }
  }

  nextStep(metodo?: 'EMAIL' | 'GOOGLE') {
    if (metodo) {
      this.registroMetodo.set(metodo);
      if (metodo === 'EMAIL') {
        this.step.set(2);
        this.enviarCodigoVerificacion();
        this.saveState();
        return;
      }
      if (metodo === 'GOOGLE') {
        // Skip verification for Google? Or different flow
        this.step.set(3);
        this.saveState();
        return;
      }
    }
    this.step.update(s => s + 1);
    this.saveState();
  }

  // --- STEP 2: VERIFICATION ---
  enviarCodigoVerificacion() {
    const email = this.registerForm.get('email')?.value;
    if (!email) return;

    this.registerService.sendVerificationCode(email).subscribe({
      next: (res) => {
        if(res.success) {
           this.startTimer();
           this.toastr.info(res.message || `Se ha enviado un código a ${email}`, 'Código Enviado');
        } else {
           this.toastr.error(res.message || 'Error al enviar código. Intenta nuevamente.', 'Error');
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('No se pudo conectar con el servidor de correos', 'Error');
      }
    });
  }

  verificarCodigo() {
    const email = this.registerForm.get('email')?.value;
    const code = this.codigoVerificacion();
    
    if (!code || code.length < 6) {
        this.toastr.warning('El código debe tener 6 dígitos', 'Código incompleto');
        return;
    }

    this.registerService.verifyCode(email, code).subscribe({
      next: (res) => {
        if (res.success) {
           this.emailVerificado.set(true);
           clearInterval(this.timerInterval);
           this.toastr.success(res.message || 'Correo verificado correctamente', 'Éxito');
           this.nextStep(); 
        } else {
           this.toastr.error(res.message || 'Código inválido o expirado', 'Error de Verificación');
        }
      },
      error: (err) => {
         console.error(err);
         this.toastr.error(err.error?.message || 'Ocurrió un error al verificar', 'Error'); 
      }
    });
  }

  reenviarCodigo() {
    if (!this.puedeReenviar()) return;
    this.enviarCodigoVerificacion();
  }

  startTimer() {
    this.tiempoRestante.set(180); // 3 minutos
    this.puedeReenviar.set(false);
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      if (this.tiempoRestante() > 0) {
        this.tiempoRestante.update(t => t - 1);
      } else {
        this.puedeReenviar.set(true);
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // --- STEP 4: SELECTION TYPE ---
  setRegistrationType(type: 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE') {
    this.registerForm.get('registrationType')?.setValue(type);
    
    // Cargar categorías según el tipo
    this.categories.set([]); // Clear previous
    this.selectedCategory.set(null); // Reset selection on type change

    if (type === 'NEGOCIO') this.typeCateg = 'Tipo_Neg'; 
    else if (type === 'SERVICIO') this.typeCateg = 'Tipo_Ser';
    else if (type === 'INMUEBLE') this.typeCateg = 'Tipo_Inm'; 
    
    this.loadCategories();
    this.nextStep();
  }
  
  // --- SELECCION DE CATEGORIA EN GRID ---
  selectCategory(catName: string) {
    this.selectedCategory.set(catName);
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

    this.loading.set(true);

    const form = this.registerForm.value;
    const typeMap: any = { 'NEGOCIO': 1, 'SERVICIO': 2, 'INMUEBLE': 3 };
    const tipoId = typeMap[form.registrationType] || 1;

    // Split nombre
    const parts = (form.ownerName || '').trim().split(' ');
    const nombre = parts[0] || '';
    const apellido = parts.slice(1).join(' ') || '';

    const req: RegisterRequest = {
        email: form.email,
        contrasena: form.password, // Nota: Si es Google, la password es dummy 'GOOGLE_AUTH_USER'
        
        nombre: this.user ? this.user.firstName : nombre,
        apellido: this.user ? this.user.lastName : apellido,
        nombreUsuario: form.email.split('@')[0],

        nombreEmpresa: form.businessName,
        tipoEmpresa: tipoId,
        categoria: form.category,
        telefono: form.phone || '',
        
        descripcion: form.description || '',
        direccion: form.address || '',
        referencia: form.reference || '',
        
        provider: this.user ? 'google' : '',
        socialId: this.user?.id || '',
        idToken: this.user?.idToken || '',
        
        // Legacy/compatibility fields if needed by backend (interface defines them)
        fullname: form.ownerName
    };

    console.log('Enviando registro:', req);

    this.loading.set(true);
            this.registerService.registerBusiness(req).subscribe({
        next: (res) => {
            console.log('Registro exitoso:', res);
            
            if (res.token) {
                 // Usamos 'any' en el cast intermedio para compatibilidad si faltan propiedades opcionales
                 // pero aseguramos que SocialUser tenga las obligatorias
                 const user: SocialUser = {
                    provider: 'LOCAL',
                    id: '', 
                    email: req.email,
                    name: `${req.nombre} ${req.apellido}`,
                    photoUrl: '',
                    firstName: req.nombre,
                    lastName: req.apellido,
                    authToken: res.token,
                    idToken: '',
                    authorizationCode: '',
                    response: null
                } as any as SocialUser;
                
                // Guardamos sesión usando el servicio personalizado de la App
                this.appAuthService.saveSession(res.token, user);
                this.appAuthService.user.set(user);
                this.appAuthService.loggedIn.set(true);

                // Mostramos el modal
                this.isApproved.set(!!res.aprobado);
                this.showWelcomeModal.set(true);
               
                this.clearState();
                this.loading.set(false);

            } else {
                this.toastr.success('Registro completado con éxito', 'Bienvenido');
                this.clearState();
                this.router.navigate(['/business-auth']); 
                this.loading.set(false);
            }
        },
        error: (err) => {
            console.error('Error en registro:', err);
            this.loading.set(false);
            // Si es error 400 y tiene lista de errores (formato estándar API)
            if (err.status === 400 && err.error?.errors) {
                const validationErrors = err.error.errors;
                
                // Caso 1: Array de objetos [{field, message}, ...]
                if (Array.isArray(validationErrors)) {
                    validationErrors.forEach((errObj: any) => {
                        const msg = errObj.message || String(errObj);
                        const title = errObj.field ? `Error en ${errObj.field}` : 'Validación';
                        this.toastr.error(msg, title);
                    });
                    return;
                }
                
                // Caso 2: Objeto mapa { "Field": ["Error"] }
                if (typeof validationErrors === 'object') {
                    Object.keys(validationErrors).forEach(key => {
                        const messages = validationErrors[key];
                        if (Array.isArray(messages)) {
                            messages.forEach(msg => this.toastr.error(msg, 'Error de validación'));
                        }
                    });
                    return;
                }
            }

            const msg = err.error?.message || err.message || 'Error al registrar';
            this.toastr.error(msg, 'Intente nuevamente');
        }
    });
  }

  // --- MODAL ACTION ---
  closeModalAndNavigate() {
    this.showWelcomeModal.set(false);
    this.router.navigate(['/empresa']);
  }
}
