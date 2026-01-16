# 🚀 Guía de Despliegue - TaskMaster Pro

Este proyecto está estructurado como un monorepositorio con carpetas separadas para `frontend` y `backend`. A continuación, se detallan los pasos para desplegar cada parte.

## 🔙 Backend (Railway)

Railway es la plataforma recomendada para el backend debido a su excelente soporte para bases de datos PostgreSQL y procesos Node.js.

### Pasos:
1. **Crear Proyecto**: En Dashboard de Railway, selecciona **"New Project"** > **"Deploy from GitHub repo"**.
2. **Seleccionar Repo**: Elige este repositorio.
3. **Configuración de Carpeta**:
   - Ve a **Settings** > **General** > **Root Directory**.
   - Escribe: `backend`.
4. **Base de Datos**:
   - Haz clic en **"New"** > **"Database"** > **"Add PostgreSQL"**.
   - Railway creará una base de datos. En la pestaña **Variables** del servicio PostgreSQL, encontrarás la `DATABASE_URL`.
5. **Variables de Entorno**:
   - En el servicio del `backend`, añade las siguientes variables en la pestaña **Variables**:
     - `PORT`: `3000`
     - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (o copia la URL directa del servicio Postgres).
     - `JWT_SECRET`: Una cadena larga y aleatoria.
     - `NODE_ENV`: `production`.

---

## 🎨 Frontend (Vercel)

Vercel es ideal para aplicaciones React/Vite.

### Pasos:
1. **Importar Proyecto**: En el Dashboard de Vercel, haz clic en **"Add New"** > **"Project"**.
2. **Seleccionar Repo**: Elige este repositorio de GitHub.
3. **Configurar Directorio**:
   - En la sección **"Root Directory"**, haz clic en "Edit" y selecciona la carpeta `frontend`.
4. **Variables de Entorno**:
   - Despliega la sección **"Environment Variables"** y añade:
     - `VITE_API_URL`: La URL pública que te generó Railway para el backend, terminando en `/api`.
       - *Ejemplo:* `https://backend-production-xyz.up.railway.app/api`
5. **Desplegar**: Haz clic en **"Deploy"**.

---

## 🛠️ Notas importantes
- **CORS**: El backend está configurado para aceptar peticiones. Asegúrate de que la URL del frontend esté permitida si configuraste restricciones específicas de CORS.
- **Generación de Prisma**: El script de construcción del backend ya incluye `prisma generate`, por lo que el cliente se generará automáticamente en el servidor de Railway.
- **Base de Datos**: Después del primer despliegue, es posible que necesites ejecutar las migraciones. Puedes hacerlo desde el sitio de Railway usando la terminal de la consola o configurando un "Deploy Command" que incluya `npx prisma migrate deploy`.
