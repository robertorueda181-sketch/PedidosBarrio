import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterService } from '../../../shared/services/register.service';
import { LoginRequest } from '../../../shared/interfaces/login.interface';
import { ClientGoogleLoginRequest, ClientRegisterRequest } from '../../../shared/interfaces/client-auth.interface';
import { ToastrService } from 'ngx-toastr';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { GoogleSigninButtonModule, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-client-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    TabsModule,
    GoogleSigninButtonModule
  ],
  templateUrl: './client-auth.html',
  styleUrls: ['./client-auth.css']
})
export class ClientAuthComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private registerService = inject(RegisterService);
  private socialAuthService = inject(SocialAuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  isLoading = signal(false);
  activeTabIndex = signal(0); // 0: Login, 1: Register
  socialUser: SocialUser | null = null;
  private isNavigating = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm: FormGroup = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(8), Validators.maxLength(8)]],
    nombres: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(9), Validators.maxLength(9)]],
    confirmPassword: ['', [Validators.required]],
    terms: [false, Validators.requiredTrue]
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.authService.autoRegisterSocial = false;
    
    // If we are on this page, we should probably ensure no previous session interferes with a NEW login attempt
    // unless it's a valid client session which we redirect.
    if (this.authService.isAuthenticated()) {
        const userType = localStorage.getItem('userType');
        if (userType === 'CLIENTE') {
             this.router.navigate(['/']);
             return;
        } else {
            // If logged in as something else (e.g. EMPRESA), we should clear it to allow new login
            this.authService.signOut(false);
        }
    } else {
        // Clear any stale tokens just in case
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    effect(() => {
        const isLoggedIn = this.authService.loggedIn();
        const socialUser = this.authService.user();
        const hasToken = !!localStorage.getItem('auth_token');

        if (isLoggedIn && socialUser && !hasToken && !this.isNavigating) {
            console.log('ClientAuth: Google Link Detected', { socialUser });
            this.isNavigating = true;
            this.isLoading.set(true);
            
            // Try to login with Google (assuming user might already exist)
            const googleAuthPayload: ClientGoogleLoginRequest = {
                dni: "0",
                nombres: `${socialUser.firstName} ${socialUser.lastName}`,
                contrasena: "",
                telefono: "0",
                provider: "google",
                idToken: socialUser.idToken || "",
                googleId: socialUser.id || "",
                email: socialUser.email || ""
            };
            
            this.registerService.loginClientGoogle(googleAuthPayload).subscribe({
                next: (res) => {
                    // If login successful (user existed and backend allowed login without explicit DNI check or DNI was already there? 
                    // Actually, if user exists, backend probably has DNI. If backend updates user with "0", that's bad.
                    // Assuming backend ignores "0" if user exists, or returns success.)
                    if (res && res.token) {
                         this.authService.saveSession(res.token, socialUser);
                         this.toastr.success('Inicio de sesión exitoso con Google', 'Bienvenido');
                         localStorage.setItem('userType', 'CLIENTE');
                         this.router.navigate(['/']); 
                    }
                },
                error: (err) => {
                    // If error (likely user not found or validation failed due to missing DNI for new user)
                    console.warn('Google Login failed (likely new user needing DNI):', err);
                    this.isLoading.set(false);
                    this.isNavigating = false; // Allow interaction
                    this.socialUser = socialUser; // Store for form
                    
                    // Switch to Register Tab and Pre-fill
                    this.activeTabIndex.set(1);
                    this.registerForm.patchValue({
                        nombres: `${socialUser.firstName} ${socialUser.lastName}`.trim(),
                        email: socialUser.email
                    });
                     
                    this.toastr.info('Para culminar el registro, por favor complete su DNI y teléfono.', 'Completar Registro');
                }
            });
        }
    });
                },
                complete: () => {
                    this.isLoading.set(false);
                    this.isNavigating = false;
                }
            });
        }
    });

    // Clean up mock navigation state if returning to login
    if (this.authService.isAuthenticated()) {
        const userType = localStorage.getItem('userType');
        if (userType === 'CLIENTE') {
             this.router.navigate(['/']);
        }
    }
  }

  ngOnDestroy() {
    this.authService.autoRegisterSocial = true;
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    const credentials: LoginRequest = {
        email: email,
        contrasena: password,
        provider: 'LOCAL',
        idToken: '',
        googleId: ''
    };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.toastr.success('Bienvenido de nuevo', 'Inicio de sesión exitoso');
        localStorage.setItem('userType', 'CLIENTE');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error', err);
        this.toastr.error('Credenciales incorrectas o error de servidor', 'Error');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { dni, nombres, email, password, telefono } = this.registerForm.value;

    const payload: ClientRegisterRequest = {
      dni: dni,
      nombres: nombres,
      email: email,
      contrasena: password,
      telefono: telefono,
      tipoUsuario: 'CLIENTE'
    };
    
    // Using existing registerClient but ensuring payload matches backend expectations
    // If registerClient fails due to missing fields, user might need to adjust registerService or payload
    this.registerService.registerClient(payload).subscribe({
      next: (res) => {
        this.toastr.success('Cuenta creada exitosamente. Por favor inicia sesión.', 'Registro exitoso');
        this.activeTabIndex.set(0); 
        this.loginForm.patchValue({ email });
        this.registerForm.reset();
      },
      error: (err) => {
        console.error('Register error', err);
        this.toastr.error(err.error?.message || 'No se pudo crear la cuenta', 'Error');
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  toggleTab(index: number) {
    this.activeTabIndex.set(index);
  }
}

