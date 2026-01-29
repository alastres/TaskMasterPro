# 🚀 Guía de Despliegue - TaskMaster Pro (Versión Gratuita 2024/2025)

Este proyecto está estructurado como un monorepositorio con carpetas separadas para `frontend` y `backend`. 

## 🐘 Base de Datos (Neon.tech - Recomendado)

Como la base de datos de Render es temporal (30 días), usaremos **Neon** para persistencia gratuita ilimitada.

1. **Crear Cuenta**: Ve a [Neon.tech](https://neon.tech/) y crea un proyecto de PostgreSQL.
2. **Obtener URL**: Ya he generado una base de datos para ti. Copia esta "Connection String":
   - **URI**: `postgresql://neondb_owner:npg_pg8qnT5ZsjxW@ep-restless-dew-agjf2iak-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. **Guardar**: La usarás en el siguiente paso.

---

## 🔙 Backend (Render.com)

Render es una excelente alternativa gratuita a Railway para hosting de Node.js.

### Pasos en Render:
1. **Crear Servicio**: Haz clic en **"New +"** > **"Web Service"**.
2. **Conectar GitHub**: Selecciona este repositorio.
3. **Configuración del Servicio**:
   - **Name**: `taskmaster-backend` (o el que prefieras).
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. **Variables de Entorno (Advanced > Add Environment Variable)**:
   - `SKIP_INSTALL_DEPS`: `false` (Para asegurar que instale devDependencies)
   - `DATABASE_URL`: (La URL que copiaste de Neon)
   - `JWT_SECRET`: Una cadena larga y aleatoria (ej: `mi_clave_secreta_super_segura_123`).
   - `NODE_ENV`: `production`

> [!NOTE]
> Las instancias gratuitas de Render se "duermen" tras 15 min de inactividad. El primer acceso después de esto puede tardar ~40 segundos.

---

## 🎨 Frontend (Vercel)

Vercel es ideal para aplicaciones React/Vite.

### Pasos en Vercel:
1. **Importar Proyecto**: En el Dashboard de Vercel, haz clic en **"Add New"** > **"Project"**.
2. **Seleccionar Repo**: Elige este repositorio de GitHub.
3. **Configurar Directorio**:
   - En **"Root Directory"**, selecciona la carpeta `frontend`.
4. **Variables de Entorno**:
   - Añade en la sección **Environment Variables**:
     - `VITE_API_URL`: La URL que te generó Render para el backend, añadiendo `/api` al final.
       - *Ejemplo:* `https://taskmaster-backend.onrender.com/api`
5. **Desplegar**: Haz clic en **"Deploy"**.

---

## 🛠️ Comandos Útiles post-despliegue
Si necesitas sincronizar la base de datos de Neon con tu esquema actual, puedes correr localmente (apuntando la `DATABASE_URL` de tu `.env` a la de Neon temporalmente):
```bash
npx prisma migrate deploy
```
O simplemente deja que Prisma maneje el auto-generado durante el build de Render.

---

## ⚡ Backend en Vercel (Serverless)

Si prefieres desplegar el backend en Vercel, hemos adaptado la arquitectura para funcionar en entorno Serverless.

### Requisitos Previos
1. **Cloudinary**: Regístrate en [cloudinary.com](https://cloudinary.com) (gratis). Ve al Dashboard y copia: `Cloud Name`, `API Key`, `API Secret`.
2. **Neon**: (Igual que arriba) Instancia de PostgreSQL.

### Pasos en Vercel:
1. **Importar Proyecto**: Selecciona el repo y la carpeta `backend` como Root Directory.
2. **Variables de Entorno**:
   - `DATABASE_URL`: Tu conexión de Neon.
   - `JWT_SECRET`: Tu clave secreta.
   - `CLOUDINARY_CLOUD_NAME`: Nombre de tu cloud.
   - `CLOUDINARY_API_KEY`: Tu API Key.
   - `CLOUDINARY_API_SECRET`: Tu API Secret.
   - `CRON_SECRET`: Una cadena aleatoria segura (para proteger los cron jobs).
   - `CRON_CONFIG`: `{"enabled": true}` (Opcional, para coherencia).
3. **Cron Jobs**:
   - Vercel detectará automáticamente el archivo `vercel.json` y programará la tarea de limpieza para ejecutarse diariamente.
   - Puedes ver los logs en el dashboard de Vercel bajo la pestaña "Cron Jobs".
