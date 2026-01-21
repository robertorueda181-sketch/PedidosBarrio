import { Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterService } from '../../../shared/services/register.service';
import { RegisterRequest } from '../../../shared/interfaces/register.interface';
import { LoginRequest } from '../../../shared/interfaces/login.interface';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'app-business-auth',
    standalone: true,
    imports: [CommonModule, FormsModule, GoogleSigninButtonModule, RouterModule],
    templateUrl: './business-auth.html',
})
export class BusinessAuth implements OnDestroy {
    private authService = inject(AuthService);
    private registerService = inject(RegisterService);
    private socialAuthService = inject(SocialAuthService);
    private router = inject(Router);
    private toastr = inject(ToastrService);

    // Social data captured during registration
    socialUser: any = null;
    
    // Prevent multiple simultaneous navigations
    private isNavigating = false;

    // State
    isRegistering = signal<boolean>(false);
    step = signal<number>(1);
    showPassword = signal<boolean>(false);

    // Login Data
    loginEmail = signal<string>('');
    loginPassword = signal<string>('');

    // Registration Data
    email = signal<string>('');
    password = signal<string>('');

    selectedCategory = signal<string>(''); // 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE'

    phoneNumber = signal<string>('');
    businessName = signal<string>(''); // For Negocio
    serviceType = signal<string>(''); // For Servicio

    personFirstName = signal<string>('');
    personLastName = signal<string>('');
    acceptTerms = signal<boolean>(false);

    constructor() {
        // Disable automatic registration globally while on this page
        this.authService.autoRegisterSocial = false;

        effect(() => {
            // Monitor login state for Google Auth
            const isLoggedIn = this.authService.loggedIn();
            const user = this.authService.user();
            const currentStep = this.step();
            const isRegistering = this.isRegistering();

            const hasToken = !!localStorage.getItem('auth_token');
            console.log('Auth effect - LoggedIn:', isLoggedIn, 'Step:', currentStep, 'IsRegistering:', isRegistering, 'HasToken:', hasToken, 'IsNavigating:', this.isNavigating, 'User:', user?.email);

            if (isLoggedIn && user) {
                // Registration flow: Capture social data and move to step 2
                if (isRegistering && currentStep === 1 && !this.socialUser) {
                    console.log('✅ Flow: Registration - Proceeding to step 2');
                    this.socialUser = user;
                    this.email.set(user.email || '');
                    this.personFirstName.set(user.firstName || '');
                    this.personLastName.set(user.lastName || '');
                    this.nextStep();
                } 
                // Login flow: Attempt login if not already authenticated
                else if (!isRegistering && !hasToken && !this.isNavigating) {
                    console.log('✅ Flow: Social Login - Authenticating with backend');
                    this.isNavigating = true;
                    const loginData: LoginRequest = {
                        email: user.email || '',
                        contrasena: '',
                        provider: 'google',
                        idToken: user.idToken || '',
                        googleId: user.id || ''
                    };
                    
                    console.log('Sending login request:', { email: loginData.email, provider: loginData.provider });
                    
                    this.authService.login(loginData).subscribe({
                        next: (res) => {
                            console.log('✅ Social login successful:', res);
                            this.handleSuccessfulAuth(res.tipoEmpresa);
                        },
                        error: (err) => {
                            console.error('❌ Social Login failed:', err);
                            this.isNavigating = false;
                            const msg = err.error?.error || 'Error al iniciar sesión con Google';
                            this.toastr.error(msg, 'Error');
                        }
                    });
                }
                // Already authenticated: Redirect to dashboard
                else if (!isRegistering && hasToken && !this.isNavigating) {
                    console.log('✅ Flow: Already authenticated - Redirecting');
                    const userType = localStorage.getItem('userType') || '1';
                    this.handleSuccessfulAuth(userType);
                } else {
                    console.log('⚠️ No matching flow - Conditions:', {
                        isRegistering,
                        hasToken,
                        isNavigating: this.isNavigating,
                        currentStep,
                        hasSocialUser: !!this.socialUser
                    });
                }
            } else {
                console.log('⚠️ Effect triggered but user not ready - LoggedIn:', isLoggedIn, 'HasUser:', !!user);
            }
        });
    }

