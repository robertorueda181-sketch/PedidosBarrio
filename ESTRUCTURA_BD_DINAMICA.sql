-- =============================================
-- SISTEMA DE PÁGINAS DINÁMICAS AVANZADO
-- Con soporte para temas personalizados y secciones flexibles
-- =============================================

-- Tabla principal de páginas
CREATE TABLE PaginasDinamicas (
    PaginaID INT PRIMARY KEY IDENTITY(1,1),
    Slug NVARCHAR(100) UNIQUE NOT NULL,
    Titulo NVARCHAR(200) NOT NULL,
    MetaDescripcion NVARCHAR(500),
    MetaKeywords NVARCHAR(MAX), -- JSON array
    Activa BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME DEFAULT GETDATE()
);

-- Configuración de tema/branding
CREATE TABLE PaginaTema (
    TemaID INT PRIMARY KEY IDENTITY(1,1),
    PaginaID INT FOREIGN KEY REFERENCES PaginasDinamicas(PaginaID) ON DELETE CASCADE,
    -- Colores
    ColorPrimario NVARCHAR(20) DEFAULT '#1A365D',
    ColorSecundario NVARCHAR(20) DEFAULT '#2C5282',
    ColorAcento NVARCHAR(20) DEFAULT '#3182CE',
    ColorFondo NVARCHAR(20) DEFAULT '#F7FAFC',
    ColorTexto NVARCHAR(20) DEFAULT '#1A202C',
    ColorTextoClaro NVARCHAR(20) DEFAULT '#718096',
    -- Tipografía
    FuenteTitulos NVARCHAR(100) DEFAULT 'Outfit',
    FuenteTexto NVARCHAR(100) DEFAULT 'Inter',
    -- Bordes
    RadioBordes NVARCHAR(20) DEFAULT '2rem'
);

-- Secciones dinámicas
CREATE TABLE PaginaSecciones (
    SeccionID INT PRIMARY KEY IDENTITY(1,1),
    PaginaID INT FOREIGN KEY REFERENCES PaginasDinamicas(PaginaID) ON DELETE CASCADE,
    SeccionIdentificador NVARCHAR(50) NOT NULL, -- ej: "hero-1", "stats-1"
    TipoSeccion NVARCHAR(50) NOT NULL, -- 'hero', 'stats', 'text-image', etc.
    Orden INT DEFAULT 0,
    Visible BIT DEFAULT 1,
    ColorFondo NVARCHAR(20),
    PaddingTop NVARCHAR(20),
    PaddingBottom NVARCHAR(20),
    ClasePersonalizada NVARCHAR(200),
    DatosJSON NVARCHAR(MAX) NOT NULL -- Datos específicos de cada tipo de sección
);

-- Índices para mejor rendimiento
CREATE INDEX IX_PaginaSecciones_PaginaID_Orden ON PaginaSecciones(PaginaID, Orden);
CREATE INDEX IX_PaginaSecciones_Visible ON PaginaSecciones(Visible);

-- =============================================
-- STORED PROCEDURE PARA OBTENER PÁGINA COMPLETA
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetPaginaDinamica
    @Slug NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PaginaID INT;
    
    -- Obtener ID de la página
    SELECT @PaginaID = PaginaID 
    FROM PaginasDinamicas 
    WHERE Slug = @Slug AND Activa = 1;
    
    IF @PaginaID IS NULL
    BEGIN
        RAISERROR('Página no encontrada', 16, 1);
        RETURN;
    END
    
    -- Información de la página
    SELECT 
        Slug as slug,
        Titulo as title,
        MetaDescripcion as metaDescription,
        MetaKeywords as metaKeywords
    FROM PaginasDinamicas
    WHERE PaginaID = @PaginaID;
    
    -- Tema
    SELECT 
        JSON_QUERY((
            SELECT 
                ColorPrimario as primary,
                ColorSecundario as secondary,
                ColorAcento as accent,
                ColorFondo as background,
                ColorTexto as text,
                ColorTextoClaro as textLight
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) as colors,
        JSON_QUERY((
            SELECT 
                FuenteTitulos as heading,
                FuenteTexto as body
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) as fonts,
        RadioBordes as borderRadius
    FROM PaginaTema
    WHERE PaginaID = @PaginaID;
    
    -- Secciones (ordenadas)
    SELECT 
        SeccionIdentificador as id,
        TipoSeccion as type,
        Orden as [order],
        Visible as visible,
        ColorFondo as backgroundColor,
        JSON_QUERY((
            SELECT 
                PaddingTop as top,
                PaddingBottom as bottom
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) as padding,
        ClasePersonalizada as customClass,
        JSON_QUERY(DatosJSON) as data
    FROM PaginaSecciones
    WHERE PaginaID = @PaginaID AND Visible = 1
    ORDER BY Orden;
END;
GO

-- =============================================
-- EJEMPLO DE DATOS PARA "NUESTRA SEÑORA DEL PILAR"
-- =============================================

-- Insertar página
INSERT INTO PaginasDinamicas (Slug, Titulo, MetaDescripcion, MetaKeywords)
VALUES (
    'pilar',
    'Colegio Nuestra Señora del Pilar',
    'Institución educativa de excelencia con más de 25 años formando líderes',
    '["colegio","educación","pilar","inicial","primaria","secundaria"]'
);

DECLARE @PaginaID INT = SCOPE_IDENTITY();

-- Insertar tema
INSERT INTO PaginaTema (PaginaID, ColorPrimario, ColorSecundario, ColorAcento, ColorFondo, ColorTexto, ColorTextoClaro, FuenteTitulos, FuenteTexto, RadioBordes)
VALUES (@PaginaID, '#1A365D', '#2C5282', '#3182CE', '#F7FAFC', '#1A202C', '#718096', 'Outfit', 'Inter', '2rem');

-- Sección Hero
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'hero-1', 'hero', 1, 1, 'transparent', '0', '0', N'{
    "imageUrl": "assets/pilar_hero.png",
    "title": "Colegio Nuestra Señora del Pilar",
    "subtitle": "Formando líderes con valores y excelencia académica desde 1999",
    "badge": {
        "text": "Admisiones 2026",
        "color": "#3182CE"
    },
    "buttons": [
        {
            "text": "Solicitar Información",
            "style": "primary",
            "action": "/contacto"
        },
        {
            "text": "Ver Video Institucional",
            "style": "outline"
        }
    ],
    "height": "80vh",
    "overlay": {
        "enabled": true,
        "color": "#1A365D",
        "opacity": 0.7
    }
}');

-- Sección Stats
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'stats-1', 'stats', 2, 1, 'transparent', '0', '4rem', N'{
    "stats": [
        {"label": "Años de Experiencia", "value": "25+", "icon": "pi-calendar"},
        {"label": "Docentes Calificados", "value": "50+", "icon": "pi-users"},
        {"label": "Estudiantes Felices", "value": "800+", "icon": "pi-heart"},
        {"label": "Talleres Extracurriculares", "value": "12", "icon": "pi-star"}
    ],
    "columns": 4,
    "style": "cards"
}');

-- Sección Text-Image (Inicial)
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'text-image-1', 'text-image', 3, 1, '#FFFFFF', '5rem', '5rem', N'{
    "title": "Educación Inicial",
    "description": "Un espacio lleno de color y alegría donde los más pequeños descubren el mundo a través del juego y la exploración.",
    "imageUrl": "assets/pilar_inicial.png",
    "imagePosition": "right",
    "features": [
        "Ambientes seguros y estimulantes",
        "Aprendizaje lúdico y creativo",
        "Docentes especializadas en primera infancia"
    ],
    "button": {
        "text": "Conocer más",
        "action": "/inicial"
    }
}');

