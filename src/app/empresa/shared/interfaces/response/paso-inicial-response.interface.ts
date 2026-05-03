export interface PasoInicialResponse {
    data: {
        pasoID: number;
        empresaID: string;
        titulo: string;
        descripcion: string;
        icono: string;
        ruta: string;
        obligatorio: boolean;
        completado: boolean;
        orden: number;
        fechaCreacion: string;
        fechaCompletado: string | null;
    }[];
}