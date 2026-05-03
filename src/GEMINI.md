🚀 Tecnologías y Enfoque

Este proyecto ha sido desarrollado utilizando Angular 19, aplicando las mejores prácticas actuales del framework:

Uso de Signals para la gestión reactiva del estado.
Nueva sintaxis de control de flujo (@if, @else, @for).
Arquitectura basada en componentes reutilizables.
Integración con Tailwind CSS.
Uso de PrimeNG.
Implementación de autenticación con JWT.
Uso de Guards e Interceptores HTTP.
Enfoque en rendimiento, mantenibilidad y escalabilidad.
⚙️ Requisitos
Node.js (18+)
Angular CLI (v20)
npm install -g @angular/cli
▶️ Ejecución del proyecto
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
npm install
ng serve

Abrir en:
http://localhost:4200

🎨 Estilos y UI
Tailwind CSS

Uso de utilidades para diseño rápido y responsive.

PrimeNG

Componentes avanzados como tablas, modales, formularios y más.

🧠 Uso de Signals
const contador = signal(0);
contador.update(v => v + 1);

✔️ Estado simple → Signals
✔️ Estado complejo → Servicios + Signals

🔀 Control de flujo moderno
@if (isLoggedIn) {
  <dashboard />
} @else {
  <login />
}
🧩 Arquitectura y Componentes

Estructura basada en features:

/features
  /auth
  /alumnos
  /matriculas
/shared
  /components
  /services
  /guards
  /interceptors

✔️ Componentes pequeños y reutilizables
✔️ Separación clara de responsabilidades

⚙️ Configuración (config.json)

Las variables de entorno se manejan mediante config.json.

{
  "apiUrl": "https://api.midominio.com"
}
Reglas:
No hardcodear endpoints.
Cargar al iniciar la app.
Manejar múltiples entornos.
🔐 Autenticación (JWT)

El sistema utiliza autenticación basada en JSON Web Tokens (JWT):

Flujo:
Usuario inicia sesión.
API retorna access_token.
Token se almacena (preferiblemente en memoria o storage seguro).
Se envía en cada request HTTP.
🛡️ Guards

Se utilizan Guards para proteger rutas:

Ejemplo: AuthGuard
canActivate(): boolean {
  return this.authService.isAuthenticated();
}
Tipos usados:
AuthGuard → protege rutas privadas
RoleGuard → valida roles/permisos
🌐 Interceptores HTTP

Se utilizan interceptores para:

1. Agregar token automáticamente
intercept(req, next) {
  const token = this.authService.getToken();

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next.handle(cloned);
}
2. Manejo global de errores
Detectar 401 → redirigir a login
Manejo centralizado de errores
🔑 Manejo de Tokens

Buenas prácticas implementadas:

✔️ Uso de JWT
✔️ Expiración controlada
✔️ Logout limpia almacenamiento
✔️ Evitar guardar tokens sensibles en localStorage si no es necesario
✔️ Posibilidad de implementar refresh tokens
📐 Buenas prácticas
✔️ Lazy Loading
✔️ Reactive Forms
✔️ Tipado fuerte (TypeScript)
✔️ Servicios desacoplados
✔️ Clean Code
✔️ Manejo centralizado de errores
✔️ Uso de Signals para performance
✔️ Interfaces creadas en su carpeta respectiva
🧪 Testing
ng test
📦 Build producción
ng build --configuration production
📌 Notas finales
Basado en recomendaciones del Angular Team.
Arquitectura preparada para sistemas empresariales.
Escalable para módulos como:
Productos
Diseño de pagina
Banners
Editar perfil

Se trata de una web donde las personas pueden crear su pagina web para vender sus productos
Se llama espacio online, por ello, tiene una tematica de espacio estelar con colores sobrios
pero llamativos