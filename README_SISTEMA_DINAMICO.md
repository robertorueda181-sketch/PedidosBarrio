# 🎨 Sistema de Páginas Dinámicas Avanzado - Page Builder

## 🚀 Visión General

Este es un **sistema completo de construcción de páginas** (Page Builder) que permite crear sitios web totalmente personalizados sin tocar código. Similar a WordPress, Wix o Webflow, pero integrado en tu aplicación.

## ✨ Características Principales

### 1. **Temas Personalizados**
Cada página puede tener su propia identidad visual:
- ✅ **Colores**: Primary, Secondary, Accent, Background, Text
- ✅ **Tipografía**: Fuentes para títulos y texto
- ✅ **Bordes**: Radio de bordes personalizado

### 2. **10 Tipos de Secciones**
1. **Hero** - Banner principal con imagen, título, botones
2. **Stats** - Estadísticas con iconos
3. **Text + Image** - Contenido con imagen (izquierda/derecha)
4. **Video Gallery** - Galería de videos de YouTube
5. **Testimonials** - Testimonios de clientes
6. **CTA** - Call to Action
7. **Features** - Características/beneficios
8. **Gallery** - Galería de imágenes
9. **Contact Form** - Formulario de contacto
10. **Custom HTML** - HTML personalizado

### 3. **Configuración Flexible**
Cada sección puede configurar:
- Color de fondo
- Padding superior/inferior
- Clases CSS personalizadas
- Orden de visualización
- Visibilidad (mostrar/ocultar)

## 📊 Estructura de Base de Datos

### Tablas:

```
PaginasDinamicas
├── PaginaID (PK)
├── Slug (único)
├── Titulo
├── MetaDescripcion
├── MetaKeywords (JSON)
└── Activa

PaginaTema
├── TemaID (PK)
├── PaginaID (FK)
├── ColorPrimario
├── ColorSecundario
├── ColorAcento
├── ColorFondo
├── ColorTexto
├── ColorTextoClaro
├── FuenteTitulos
├── FuenteTexto
└── RadioBordes

PaginaSecciones
├── SeccionID (PK)
├── PaginaID (FK)
├── SeccionIdentificador
├── TipoSeccion
├── Orden
├── Visible
├── ColorFondo
├── PaddingTop
├── PaddingBottom
├── ClasePersonalizada
└── DatosJSON (configuración específica)
```

## 🎯 Tipos de Secciones Detallados

### 1. Hero Section
```json
{
  "type": "hero",
  "data": {
    "imageUrl": "url-imagen",
    "title": "Título principal",
    "subtitle": "Subtítulo",
    "badge": {
      "text": "Badge",
      "color": "#color"
    },
    "buttons": [
      {
        "text": "Texto botón",
        "style": "primary|secondary|outline",
        "action": "/ruta"
      }
    ],
    "height": "80vh",
    "overlay": {
      "enabled": true,
      "color": "#color",
      "opacity": 0.7
    }
  }
}
```

### 2. Stats Section
```json
{
  "type": "stats",
  "data": {
    "title": "Título opcional",
    "stats": [
      {
        "label": "Etiqueta",
        "value": "25+",
        "icon": "pi-calendar"
      }
    ],
    "columns": 4,
    "style": "cards|minimal|bordered"
  }
}
```

### 3. Text + Image Section
```json
{
  "type": "text-image",
  "data": {
    "title": "Título",
    "description": "Descripción",
    "imageUrl": "url-imagen",
    "imagePosition": "left|right",
    "features": ["Feature 1", "Feature 2"],
    "button": {
      "text": "Texto",
      "action": "/ruta"
    }
  }
}
```

### 4. Video Gallery Section
```json
{
  "type": "video-gallery",
  "data": {
    "title": "Título",
    "description": "Descripción",
    "videos": [
      {
        "title": "Título video",
        "url": "youtube-url",
        "description": "Descripción",
        "thumbnail": "url-opcional"
      }
    ],
    "columns": 2
  }
}
```

### 5. Features Section
```json
{
  "type": "features",
  "data": {
    "title": "Título",
    "description": "Descripción",
    "features": [
      {
        "icon": "pi-shield",
        "title": "Título feature",
        "description": "Descripción"
      }
    ],
    "columns": 3,
    "style": "cards|list|icons"
  }
}
```

