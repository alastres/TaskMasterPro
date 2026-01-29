import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import teamRoutes from './routes/team.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import cronRoutes from './routes/cron.routes';
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
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);

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
