import { Injectable, inject, signal } from '@angular/core';
import { SocialAuthService, SocialUser, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';
import { RegisterService } from './register.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private socialAuthService = inject(SocialAuthService);
    private router = inject(Router);
    private registerService = inject(RegisterService);

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_data';

    user = signal<SocialUser | null>(null);
    loggedIn = signal<boolean>(false);

    constructor() {
        // Check for existing session on app start
        this.checkExistingSession();

        this.socialAuthService.authState.subscribe((user) => {
            this.user.set(user);
            this.loggedIn.set(user != null);
            if (user) {
                console.log('User logged in:', user);
                this.registerSocialUser(user);
            } else {
                // User logged out
                this.clearSession();
            }
        });
    }

    signOut() {
        this.socialAuthService.signOut();
        this.clearSession();
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            return Date.now() < expiry;
        } catch {
            return false;
        }
    }

    private checkExistingSession() {
        const token = this.getToken();
        const userData = localStorage.getItem(this.USER_KEY);

        if (token && userData && this.isAuthenticated()) {
            try {
                const user = JSON.parse(userData);
                this.user.set(user);
                this.loggedIn.set(true);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearSession();
            }
        }
    }

    private saveSession(token: string, user: SocialUser) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    private clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.user.set(null);
        this.loggedIn.set(false);
    }

    private registerSocialUser(user: SocialUser) {
        // Only register if we have the required data
        if (!user.id || !user.email) {
            console.error('User data incomplete:', user);
            return;
        }

        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            provider: user.provider || 'google',
            idToken: user.idToken || ''
        };

        this.registerService.registerSocialUser(userData).subscribe({
            next: (response) => {
                console.log('User registered/authenticated successfully:', response);

                // Assuming the backend returns { token: string, user: object }
                if (response.token) {
                    this.saveSession(response.token, user);
                    console.log('Session saved successfully');
                } else {
                    console.warn('No token received from backend');
                }
            },
            error: (error) => {
                console.error('Error registering/authenticating user:', error);
                // Handle error - maybe user already exists or backend error
                // For now, we'll still allow the user to be logged in locally
                // but they won't have a backend session
            }
        });
    }
}