    ngOnDestroy() {
        // Re-enable automatic registration when leaving
        this.authService.autoRegisterSocial = true;
        this.isNavigating = false;
    }

    toggleMode(register: boolean) {
        this.isRegistering.set(register);
        this.step.set(1);
        // Reset fields
        this.email.set('');
        this.password.set('');
        this.loginEmail.set('');
        this.loginPassword.set('');
        this.acceptTerms.set(false);
    }

    togglePassword() {
        this.showPassword.update(s => !s);
    }

    setCategory(cat: string) {
        this.selectedCategory.set(cat);
        this.nextStep();
    }

    nextStep() {
        this.step.update(s => s + 1);
    }

    prevStep() {
        this.step.update(s => s - 1);
    }

    handleSuccessfulAuth(userType: string) {
        console.log('🚀 handleSuccessfulAuth called - UserType:', userType, 'IsNavigating:', this.isNavigating);
        localStorage.setItem('userType', userType);
        
        // Navigate immediately using promise-based approach
        console.log('🔄 Attempting navigation to /empresa/inicio');
        this.router.navigate(['/empresa/inicio']).then(
            (success) => {
                if (success) {
                    console.log('✅ Navigation successful to /empresa/inicio');
                    this.isNavigating = false;
                } else {
                    console.error('❌ Navigation returned false - route may not exist or guard blocked');
                    this.isNavigating = false;
                }
            },
            (error) => {
                console.error('❌ Navigation promise rejected:', error);
                this.isNavigating = false;
            }
        ).catch((err) => {
            console.error('❌ Navigation exception:', err);
            this.isNavigating = false;
        });
    }

    manualLogin() {
        if (!this.loginEmail() || !this.loginPassword()) {
            this.toastr.warning('Ingrese correo y contraseña', 'Campos requeridos');
            return;
        }

        const loginData: LoginRequest = {
            email: this.loginEmail(),
            contrasena: this.loginPassword(),
            provider: '',
            idToken: '',
            googleId: ''
        };

        this.authService.login(loginData).subscribe({
            next: (res) => {
                console.log('Login successful:', res);
                this.toastr.success('Inicio de sesión exitoso', 'Bienvenido');
                this.handleSuccessfulAuth(res.tipoEmpresa);
            },
            error: (err) => {
                console.error('Login failed:', err);
                const errorMessage = err.error?.error || 'Correo o contraseña incorrectos';
                this.toastr.error(errorMessage, 'Error de acceso');
            }
        });
    }

    completeRegistration() {
        if (!this.personFirstName() || !this.phoneNumber()) {
            this.toastr.warning('Por favor completa todos los campos', 'Atención');
            return;
        }

        const categoryMap: { [key: string]: number } = {
            'NEGOCIO': 1,
            'SERVICIO': 2,
            'INMUEBLE': 3
        };

        const registrationData: RegisterRequest = {
            email: this.email(),
            nombre: this.personFirstName(),
            apellido: this.personLastName() || ' ',
            nombreUsuario: this.email().split('@')[0],
            contrasena: this.password() || 'GoogleAuth123*',
            nombreEmpresa: this.businessName() || 'Negocio Local',
            tipoEmpresa: categoryMap[this.selectedCategory()] || 1,
            categoria: this.selectedCategory() === 'SERVICIO' ? this.serviceType() : this.selectedCategory(),
            telefono: this.phoneNumber(),
            descripcion: 'Registro de empresa',
            direccion: ' ',
            referencia: ' ',
            provider: this.socialUser ? 'google' : '',
            socialId: this.socialUser ? this.socialUser.id : '',
            idToken: this.socialUser ? this.socialUser.idToken : ''
        };

        console.log('Sending Registration Data:', registrationData);

        const obs = this.registerService.registerBusiness(registrationData);

        obs.subscribe({
            next: (res) => {
                console.log('Registration successful:', res);
                this.toastr.success('Tu cuenta ha sido creada', 'Registro Exitoso');
                this.handleSuccessfulAuth(res.tipoEmpresa);
            },
            error: (err) => {
                console.error('Registration failed:', err);
                const errorMessage = err.error.error || 'No se pudo completar el registro';
                this.toastr.error(
                    typeof errorMessage === 'string' ? errorMessage : 'Error en los datos enviados (400)',
                    'Error en el registro'
                );
            }
        });
    }
}
