export interface Precio {
    precio: number;
    descripcion: string;
    cantidadMinima: number;
    modalidad: string;
    esPrincipal: boolean;
}

export interface Producto {
    productoID: number;
    empresaID: string;
    nombre: string;
    descripcion: string;
    precioActual: number;
    urlImagen?: string;
    categoria?: string;
    categoriaID?: number;
    visible: boolean;
    aprobado: boolean;
}

export interface ProductoCreateRequest {
    categoriaID: number;
    nombre: string;
    descripcion: string;
    stock: number;
    stockMinimo: number;
    inventario: boolean;
    precios: Precio[];
    imagenUrl: string;
    imagenDescripcion: string;
}

export interface Categoria {
    categoriaID: number;
    empresaID: string;
    descripcion: string;
    color?: string;
    icono?: string;
    orden?: number;
    activo: boolean;
}

export interface CategoriasProductosResponse {
    categorias: Categoria[];
    productos: Producto[];
}
