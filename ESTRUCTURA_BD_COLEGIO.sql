-- =============================================
-- ESTRUCTURA DE BASE DE DATOS PARA PÁGINAS DE COLEGIOS
-- =============================================

-- Tabla principal del colegio/institución
CREATE TABLE Instituciones (
    InstitucionID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(100) UNIQUE NOT NULL, -- Para la URL: /pilar
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);

-- Tabla para el Hero/Banner principal
CREATE TABLE InstitucionHero (
    HeroID INT PRIMARY KEY IDENTITY(1,1),
    InstitucionID INT FOREIGN KEY REFERENCES Instituciones(InstitucionID),
    ImagenURL NVARCHAR(500),
    Titulo NVARCHAR(200),
    Subtitulo NVARCHAR(500),
    AnioAdmision NVARCHAR(10),
    BotonPrimarioTexto NVARCHAR(100),
    BotonSecundarioTexto NVARCHAR(100)
);

-- Tabla para estadísticas
CREATE TABLE InstitucionEstadisticas (
    EstadisticaID INT PRIMARY KEY IDENTITY(1,1),
    InstitucionID INT FOREIGN KEY REFERENCES Instituciones(InstitucionID),
    Etiqueta NVARCHAR(100),
    Valor NVARCHAR(50),
    Orden INT DEFAULT 0
);

-- Tabla para niveles educativos
CREATE TABLE NivelesEducativos (
    NivelID INT PRIMARY KEY IDENTITY(1,1),
    InstitucionID INT FOREIGN KEY REFERENCES Instituciones(InstitucionID),
    Identificador NVARCHAR(50), -- inicial, primaria, secundaria
    Titulo NVARCHAR(200),
    Descripcion NVARCHAR(MAX),
    ImagenURL NVARCHAR(500),
    Orden INT DEFAULT 0
);

-- Tabla para características de cada nivel
CREATE TABLE NivelCaracteristicas (
    CaracteristicaID INT PRIMARY KEY IDENTITY(1,1),
    NivelID INT FOREIGN KEY REFERENCES NivelesEducativos(NivelID),
    Texto NVARCHAR(200),
    Orden INT DEFAULT 0
);

-- Tabla para videos de YouTube
CREATE TABLE InstitucionVideos (
    VideoID INT PRIMARY KEY IDENTITY(1,1),
    InstitucionID INT FOREIGN KEY REFERENCES Instituciones(InstitucionID),
    Titulo NVARCHAR(200),
    URL NVARCHAR(500), -- Puede ser cualquier formato de YouTube
    Descripcion NVARCHAR(MAX),
    Orden INT DEFAULT 0
);

-- Tabla para Call to Action
CREATE TABLE InstitucionCTA (
    CTAID INT PRIMARY KEY IDENTITY(1,1),
    InstitucionID INT FOREIGN KEY REFERENCES Instituciones(InstitucionID),
    Titulo NVARCHAR(200),
    Descripcion NVARCHAR(500),
    TextoBoton NVARCHAR(100)
);

-- =============================================
-- EJEMPLO DE DATOS PARA "NUESTRA SEÑORA DEL PILAR"
-- =============================================

-- Insertar institución
INSERT INTO Instituciones (Nombre, Slug) 
VALUES ('Colegio Nuestra Señora del Pilar', 'pilar');

DECLARE @InstitucionID INT = SCOPE_IDENTITY();

-- Insertar Hero
INSERT INTO InstitucionHero (InstitucionID, ImagenURL, Titulo, Subtitulo, AnioAdmision, BotonPrimarioTexto, BotonSecundarioTexto)
VALUES (@InstitucionID, 
        'assets/pilar_hero.png', 
        'Colegio Nuestra Señora del Pilar',
        'Formando líderes con valores y excelencia académica desde 1999.',
        '2026',
        'Solicitar Información',
        'Ver Video Institucional');

-- Insertar Estadísticas
INSERT INTO InstitucionEstadisticas (InstitucionID, Etiqueta, Valor, Orden)
VALUES 
    (@InstitucionID, 'Años de Experiencia', '25+', 1),
    (@InstitucionID, 'Docentes Calificados', '50+', 2),
    (@InstitucionID, 'Estudiantes Felices', '800+', 3),
    (@InstitucionID, 'Talleres Extracurriculares', '12', 4);

-- Insertar Niveles Educativos
INSERT INTO NivelesEducativos (InstitucionID, Identificador, Titulo, Descripcion, ImagenURL, Orden)
VALUES 
    (@InstitucionID, 'inicial', 'Educación Inicial', 
     'Un espacio lleno de color y alegría donde los más pequeños descubren el mundo a través del juego y la exploración.',
     'assets/pilar_inicial.png', 1),
    (@InstitucionID, 'primaria', 'Educación Primaria',
     'Fomentamos la curiosidad y el pensamiento crítico, sentando las bases sólidas para un futuro académico exitoso.',
     'assets/pilar_primaria.png', 2),
    (@InstitucionID, 'secundaria', 'Educación Secundaria',
     'Preparamos a nuestros jóvenes para los retos de la vida universitaria y profesional con una formación integral y tecnológica.',
     'assets/pilar_secundaria.png', 3);

