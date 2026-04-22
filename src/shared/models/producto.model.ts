export interface Precio {
    precioValor: number;
    descripcion: string;
    cantidadMinima: number;
    modalidad: string;
    esPrincipal: boolean;
}

export interface Producto {
    productoID: number;
    nombre: string;
    descripcion: string;
    precioActual: number;
    categoria?: string;
    categoriaID?: number;
    visible: boolean;
    aprobado: boolean;
    imagenPrincipal?: string;
}

export interface ProductoCreateRequest {
    categoriaID: number;
    nombre: string;
    descripcion: string;
    stock: number;
    stockMinimo: number;
    inventario: boolean;
    precios: Precio[];
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

export interface PrecioDetalle {
    idPrecio: number;
    precioValor: number;
    esPrincipal: boolean;
    descripcion: string;
}

export interface Presentacion {
    presentacionID: number;
    descripcion: string;
    precios: PrecioDetalle[];
}

export interface Imagen {
    imagenID?: number;
    url: string;
    descripcion?: string;
    esPrincipal?: boolean;
}

export interface ProductoDetalle {
  productoID: number;
  nombre: string;
  descripcion?: string;
  presentaciones: Presentacion[];
  precios: PrecioDetalle[];
  imagenes: Imagen[];
  imagenPrincipal: string;
  precioActual: number;
  categoriaID?: number;
  visible?: boolean;
  stock?: number;
  stockMinimo?: number;
  inventario?: boolean;
}