-- Sección Features
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'features-1', 'features', 6, 1, '#F7FAFC', '5rem', '5rem', N'{
    "title": "¿Por qué elegirnos?",
    "description": "Nuestro compromiso con la excelencia educativa",
    "features": [
        {
            "icon": "pi-shield",
            "title": "Seguridad Integral",
            "description": "Protocolos de seguridad y cuidado permanente"
        },
        {
            "icon": "pi-globe",
            "title": "Educación Bilingüe",
            "description": "Inglés intensivo desde inicial"
        },
        {
            "icon": "pi-desktop",
            "title": "Tecnología Educativa",
            "description": "Aulas digitales y plataformas modernas"
        }
    ],
    "columns": 3,
    "style": "cards"
}');

-- Sección Video Gallery
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'video-gallery-1', 'video-gallery', 7, 1, '#FFFFFF', '5rem', '5rem', N'{
    "title": "Vive Nuestra Pasión por la Educación",
    "description": "Explora más sobre nuestro día a día, eventos y la metodología que nos hace únicos",
    "videos": [
        {
            "title": "Nuestra Propuesta Educativa",
            "url": "https://www.youtube.com/watch?v=7Ufr_RHsHhI",
            "description": "Conoce más sobre nuestro método de enseñanza y valores"
        },
        {
            "title": "Vida Estudiantil",
            "url": "https://www.youtube.com/watch?v=KAxh9D1JWwg",
            "description": "Un recorrido por las actividades y talleres de nuestros alumnos"
        }
    ],
    "columns": 2
}');

-- Sección CTA
INSERT INTO PaginaSecciones (PaginaID, SeccionIdentificador, TipoSeccion, Orden, Visible, ColorFondo, PaddingTop, PaddingBottom, DatosJSON)
VALUES (@PaginaID, 'cta-1', 'cta', 9, 1, '#1A365D', '5rem', '5rem', N'{
    "title": "¿Listo para formar parte de la Familia Pilarina?",
    "description": "Las inscripciones para el año escolar 2026 ya están abiertas. Cupos limitados.",
    "button": {
        "text": "Empieza tu Proceso de Admisión",
        "action": "/admision"
    },
    "style": "centered"
}');

-- =============================================
-- PROCEDIMIENTO PARA AGREGAR NUEVA SECCIÓN
-- =============================================

CREATE OR ALTER PROCEDURE sp_AgregarSeccion
    @PaginaID INT,
    @SeccionIdentificador NVARCHAR(50),
    @TipoSeccion NVARCHAR(50),
    @Orden INT,
    @DatosJSON NVARCHAR(MAX),
    @ColorFondo NVARCHAR(20) = NULL,
    @PaddingTop NVARCHAR(20) = '3rem',
    @PaddingBottom NVARCHAR(20) = '3rem'
AS
BEGIN
    INSERT INTO PaginaSecciones (
        PaginaID, SeccionIdentificador, TipoSeccion, Orden, 
        ColorFondo, PaddingTop, PaddingBottom, DatosJSON
    )
    VALUES (
        @PaginaID, @SeccionIdentificador, @TipoSeccion, @Orden,
        @ColorFondo, @PaddingTop, @PaddingBottom, @DatosJSON
    );
    
    SELECT SCOPE_IDENTITY() AS NuevaSeccionID;
END;
GO

-- =============================================
-- EJEMPLO DE USO
-- =============================================
-- EXEC sp_GetPaginaDinamica 'pilar';
