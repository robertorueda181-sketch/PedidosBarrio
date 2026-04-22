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
  registerStep = signal(1); // 1: Credentials/Social, 2: Personal Info
  socialUser: SocialUser | null = null;
  private isNavigating = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  documentTypes = [
    { label: 'DNI', value: 'DNI' },
    { label: 'Carnet Ext.', value: 'CE' }
  ];

  registerForm: FormGroup = this.fb.group({
    tipoDocumento: ['DNI', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(8), Validators.maxLength(8)]],
    nombres: ['', [Validators.required, Validators.minLength(3)]],
    apellidos: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: ['', [Validators.pattern(/^[0-9]+$/), Validators.minLength(9), Validators.maxLength(9)]],
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
        this.router.navigate(['/mi-perfil']);
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


    // Subscribe to document type changes
    this.registerForm.get('tipoDocumento')?.valueChanges.subscribe(type => {
      const dniControl = this.registerForm.get('dni');
      if (type === 'DNI') {
        dniControl?.clearValidators();
        // DNI: 8 digits only numbers
        dniControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(8), Validators.maxLength(8)]);
      } else {
        dniControl?.clearValidators();
        // CE: Alphanumeric, usually 9-12 chars
        dniControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(12)]);
      }
      dniControl?.updateValueAndValidity();
    });

    effect(() => {
      const isLoggedIn = this.authService.loggedIn();
      const socialUser = this.authService.user();
      const hasToken = !!localStorage.getItem('auth_token');

      if (isLoggedIn && socialUser && !hasToken && !this.isNavigating) {
        console.log('ClientAuth: Google Link Detected (New Flow)', { socialUser });
        this.isNavigating = true;
        this.isLoading.set(true);
        this.socialUser = socialUser;

        // Attempt to login with Google credentials first
        const credentials: ClientGoogleLoginRequest = {
          dni: '',
          nombres: socialUser.firstName || '',
          contrasena: '',
          telefono: '',
          provider: 'google',
          idToken: socialUser.idToken || '',
          googleId: socialUser.id || '',
          email: socialUser.email || ''
        };

        this.registerService.loginClientGoogle(credentials).subscribe({
          next: (res: any) => {
            console.log('Google Auth Response:', res);

            // Backend returns: { Success: true, Data: { Token: '...' } } (PascalCase or camelCase)
            const token = res?.data?.token || res?.Data?.Token || res?.token;

            if (token) {
              this.authService.saveSession(token, socialUser);
              this.toastr.success('Bienvenido de nuevo', 'Inicio de sesión exitoso');
              localStorage.setItem('userType', 'CLIENTE');
              this.router.navigate(['/mi-perfil']);
            } else {
              // If success is false or no token, treating as "not registered" 
              // verify logic later with console.log output
              if (res?.success === false || res?.Success === false) {
                throw new Error("User not registered or login failed");
              }
              throw new Error("No token returned in response");
            }
            this.isLoading.set(false);
          },
          error: (err) => {
            console.log('Google login failed, proceeding to registration', err);
            this.isLoading.set(false);

            // Switch to Register Tab and Pre-fill
            this.activeTabIndex.set(1);
            this.registerStep.set(2);

            // Clear password requirements for Google users
            this.registerForm.get('password')?.clearValidators();
            this.registerForm.get('confirmPassword')?.clearValidators();
            this.registerForm.get('password')?.updateValueAndValidity();
            this.registerForm.get('confirmPassword')?.updateValueAndValidity();

            this.registerForm.patchValue({
              nombres: (socialUser.firstName || '').trim(),
              apellidos: (socialUser.lastName || '').trim(),
              email: socialUser.email
            });
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
        this.router.navigate(['/mi-perfil']);
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
    const { dni, nombres, apellidos, email, password, telefono } = this.registerForm.value;

    if (this.socialUser) {
      // Complete Google Registration
      const payload: ClientGoogleLoginRequest = {
        dni: dni,
        nombres: `${nombres} ${apellidos}`,
        email: email,
        contrasena: password || "",
        telefono: telefono || "",
        provider: 'google',
        idToken: this.socialUser.idToken || '',
        googleId: this.socialUser.id || '',
      };

      // NOW we call the Google Login API with the complete data (DNI, Phone)
      this.registerService.loginClientGoogle(payload).subscribe({
        next: (res) => {
          if (res && res.token) {
            this.authService.saveSession(res.token, this.socialUser!);
            this.toastr.success('Registro completado con Google', 'Bienvenido');
            localStorage.setItem('userType', 'CLIENTE');
            this.router.navigate(['/mi-perfil']);
          }
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Error al completar registro con Google', 'Error');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false)
      });

      return;
    }

    const payload: ClientRegisterRequest = {
      dni: dni,
      nombres: `${nombres} ${apellidos}`,
      email: email,
      contrasena: password,
      telefono: telefono || "",
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

  nextRegisterStep() {
    // If manually registering (step 1 -> 2)
    if (!this.socialUser) {
      const email = this.registerForm.get('email');
      const password = this.registerForm.get('password');
      const confirmPassword = this.registerForm.get('confirmPassword');

      if (email?.invalid || password?.invalid || confirmPassword?.invalid) {
        // Mark all relevant controls as touched to show errors
        if (email?.invalid) email?.markAsTouched();
        if (password?.invalid) password?.markAsTouched();
        if (confirmPassword?.invalid) confirmPassword?.markAsTouched();
        if (password?.value !== confirmPassword?.value) {
          this.toastr.warning('Las contraseñas no coinciden', 'Atención');
        } else {
          this.toastr.warning('Por favor complete todos los campos obligatorios.', 'Atención');
        }
        return;
      }
    }

    this.registerStep.set(2);
  }

  prevRegisterStep() {
    // If social user goes back, we should probably reset? 
    // Or allow editing email?
    // For now just go back.
    this.registerStep.set(this.registerStep() - 1);
  }

  toggleTab(index: number) {
    this.activeTabIndex.set(index);
    this.registerStep.set(1);
    if (index === 0) {
      this.socialUser = null;
      this.resetValidators();
    }
  }

  private resetValidators() {
    this.registerForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.registerForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.registerForm.get('password')?.updateValueAndValidity();
    this.registerForm.get('confirmPassword')?.updateValueAndValidity();
  }
}


