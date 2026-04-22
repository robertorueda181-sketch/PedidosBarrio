export interface ClientGoogleLoginRequest {
    dni: string;
    nombres: string;
    contrasena: string;
    telefono: string;
    provider: string;
    idToken: string;
    googleId: string;
    email: string;
}

export interface ClientRegisterRequest {
    dni: string;
    nombres: string;
    email: string;
    contrasena: string;
    telefono: string;
    tipoUsuario: string;
}
