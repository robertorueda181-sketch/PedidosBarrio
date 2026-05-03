export interface DashboardResponse {
    cantidadProductos: number;
    vistasHoy: number;
    suscripcion: {
        suscripcionID: number;
        nivelSuscripcion: number;
        monto: number;
        fechaInicio: string;
        fechaFin: string;
        activa: boolean;
        nivelDescripcion: string;
    };
    estadisticasPorMes: {
        mes: string;
        nombreMes: string;
        año: number;
        totalVistas: number;
    }[];
}