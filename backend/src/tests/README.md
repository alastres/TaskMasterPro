# Testing Guide

Este directorio contiene todos los tests del backend de TaskMaster Pro.

## Estructura

```
tests/
├── unit/                    # Tests unitarios (sin dependencias externas)
│   ├── services/           # Tests de servicios
│   ├── middlewares/        # Tests de middlewares
│   └── utils/              # Tests de utilidades
├── integration/            # Tests de integración (con base de datos)
│   └── routes/             # Tests de rutas HTTP
├── fixtures/                # Datos de prueba y factories
│   ├── factories.ts        # Factories para crear datos de prueba
│   └── seed.ts             # Funciones para poblar/limpiar BD
├── __mocks__/              # Mocks para dependencias externas
│   ├── prisma.ts           # Mock de Prisma Client
│   ├── bcryptjs.ts         # Mock de bcryptjs
│   └── jsonwebtoken.ts     # Mock de jsonwebtoken
└── setup.ts                # Configuración global de tests
```

## Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Solo tests unitarios
```bash
npm run test:unit
```

### Solo tests de integración
```bash
npm run test:integration
```

### Tests en modo watch
```bash
npm run test:watch
```

### Tests con cobertura
```bash
npm run test:coverage
```

### Tests para CI/CD
```bash
npm run test:ci
```

## Configuración

### Variables de Entorno

Para los tests de integración, asegúrate de tener configurado un archivo `.env.test` en la raíz del backend con:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskmaster_test"
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="1d"
```

**Nota**: Si no existe `.env.test`, los tests usarán las variables de `.env` por defecto. Se recomienda crear una base de datos separada para tests.

### Base de Datos de Prueba

Los tests de integración requieren una base de datos de prueba. Asegúrate de:

1. Tener una base de datos PostgreSQL separada para tests
2. Ejecutar las migraciones de Prisma antes de los tests
3. Los tests limpian la base de datos automáticamente entre ejecuciones

## Escribir Nuevos Tests

### Tests Unitarios

Los tests unitarios deben:
- Usar mocks para todas las dependencias externas
- Ser rápidos (sin I/O)
- Probar lógica de negocio aislada

Ejemplo:
```typescript
import * as service from '../../../services/auth.service';
import { mockPrisma } from '../../__mocks__/prisma';

jest.mock('../../../config/db', () => ({
    __esModule: true,
    default: mockPrisma,
}));

describe('Auth Service', () => {
    it('should register user', async () => {
        // Test implementation
    });
});
```

### Tests de Integración

Los tests de integración deben:
- Usar una base de datos real (de prueba)
- Probar flujos completos de endpoints
- Limpiar datos entre tests

Ejemplo:
```typescript
import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/db';
import { cleanDatabase } from '../../fixtures/seed';

describe('Auth Routes', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('should register user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ /* data */ })
            .expect(201);
    });
});
```

## Factories

Usa las factories para crear datos de prueba consistentes:

```typescript
import { createUserData, createProjectData } from '../fixtures/factories';

const userData = createUserData({ email: 'test@example.com' });
const projectData = createProjectData(userId, { name: 'My Project' });
```

## Cobertura

El proyecto tiene umbrales mínimos de cobertura:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Verifica la cobertura ejecutando:
```bash
npm run test:coverage
```

Los reportes se generan en `coverage/`.

## Mejores Prácticas

1. **Nombres descriptivos**: Usa nombres que describan claramente qué se está probando
2. **Arrange-Act-Assert**: Estructura tus tests en estas tres secciones
3. **Un test, una aserción**: Idealmente, cada test debe verificar una cosa
4. **Tests independientes**: Los tests no deben depender unos de otros
5. **Datos de prueba**: Usa factories para mantener consistencia
6. **Limpieza**: Siempre limpia los datos después de los tests

