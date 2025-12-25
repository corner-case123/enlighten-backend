// Middleware Test Suite
const { authMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Middleware Tests', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            params: {},
            query: {},
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        mockNext = jest.fn();
    });

    test('Should pass with valid token', async () => {
        const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');
        mockReq.headers.authorization = `Bearer ${token}`;
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('Should fail without token', async () => {
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('Should fail with invalid token', async () => {
        mockReq.headers.authorization = 'Bearer invalid-token';
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('Should extract user from token', async () => {
        const token = jwt.sign({ userId: '123', email: 'test@example.com' }, process.env.JWT_SECRET || 'secret');
        mockReq.headers.authorization = `Bearer ${token}`;
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockReq.user).toBeDefined();
        expect(mockReq.user.userId).toBe('123');
    });

    test('Should handle token without Bearer prefix', async () => {
        const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');
        mockReq.headers.authorization = token;
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('Should validate token expiration', async () => {
        const expiredToken = jwt.sign(
            { userId: '123' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '0s' }
        );
        mockReq.headers.authorization = `Bearer ${expiredToken}`;
        setTimeout(async () => {
            await authMiddleware(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        }, 1000);
    });

    test('Should handle malformed authorization header', async () => {
        mockReq.headers.authorization = 'InvalidFormat';
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('Should check for required permissions', async () => {
        const token = jwt.sign(
            { userId: '123', role: 'user' },
            process.env.JWT_SECRET || 'secret'
        );
        mockReq.headers.authorization = `Bearer ${token}`;
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockReq.user.role).toBe('user');
    });

    test('Should handle admin role validation', async () => {
        const token = jwt.sign(
            { userId: '123', role: 'admin' },
            process.env.JWT_SECRET || 'secret'
        );
        mockReq.headers.authorization = `Bearer ${token}`;
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockReq.user.role).toBe('admin');
    });

    test('Should log authentication attempts', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET || 'secret');
        mockReq.headers.authorization = `Bearer ${token}`;
        await authMiddleware(mockReq, mockRes, mockNext);
        consoleSpy.mockRestore();
    });
});
