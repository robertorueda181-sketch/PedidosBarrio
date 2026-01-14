# 📚 Sistema Dinámico de Páginas para Colegios/Instituciones

## 🎯 Resumen

Este sistema permite crear páginas completamente dinámicas para colegios u otras instituciones educativas, donde **TODO el contenido** se carga desde la base de datos.

## 📋 ¿Qué se puede configurar dinámicamente?

### 1. **Hero/Banner Principal**
- Imagen de fondo
- Título del colegio
- Subtítulo/descripción
- Año de admisiones
- Textos de los botones de acción

### 2. **Estadísticas** (Ilimitadas)
- Etiqueta (ej: "Años de Experiencia")
- Valor (ej: "25+")
- Orden de visualización

### 3. **Niveles Educativos** (Inicial, Primaria, Secundaria, etc.)
- Título del nivel
- Descripción
- Imagen representativa
- Lista de características/beneficios
- Orden de visualización

### 4. **Videos de YouTube** (Ilimitados)
- Título del video
- URL (acepta cualquier formato de YouTube)
- Descripción
- Orden de visualización

### 5. **Call to Action Final**
- Título
- Descripción
- Texto del botón

## 🗄️ Estructura de Base de Datos

### Tablas Principales:

1. **Instituciones** - Datos básicos del colegio
2. **InstitucionHero** - Banner principal
3. **InstitucionEstadisticas** - Estadísticas numéricas
4. **NivelesEducativos** - Niveles educativos (Inicial, Primaria, etc.)
5. **NivelCaracteristicas** - Características de cada nivel
6. **InstitucionVideos** - Videos de YouTube
7. **InstitucionCTA** - Call to Action final

### Diagrama de Relaciones:
```
Instituciones (1) ──┬── InstitucionHero (1)
                    ├── InstitucionEstadisticas (N)
                    ├── NivelesEducativos (N) ── NivelCaracteristicas (N)
                    ├── InstitucionVideos (N)
                    └── InstitucionCTA (1)
```

## 🔧 Archivos Importantes

### Frontend (Angular):
- **Interface**: `src/shared/interfaces/school-page.interface.ts`
  - Define la estructura TypeScript de los datos
  
- **Componente**: `src/pages/companies/pilar/pilar.ts`
  - Contiene la lógica para cargar y mostrar los datos
  - Método `convertToEmbedUrl()` para convertir URLs de YouTube automáticamente

- **Template**: `src/pages/companies/pilar/pilar.html`
  - Vista completamente dinámica usando `pageData`

### Backend (SQL Server):
- **Script SQL**: `ESTRUCTURA_BD_COLEGIO.sql`
  - Contiene todas las tablas necesarias
  - Datos de ejemplo para "Nuestra Señora del Pilar"
  - Stored Procedure `sp_GetInstitucionPageData` para obtener todos los datos

### Documentación:
- **JSON Ejemplo**: `ESTRUCTURA_BD_COLEGIO.json`
  - Muestra la estructura exacta del objeto que debe devolver tu API

## 🚀 Cómo Implementar

### Paso 1: Crear las Tablas en SQL Server
```sql
-- Ejecutar el script ESTRUCTURA_BD_COLEGIO.sql
```

### Paso 2: Crear el Endpoint en tu API
Tu API debe tener un endpoint como:
```
GET /api/instituciones/{slug}/page-data
```

Ejemplo: `GET /api/instituciones/pilar/page-data`

### Paso 3: El Stored Procedure ya está listo
```sql
EXEC sp_GetInstitucionPageData 'pilar'
```

Este SP devuelve 5 resultsets que tu API debe combinar en un solo JSON.

### Paso 4: Modificar el Componente Angular

En `pilar.ts`, descomenta y completa el método `loadPageData()`:

```typescript
ngOnInit() {
    this.loadPageData();
}

loadPageData() {
    // Obtener el slug de la ruta (ej: 'pilar')
    const slug = 'pilar'; // O desde ActivatedRoute
    
    this.http.get<SchoolPageData>(`${API_URL}/instituciones/${slug}/page-data`)
        .subscribe({
            next: (data) => {
                this.pageData = data;
                // Convertir URLs de videos
                this.pageData.videos = this.pageData.videos.map(video => ({
                    ...video,
                    url: this.convertToEmbedUrl(video.url)
                }));
            },
            error: (err) => console.error('Error cargando datos:', err)
        });
}
```

## 📊 Formato de Respuesta de la API

Tu API debe devolver un JSON con esta estructura:

```json
{
  "hero": {
    "imageUrl": "https://...",
    "title": "Colegio...",
    "subtitle": "...",
    "admissionYear": "2026",
    "buttons": {
      "primary": "Solicitar Información",
      "secondary": "Ver Video"
    }
  },
  "stats": [
    { "label": "Años de Experiencia", "value": "25+" }
  ],
  "educationalLevels": [
    {
      "id": "inicial",
      "title": "Educación Inicial",
      "description": "...",
      "imageUrl": "https://...",
      "features": ["Feature 1", "Feature 2"]
    }
  ],
  "videos": [
    {
      "title": "Video 1",
      "url": "https://youtube.com/watch?v=...",
      "description": "..."
    }
  ],
  "callToAction": {
    "title": "...",
    "description": "...",
    "buttonText": "..."
  }
}
```

## 🎥 URLs de YouTube - Formatos Aceptados

El sistema acepta **cualquier formato** de URL de YouTube:

✅ `https://www.youtube.com/watch?v=ABC123`
✅ `https://www.youtube.com/watch?v=ABC123&list=...`
✅ `https://youtu.be/ABC123`
✅ `https://www.youtube.com/embed/ABC123`

Todos se convierten automáticamente al formato embed correcto.

## 🔐 Ventajas del Sistema

1. **100% Dinámico** - No necesitas tocar código para crear nuevas páginas
2. **Reutilizable** - Misma estructura para todos los colegios
3. **Escalable** - Agrega tantos colegios como quieras
4. **Fácil de mantener** - Todo desde la base de datos
5. **SEO Friendly** - URLs amigables con slug único

## 📝 Ejemplo de Uso

Para crear un nuevo colegio "San José":

1. Insertar en `Instituciones` con slug `'san-jose'`
2. Llenar todas las tablas relacionadas
3. La página estará disponible en `/san-jose`
4. ¡Listo! No se necesita código adicional

## 🎨 Personalización

Si necesitas cambiar el diseño:
- Modifica `pilar.html` (el template)
- Modifica `pilar.css` (los estilos)
- Los cambios aplicarán a **todas** las instituciones

## 🤝 Soporte

Para agregar nuevos campos:
1. Actualiza la interface `SchoolPageData`
2. Agrega las columnas en SQL
3. Actualiza el template HTML
4. Actualiza el SP para incluir los nuevos campos

---

**Creado por**: Sistema de Páginas Dinámicas
**Fecha**: Enero 2026
**Versión**: 1.0
