# TaskMaster Pro · Fullstack Task Manager

A professional full-stack Task Management application built to demonstrate senior-level skills with React, Node.js, and TypeScript.

## 🚀 Features

- **Authentication**: JWT-based secure login and registration.
- **Task Management**: Create, Read, Update, Delete (CRUD) tasks.
- **Filtering & Search**: Real-time search and filtering by status and priority.
- **Dashboard**: Interactive user dashboard with summary views.
- **Responsive Design**: Modern UI built with TailwindCSS, mobile-friendly.
- **Security**: Protected routes, input validation (Zod), password hashing (Bcrypt).

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Styling**: TailwindCSS
- **Routing**: React Router DOM 6
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: JSON Web Tokens (JWT)

## 📂 Architecture

```
TaskMasterPro/
├── backend/            # Express + Prisma Server
│   ├── src/
│   │   ├── config/     # DB Connection
│   │   ├── controllers/# Route Handlers
│   │   ├── middlewares/# Auth & Error Handling
│   │   ├── routes/     # API Routes
│   │   ├── services/   # Business Logic
│   │   └── utils/      # Helpers (JWT)
│   └── prisma/         # Database Schema
│
└── frontend/           # React + Vite Client
    ├── src/
    │   ├── api/        # Axios & API endpoints
    │   ├── components/ # Reusable UI components
    │   ├── hooks/      # Custom Hooks
    │   ├── layouts/    # Page Layouts
    │   ├── pages/      # Route Components
    │   └── store/      # Global State (Zustand)
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 1. Backend Setup

```bash
cd backend
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Initialize Database
npx prisma migrate dev --name init

# Start Server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Setup Environment Variables
cp .env.example .env
# Check VITE_API_URL matches backend (default: http://localhost:3000/api)

# Start Client
npm run dev
```

## 🚀 Deployment

### Backend (Railway)
1. **Push to GitHub**: Push the entire `TaskMasterPro` repository.
2. **Create Project on Railway**: Select "Deploy from GitHub repo".
3. **Configure Root Directory**: Set `Root Directory` to `/backend`.
4. **Environment Variables**:
   - `DATABASE_URL`: (Railway provides a PostgreSQL plugin, use that variable)
   - `JWT_SECRET`: Generate a strong secret.
   - `JWT_EXPIRES_IN`: `1d`
   - `NPM_FLAGS`: `--legacy-peer-deps` (if needed)
5. **Build Command**: `npm run build`
6. **Start Command**: `npm start`

### Frontend (Vercel)
1. **Import Project**: Select the same GitHub repo on Vercel.
2. **Configure Root Directory**: Set `Root Directory` to `frontend`.
3. **Build Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed Railway backend (e.g., `https://backend-production.railway.app/api`)
5. **Deploy**: Click Deploy.

## 📝 API Endpoints

- **POST /api/auth/register**: Create account
- **POST /api/auth/login**: Get JWT token
- **GET /api/tasks**: Get all tasks (supports ?search, ?status, ?priority)
- **POST /api/tasks**: Create task
- **PATCH /api/tasks/:id**: Update task
- **DELETE /api/tasks/:id**: Delete task
