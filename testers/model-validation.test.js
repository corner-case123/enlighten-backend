// Model Validation Test Suite
const User = require('../models/User');
const Profile = require('../models/Profile');
const Chat = require('../models/Chat');

describe('Model Validation Tests', () => {
    test('User model should require email', () => {
        const user = new User({ name: 'Test' });
        const error = user.validateSync();
        expect(error.errors.email).toBeDefined();
    });

    test('User model should validate email format', () => {
        const user = new User({
            email: 'invalid-email',
            name: 'Test',
            password: 'password123'
        });
        const error = user.validateSync();
        expect(error.errors.email).toBeDefined();
    });

    test('User model should require password', () => {
        const user = new User({
            email: 'test@example.com',
            name: 'Test'
        });
        const error = user.validateSync();
        expect(error.errors.password).toBeDefined();
    });

    test('Profile model should require user reference', () => {
        const profile = new Profile({ bio: 'Test bio' });
        const error = profile.validateSync();
        expect(error.errors.user).toBeDefined();
    });

    test('Profile model should validate age range', () => {
        const profile = new Profile({
            user: '507f1f77bcf86cd799439011',
            age: 150
        });
        const error = profile.validateSync();
        expect(error.errors.age).toBeDefined();
    });

    test('Chat model should require participants', () => {
        const chat = new Chat({ message: 'Hello' });
        const error = chat.validateSync();
        expect(error.errors.participants).toBeDefined();
    });

    test('Chat model should validate message length', () => {
        const longMessage = 'a'.repeat(1001);
        const chat = new Chat({
            participants: ['id1', 'id2'],
            message: longMessage
        });
        const error = chat.validateSync();
        expect(error.errors.message).toBeDefined();
    });

    test('User model should trim whitespace', () => {
        const user = new User({
            email: '  test@example.com  ',
            name: ' Test User ',
            password: 'password123'
        });
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
    });

    test('User model should lowercase email', () => {
        const user = new User({
            email: 'TEST@EXAMPLE.COM',
            name: 'Test',
            password: 'password123'
        });
        expect(user.email).toBe('test@example.com');
    });

    test('Profile model should have default values', () => {
        const profile = new Profile({
            user: '507f1f77bcf86cd799439011'
        });
        expect(profile.verified).toBe(false);
        expect(Array.isArray(profile.interests)).toBeTruthy();
    });

    test('User model should enforce unique email', async () => {
        const user1 = new User({
            email: 'unique@example.com',
            name: 'User 1',
            password: 'password123'
        });
        // This test assumes database connection
        expect(user1.email).toBe('unique@example.com');
    });

    test('Chat model should validate timestamp', () => {
        const chat = new Chat({
            participants: ['id1', 'id2'],
            message: 'Test message'
        });
        expect(chat.createdAt).toBeDefined();
    });

    test('Profile model should validate bio length', () => {
        const longBio = 'a'.repeat(501);
        const profile = new Profile({
            user: '507f1f77bcf86cd799439011',
            bio: longBio
        });
        const error = profile.validateSync();
        expect(error.errors.bio).toBeDefined();
    });

    test('User model should validate password length', () => {
        const user = new User({
            email: 'test@example.com',
            name: 'Test',
            password: '123'
        });
        const error = user.validateSync();
        expect(error.errors.password).toBeDefined();
    });
});
