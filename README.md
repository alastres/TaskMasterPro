# TaskMaster Pro · Gestor de Tareas Fullstack

Una aplicación profesional de gestión de tareas full-stack construida para demostrar habilidades de nivel senior con React, Node.js y TypeScript.

## 🚀 Características

- **Autenticación**: Inicio de sesión y registro seguros basados en JWT.
- **Gestión de Tareas**: Crear, Leer, Actualizar, Eliminar (CRUD) tareas.
- **Filtrado y Búsqueda**: Búsqueda y filtrado en tiempo real por estado y prioridad.
- **Panel de Control**: Panel de usuario interactivo con vistas resumidas.
- **Diseño Responsivo**: Interfaz de usuario moderna construida con TailwindCSS, compatible con dispositivos móviles.
- **Seguridad**: Rutas protegidas, validación de entradas (Zod), hash de contraseñas (Bcrypt).

## 🛠 Pila Tecnológica

### Frontend
- **Framework**: React 18 + Vite
- **Lenguaje**: TypeScript
- **Gestión de Estado**: Zustand
- **Obtención de Datos**: React Query (TanStack Query)
- **Estilos**: TailwindCSS
- **Enrutamiento**: React Router DOM 6
- **Formularios**: React Hook Form + Zod

### Backend
- **Entorno de Ejecución**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Validación**: Zod
- **Autenticación**: JSON Web Tokens (JWT)

## 📂 Arquitectura

```
TaskMasterPro/
├── backend/            # Servidor Express + Prisma
│   ├── src/
│   │   ├── config/     # Conexión a BD
│   │   ├── controllers/# Manejadores de Rutas
│   │   ├── middlewares/# Autenticación y Manejo de Errores
│   │   ├── routes/     # Rutas de la API
│   │   ├── services/   # Lógica de Negocio
│   │   └── utils/      # Ayudantes (JWT)
│   └── prisma/         # Esquema de Base de Datos
│
└── frontend/           # Cliente React + Vite
    ├── src/
    │   ├── api/        # Axios y puntos finales de la API
    │   ├── components/ # Componentes de UI reutilizables
    │   ├── hooks/      # Hooks personalizados
    │   ├── layouts/    # Diseños de Página
    │   ├── pages/      # Componentes de Ruta
    │   └── store/      # Estado Global (Zustand)
```

## ⚙️ Instalación y Configuración

### Prerrequisitos
- Node.js (v18+)
- Base de Datos PostgreSQL

### 1. Configuración del Backend

```bash
cd backend
npm install

# Configurar Variables de Entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y JWT_SECRET

# Inicializar Base de Datos
npx prisma migrate dev --name init

# Iniciar Servidor
npm run dev
```

### 2. Configuración del Frontend

```bash
cd frontend
npm install

# Configurar Variables de Entorno
cp .env.example .env
# Verificar que VITE_API_URL coincida con el backend (por defecto: http://localhost:3000/api)

# Iniciar Cliente
npm run dev
```

## 🚀 Despliegue

### Backend (Railway)
1. **Push a GitHub**: Sube todo el repositorio `TaskMasterPro`.
2. **Crear Proyecto en Railway**: Selecciona "Deploy from GitHub repo".
3. **Configurar Directorio Raíz**: Establece `Root Directory` a `/backend`.
4. **Variables de Entorno**:
   - `DATABASE_URL`: (Railway proporciona un plugin de PostgreSQL, usa esa variable)
   - `JWT_SECRET`: Genera un secreto fuerte.
   - `JWT_EXPIRES_IN`: `1d`
   - `NPM_FLAGS`: `--legacy-peer-deps` (si es necesario)
5. **Comando de Construcción**: `npm run build`
6. **Comando de Inicio**: `npm start`

### Frontend (Vercel)
1. **Importar Proyecto**: Selecciona el mismo repositorio de GitHub en Vercel.
2. **Configurar Directorio Raíz**: Establece `Root Directory` a `frontend`.
3. **Ajustes de Construcción**:
   - Preset de Framework: Vite
   - Comando de Construcción: `npm run build`
   - Directorio de Salida: `dist`
4. **Variables de Entorno**:
   - `VITE_API_URL`: La URL de tu backend desplegado en Railway (ej., `https://backend-production.railway.app/api`)
5. **Desplegar**: Haz clic en Deploy.

## 📝 Puntos Finales de la API

- **POST /api/auth/register**: Crear cuenta
- **POST /api/auth/login**: Obtener token JWT
- **GET /api/tasks**: Obtener todas las tareas (soporta ?search, ?status, ?priority)
- **POST /api/tasks**: Crear tarea
- **PATCH /api/tasks/:id**: Actualizar tarea
- **DELETE /api/tasks/:id**: Eliminar tarea
