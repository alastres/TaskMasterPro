import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Servir archivos estáticos (uploads)
// Serve uploads from root/uploads since we created uploads folder at project root level (../../uploads relative to src/middlewares)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint raíz
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to TaskMaster Pro API' });
});

// Manejo de errores
app.use(errorHandler);

export default app;
