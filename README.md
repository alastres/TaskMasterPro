# TaskMaster Pro · Gestor de Tareas Fullstack

Una aplicación profesional de gestión de tareas full-stack construida para demostrar habilidades de nivel senior con React, Node.js y TypeScript.

## 🚀 Características

- **Tablero Kanban**: Visualización intuitiva de tareas con funcionalidad de arrastrar y soltar (Drag & Drop).
- **Internacionalización (i18n)**: Soporte completo para español e inglés, con detección automática de idioma.
- **Gestión de Proyectos**: Organiza tus tareas en diferentes proyectos para un mejor seguimiento.
- **Gestión de Equipos**: Colabora con otros usuarios dentro de proyectos específicos.
- **Sistema de Notificaciones**: Mantente al día con las actualizaciones de tus tareas y menciones.
- **Autenticación Segura**: Inicio de sesión y registro basados en JWT con protección de rutas.
- **Búsqueda y Filtrado**: Localiza tareas rápidamente por título, estado o prioridad.
- **Gestión de Archivos**: Sube y adjunta archivos relevantes a tus tareas.
- **Diseño Premium**: Interfaz moderna, responsiva y con animaciones fluidas (Framer Motion).

## 🛠 Pila Tecnológica

### Frontend
- **Core**: React 18 + Vite + TypeScript
- **Estado**: Zustand (gestión ligera y eficiente)
- **Datos**: TanStack Query (React Query) para sincronización con el servidor
- **UI/UX**: TailwindCSS + Radix UI (componentes accesibles)
- **Animaciones**: Framer Motion
- **Internacionalización**: i18next
- **Drag & Drop**: @hello-pangea/dnd

### Backend
- **Core**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Seguridad**: JWT (Autenticación), Bcryptjs (Hash de contraseñas), Helmet & Cors
- **Validación**: Zod (esquemas de validación en tiempo real)
- **Logs**: Morgan

## 📂 Arquitectura del Proyecto

```
TaskMasterPro/
├── backend/            # Servidor Express + Prisma
│   ├── src/
│   │   ├── config/     # Configuraciones (BD, etc.)
│   │   ├── controllers/# Lógica de manejo de peticiones
│   │   ├── routes/     # Definición de puntos finales
│   │   ├── services/   # Lógica de negocio reusable
│   │   ├── middlewares/# Seguridad y manejo de errores
│   │   └── utils/      # Funciones de utilidad (JWT, Helpers)
│   └── prisma/         # Esquema y migraciones de la base de datos
│
└── frontend/           # Cliente React + Vite
    ├── src/
    │   ├── api/        # Configuración de Axios y hooks de TanStack Query
    │   ├── components/ # Componentes de UI y lógica visual
    │   ├── i18n/       # Configuración y traducciones (es/en)
    │   ├── store/      # Estado global con Zustand
    │   └── pages/      # Vistas principales de la aplicación
```

## ⚙️ Instalación y Configuración Local

### Prerrequisitos
- **Node.js**: v18 o superior
- **PostgreSQL**: Instancia local o remota corriendo

### 1. Clonar y Preparar el Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# IMPORTANTE: Configura tu DATABASE_URL (ej: postgresql://user:password@localhost:5432/taskmaster) 
# y genera un JWT_SECRET robusto.

# Sincronizar la base de datos con Prisma
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Preparar el Frontend

```bash
cd ../frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Verifica que VITE_API_URL apunte correctamente al backend (ej: http://localhost:3000/api)
```

### 3. Ejecutar la Aplicación

Debes iniciar ambos servicios:

- **Backend**: `npm run dev` (corre usualmente en el puerto 3000)
- **Frontend**: `npm run dev` (corre usualmente en el puerto 5173)

### 4. Ejecutar Pruebas (Backend)

Para verificar el correcto funcionamiento del backend y la seguridad de la API:

```bash
cd backend
# Ejecutar todas las pruebas (unitarias e integración)
npm test

# Ejecutar pruebas en modo secuencial (recomendado para evitar conflictos de BD)
npx jest --runInBand
```

## 📝 Referencia de la API (Endpoints principales)

- **Autenticación**: `POST /api/auth/register`, `POST /api/auth/login`
- **Usuarios**: `GET /api/users/profile`, `PATCH /api/users/profile`
- **Tareas**: CRUD completo en `/api/tasks` (soporta filtros por query params)
- **Proyectos**: Gestión en `/api/projects`
- **Equipos**: Colaboración en `/api/teams`
- **Notificaciones**: `/api/notifications`

## 🧹 Mantenimiento y Optimización

El proyecto incluye un sistema automatizado de limpieza y optimización:

### Tareas Programadas (Cron Jobs)
Se ejecutan diariamente a la medianoche (`00:00`) para limpiar:
- Invitaciones pendientes con más de 7 días de antigüedad.
- Notificaciones leídas con más de 30 días de antigüedad.
- Archivos de avatar huérfanos (no referenciados en la base de datos).

### Scripts Manuales
Puedes ejecutar la limpieza de archivos huérfanos manualmente si es necesario:

```bash
cd backend
npm run cleanup:orphaned
```

## 🚀 Despliegue

El proyecto está preparado para ser desplegado en:
- **Backend**: Railway (soporta Docker y Nixpacks)
- **Frontend**: Vercel o Netlify (optimizado para frameworks de Vite)
