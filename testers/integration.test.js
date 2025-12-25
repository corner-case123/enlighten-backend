// Integration Test Suite
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

describe('Integration Tests', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/test');
        await User.deleteMany({});
        await Profile.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('Complete user registration flow', async () => {
        const userData = {
            name: 'Integration Test User',
            email: 'integration@test.com',
            password: 'password123'
        };

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(userData);
        
        expect(registerResponse.statusCode).toBe(201);
        expect(registerResponse.body).toHaveProperty('user');
        expect(registerResponse.body.user.email).toBe(userData.email);
        userId = registerResponse.body.user.id;
    });

    test('Complete user login flow', async () => {
        const loginData = {
            email: 'integration@test.com',
            password: 'password123'
        };

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(loginData);
        
        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body).toHaveProperty('token');
        authToken = loginResponse.body.token;
    });

    test('Complete profile creation flow', async () => {
        const profileData = {
            bio: 'Test bio for integration testing',
            location: 'Test City, Test Country',
            interests: ['coding', 'testing', 'automation'],
            age: 25
        };

        const response = await request(app)
            .post('/api/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send(profileData);
        
        expect(response.statusCode).toBe(201);
        expect(response.body.bio).toBe(profileData.bio);
        expect(response.body.interests).toEqual(profileData.interests);
    });

    test('Complete profile update flow', async () => {
        const updatedData = {
            bio: 'Updated bio for testing',
            location: 'New City'
        };

        const response = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatedData);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.bio).toBe(updatedData.bio);
    });

    test('Complete chat flow', async () => {
        const chatData = {
            recipientId: 'test-recipient-id',
            message: 'Hello from integration test!'
        };

        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${authToken}`)
            .send(chatData);
        
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(chatData.message);
    });

    test('Get user profile by ID', async () => {
        const response = await request(app)
            .get(`/api/profile/${userId}`)
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('bio');
    });

    test('Search users flow', async () => {
        const response = await request(app)
            .get('/api/users/search')
            .query({ q: 'integration' })
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('Follow user flow', async () => {
        const response = await request(app)
            .post('/api/users/follow')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetUserId: 'test-target-user' });
        
        expect(response.statusCode).toBe(200);
    });

    test('Get user followers', async () => {
        const response = await request(app)
            .get(`/api/users/${userId}/followers`)
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('Unfollow user flow', async () => {
        const response = await request(app)
            .delete('/api/users/follow')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetUserId: 'test-target-user' });
        
        expect(response.statusCode).toBe(200);
    });

    test('Update user password', async () => {
        const passwordData = {
            currentPassword: 'password123',
            newPassword: 'newpassword456'
        };

        const response = await request(app)
            .put('/api/auth/password')
            .set('Authorization', `Bearer ${authToken}`)
            .send(passwordData);
        
        expect(response.statusCode).toBe(200);
    });

    test('Get chat history', async () => {
        const response = await request(app)
            .get('/api/chat/history')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ recipientId: 'test-recipient-id' });
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('Delete user profile', async () => {
        const response = await request(app)
            .delete('/api/profile')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
    });

    test('Logout flow', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
    });
});
