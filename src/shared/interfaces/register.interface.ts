export interface RegisterRequest {
    // New fields
    email: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    contrasena: string;
    nombreEmpresa: string;
    tipoEmpresa: number;
    categoria: string;
    telefono: string;
    descripcion: string;
    direccion: string;
    referencia: string;
    provider: string; // 'google' | ''
    socialId: string;
    idToken: string;

    // Old fields (kept for compatibility)
    fullname?: string;
    dni?: string;
    businessName?: string;
    ruc?: string;
    category?: string;
    address?: string;
    city?: string;
    province?: string;
    department?: string;
    useMap?: boolean;
    lat?: number;
    lng?: number;
    phone?: string;
    username?: string;
    password?: string;
    registrationType?: string;
    personType?: string;
    idType?: string;
    propertyType?: string;
    squareMeters?: number;
    bathrooms?: number;
    rooms?: number;
    schedules?: Schedule[];
}

export interface Schedule {
    days: string[];
    startTime: string;
    endTime: string;
}

export interface SocialUserRequest {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    provider: string;
    idToken: string;
}
