// Mock de bcryptjs para tests unitarios
const bcrypt = {
    hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
    compare: jest.fn((password: string, hash: string) => {
        // Simula comparación: si el hash empieza con 'hashed_' y contiene la password, es válido
        return Promise.resolve(hash === `hashed_${password}`);
    }),
};

export default bcrypt;

