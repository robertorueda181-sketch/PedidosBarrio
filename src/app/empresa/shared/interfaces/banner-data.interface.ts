export interface BannerData {
    titulo?: string;
    descripcion?: string;
    textoBoton?: string;
    link?: string;
    redireccion?: string;
    fechaInicio: Date;
    fechaFin: Date;
    fechaExpiracion: Date;
    imagen?: File;
    urlImagen?: string;
}
