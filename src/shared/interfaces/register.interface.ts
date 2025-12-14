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
}

export interface Schedule {
    days: string[];
    startTime: string;
    endTime: string;
}