-- Obtener IDs de niveles
DECLARE @InicialID INT = (SELECT NivelID FROM NivelesEducativos WHERE InstitucionID = @InstitucionID AND Identificador = 'inicial');
DECLARE @PrimariaID INT = (SELECT NivelID FROM NivelesEducativos WHERE InstitucionID = @InstitucionID AND Identificador = 'primaria');
DECLARE @SecundariaID INT = (SELECT NivelID FROM NivelesEducativos WHERE InstitucionID = @InstitucionID AND Identificador = 'secundaria');

-- Insertar Características de Inicial
INSERT INTO NivelCaracteristicas (NivelID, Texto, Orden)
VALUES 
    (@InicialID, 'Ambientes seguros', 1),
    (@InicialID, 'Aprendizaje lúdico', 2),
    (@InicialID, 'Docentes especializadas', 3);

-- Insertar Características de Primaria
INSERT INTO NivelCaracteristicas (NivelID, Texto, Orden)
VALUES 
    (@PrimariaID, 'Pensamiento lógico', 1),
    (@PrimariaID, 'Plan lector', 2),
    (@PrimariaID, 'Proyectos colaborativos', 3);

-- Insertar Características de Secundaria
INSERT INTO NivelCaracteristicas (NivelID, Texto, Orden)
VALUES 
    (@SecundariaID, 'Orientación vocacional', 1),
    (@SecundariaID, 'Laboratorios modernos', 2),
    (@SecundariaID, 'Inglés intensivo', 3);

-- Insertar Videos
INSERT INTO InstitucionVideos (InstitucionID, Titulo, URL, Descripcion, Orden)
VALUES 
    (@InstitucionID, 'Nuestra Propuesta Educativa', 
     'https://www.youtube.com/watch?v=7Ufr_RHsHhI',
     'Conoce más sobre nuestro método de enseñanza y valores.', 1),
    (@InstitucionID, 'Vida Estudiantil',
     'https://www.youtube.com/watch?v=KAxh9D1JWwg',
     'Un recorrido por las actividades y talleres de nuestros alumnos.', 2);

-- Insertar Call to Action
INSERT INTO InstitucionCTA (InstitucionID, Titulo, Descripcion, TextoBoton)
VALUES (@InstitucionID,
        '¿Listo para formar parte de la Familia Pilarina?',
        'Las inscripciones para el año escolar 2026 ya están abiertas. Cupos limitados.',
        'Empieza tu Proceso de Admisión');

-- =============================================
-- STORED PROCEDURE PARA OBTENER TODOS LOS DATOS
-- =============================================

CREATE PROCEDURE sp_GetInstitucionPageData
    @Slug NVARCHAR(100)
AS
BEGIN
    DECLARE @InstitucionID INT;
    
    -- Obtener ID de la institución
    SELECT @InstitucionID = InstitucionID 
    FROM Instituciones 
    WHERE Slug = @Slug AND Activo = 1;
    
    IF @InstitucionID IS NULL
    BEGIN
        RAISERROR('Institución no encontrada', 16, 1);
        RETURN;
    END
    
    -- Hero
    SELECT 
        ImagenURL as imageUrl,
        Titulo as title,
        Subtitulo as subtitle,
        AnioAdmision as admissionYear,
        BotonPrimarioTexto as primaryButton,
        BotonSecundarioTexto as secondaryButton
    FROM InstitucionHero
    WHERE InstitucionID = @InstitucionID;
    
    -- Estadísticas
    SELECT 
        Etiqueta as label,
        Valor as value
    FROM InstitucionEstadisticas
    WHERE InstitucionID = @InstitucionID
    ORDER BY Orden;
    
    -- Niveles Educativos con sus características
    SELECT 
        n.Identificador as id,
        n.Titulo as title,
        n.Descripcion as description,
        n.ImagenURL as imageUrl,
        (
            SELECT Texto as feature
            FROM NivelCaracteristicas
            WHERE NivelID = n.NivelID
            ORDER BY Orden
            FOR JSON PATH
        ) as features
    FROM NivelesEducativos n
    WHERE n.InstitucionID = @InstitucionID
    ORDER BY n.Orden;
    
    -- Videos
    SELECT 
        Titulo as title,
        URL as url,
        Descripcion as description
    FROM InstitucionVideos
    WHERE InstitucionID = @InstitucionID
    ORDER BY Orden;
    
    -- Call to Action
    SELECT 
        Titulo as title,
        Descripcion as description,
        TextoBoton as buttonText
    FROM InstitucionCTA
    WHERE InstitucionID = @InstitucionID;
END;

-- =============================================
-- EJEMPLO DE USO
-- =============================================
-- EXEC sp_GetInstitucionPageData 'pilar';
