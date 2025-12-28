export interface RegisterRequest {
    fullname: string;
    dni: string;
    businessName: string;
    ruc: string;
    category: string;
    schedules: Schedule[];
    address: string;
    useMap: boolean;
    lat?: number;
    lng?: number;
    phone: string;
    email: string;
    description?: string;
    reference?: string;
    username?: string;
    password: string;
    registrationType: 'PRODUCT' | 'REAL_ESTATE';
    propertyType?: string;
    squareMeters?: number;
    bathrooms?: number;
    rooms?: number;
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
