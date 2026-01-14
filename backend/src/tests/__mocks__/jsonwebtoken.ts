// Mock de jsonwebtoken para tests unitarios
const jwt = jest.genMockFromModule('jsonwebtoken') as any;

jwt.sign = jest.fn((payload: any, secret: string) => {
    return `mock_token_${payload.id}`;
});

jwt.verify = jest.fn((token: string, secret: string) => {
    // Extrae el id del token mock
    const match = token.match(/mock_token_(.+)/);
    if (match) {
        return { id: match[1] };
    }
    throw new Error('Invalid token');
});

export default jwt;