### 6. Testimonials Section
```json
{
  "type": "testimonials",
  "data": {
    "title": "Título",
    "testimonials": [
      {
        "name": "Nombre",
        "role": "Rol",
        "photo": "url-foto",
        "text": "Testimonio",
        "rating": 5
      }
    ],
    "style": "cards|carousel|grid"
  }
}
```

### 7. CTA Section
```json
{
  "type": "cta",
  "data": {
    "title": "Título",
    "description": "Descripción",
    "button": {
      "text": "Texto botón",
      "action": "/ruta"
    },
    "backgroundImage": "url-opcional",
    "style": "centered|split"
  }
}
```

## 🔧 Implementación Backend

### Endpoint Principal
```
GET /api/paginas/{slug}
```

### Respuesta Esperada
```json
{
  "pageInfo": {
    "slug": "pilar",
    "title": "Título",
    "metaDescription": "...",
    "metaKeywords": ["..."]
  },
  "theme": {
    "colors": { ... },
    "fonts": { ... },
    "borderRadius": "2rem"
  },
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "order": 1,
      "visible": true,
      "backgroundColor": "#fff",
      "padding": {
        "top": "5rem",
        "bottom": "5rem"
      },
      "data": { ... }
    }
  ]
}
```

### Stored Procedure
```sql
EXEC sp_GetPaginaDinamica 'pilar'
```

## 🎨 Aplicación de Tema Dinámico

El tema se aplica automáticamente usando CSS Variables:

```typescript
ngOnInit() {
  this.applyTheme(this.pageData.theme);
}

applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-text-light', theme.colors.textLight);
  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--border-radius', theme.borderRadius);
}
```

## 📝 Cómo Agregar una Nueva Sección

### Desde SQL:
```sql
EXEC sp_AgregarSeccion 
  @PaginaID = 1,
  @SeccionIdentificador = 'features-2',
  @TipoSeccion = 'features',
  @Orden = 10,
  @ColorFondo = '#F7FAFC',
  @PaddingTop = '5rem',
  @PaddingBottom = '5rem',
  @DatosJSON = N'{
    "title": "Nuevas Características",
    "features": [...]
  }'
```

### Desde API:
```javascript
POST /api/paginas/{paginaId}/secciones
{
  "seccionIdentificador": "features-2",
  "tipoSeccion": "features",
  "orden": 10,
  "colorFondo": "#F7FAFC",
  "paddingTop": "5rem",
  "paddingBottom": "5rem",
  "datosJSON": { ... }
}
```

## 🎯 Ventajas del Sistema

1. **Sin Código** - Crea páginas completas sin programar
2. **Totalmente Personalizable** - Colores, fuentes, estilos
3. **Secciones Ilimitadas** - Agrega cuantas quieras
4. **Reordenable** - Cambia el orden fácilmente
5. **Multi-sitio** - Múltiples páginas con diferentes temas
6. **SEO Friendly** - Meta tags personalizados
7. **Responsive** - Todo es responsive por defecto
8. **Escalable** - Agrega nuevos tipos de secciones fácilmente

## 🔐 Casos de Uso

- ✅ Páginas de colegios/instituciones
- ✅ Landing pages de productos
- ✅ Páginas corporativas
- ✅ Portafolios
- ✅ Páginas de eventos
- ✅ Micrositios
- ✅ Páginas de campaña

## 📚 Archivos del Sistema

### Frontend:
- `dynamic-page.interface.ts` - Interfaces TypeScript
- `dynamic-section.component.ts` - Componente router de secciones
- Componentes individuales para cada tipo de sección

### Backend:
- `ESTRUCTURA_BD_DINAMICA.sql` - Schema completo
- `sp_GetPaginaDinamica` - SP para obtener página
- `sp_AgregarSeccion` - SP para agregar secciones

### Documentación:
- `ESTRUCTURA_BD_DINAMICA.json` - Ejemplo JSON completo
- `README_SISTEMA_DINAMICO.md` - Esta documentación

## 🚀 Próximos Pasos

1. Ejecutar el script SQL
2. Crear el endpoint en tu API
3. Crear los componentes de sección individuales
4. Implementar el sistema de temas con CSS Variables
5. ¡Empezar a crear páginas!

---

**Sistema creado por**: Page Builder Dinámico
**Versión**: 2.0 Advanced
**Fecha**: Enero 2026
