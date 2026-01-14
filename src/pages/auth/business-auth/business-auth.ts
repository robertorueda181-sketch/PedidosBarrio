import { Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterService } from '../../../shared/services/register.service';
import { RegisterRequest } from '../../../shared/interfaces/register.interface';
import { LoginRequest } from '../../../shared/interfaces/login.interface';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-business-auth',
    standalone: true,
    imports: [CommonModule, FormsModule, GoogleSigninButtonModule, ToastModule],
    templateUrl: './business-auth.html',
})
export class BusinessAuth implements OnDestroy {
    private authService = inject(AuthService);
    private registerService = inject(RegisterService);
    private socialAuthService = inject(SocialAuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    // Social data captured during registration
    socialUser: any = null;

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

    constructor() {
        // Disable automatic registration globally while on this page
        this.authService.autoRegisterSocial = false;

        effect(() => {
            // Monitor login state for Google Auth
            if (this.authService.loggedIn()) {
                const user = this.authService.user();

                if (this.isRegistering() && this.step() === 1 && user && !this.socialUser) {
                    // Capture social data and move to step 2 WITHOUT calling backend
                    console.log('Google Auth success - Proceeding to step 2');
                    this.socialUser = user;
                    this.email.set(user.email || '');
                    this.personFirstName.set(user.firstName || '');
                    this.personLastName.set(user.lastName || '');
                    this.nextStep();
                } else if (!this.isRegistering()) {
                    // Normal login flow (likely already handled by AuthService subscription if autoRegisterSocial is on, 
                    // but on this page we have it OFF. So we handle it here.)
                    const gUser = this.authService.user();
                    if (gUser && !localStorage.getItem('auth_token')) {
                        const loginData: LoginRequest = {
                            email: gUser.email || '',
                            contrasena: '',
                            provider: 'google',
                            idToken: gUser.idToken || '',
                            googleId: gUser.id || ''
                        };
                        this.authService.login(loginData).subscribe({
                            next: (res) => this.handleSuccessfulAuth(res.tipoEmpresa),
                            error: (err) => {
                                console.error('Social Login failed:', err);
                                const msg = err.error?.error || 'Error al iniciar sesión con Google';
                                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                            }
                        });
                    } else if (localStorage.getItem('auth_token')) {
                        //this.handleSuccessfulAuth(loginData);
                    }
                }
            }
        });
    }

    ngOnDestroy() {
        // Re-enable automatic registration when leaving
        this.authService.autoRegisterSocial = true;
    }

    toggleMode(register: boolean) {
        this.isRegistering.set(register);
        this.step.set(1);
        // Reset fields
        this.email.set('');
        this.password.set('');
        this.loginEmail.set('');
        this.loginPassword.set('');
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
        localStorage.setItem('userType', userType);
        setTimeout(() => this.router.navigate(['/empresa/inicio']), 500);
    }

    manualLogin() {
        if (!this.loginEmail() || !this.loginPassword()) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Ingrese correo y contraseña' });
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
                this.messageService.add({ severity: 'success', summary: 'Bienvenido', detail: 'Inicio de sesión exitoso' });
                this.handleSuccessfulAuth(res.tipoEmpresa);
            },
            error: (err) => {
                console.error('Login failed:', err);
                const errorMessage = err.error?.error || 'Correo o contraseña incorrectos';
                this.messageService.add({ severity: 'error', summary: 'Error de acceso', detail: errorMessage });
            }
        });
    }

    completeRegistration() {
        if (!this.personFirstName() || !this.phoneNumber()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor completa todos los campos' });
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
                this.messageService.add({ severity: 'success', summary: 'Registro Exitoso', detail: 'Tu cuenta ha sido creada' });
                this.handleSuccessfulAuth(res.tipoEmpresa);
            },
            error: (err) => {
                console.error('Registration failed:', err);
                const errorMessage = err.error.error || 'No se pudo completar el registro';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en el registro',
                    detail: typeof errorMessage === 'string' ? errorMessage : 'Error en los datos enviados (400)'
                });
            }
        });
    }
}
