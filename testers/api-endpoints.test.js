// API Endpoint Test Suite
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('User API Endpoints', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_TEST_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('GET /api/users should return all users', async () => {
        const response = await request(app).get('/api/users');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('POST /api/users should create new user', async () => {
        const newUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        };
        const response = await request(app)
            .post('/api/users')
            .send(newUser);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newUser.name);
    });

    test('GET /api/users/:id should return single user', async () => {
        const response = await request(app).get('/api/users/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('email');
    });

    test('PUT /api/users/:id should update user', async () => {
        const updatedUser = { name: 'Updated Name' };
        const response = await request(app)
            .put('/api/users/1')
            .send(updatedUser);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(updatedUser.name);
    });

    test('DELETE /api/users/:id should delete user', async () => {
        const response = await request(app).delete('/api/users/1');
        expect(response.statusCode).toBe(204);
    });

    test('GET /api/users with query parameters', async () => {
        const response = await request(app)
            .get('/api/users')
            .query({ limit: 10, page: 1 });
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeLessThanOrEqual(10);
    });

    test('POST /api/users with invalid data should fail', async () => {
        const invalidUser = { name: 'Test' };
        const response = await request(app)
            .post('/api/users')
            .send(invalidUser);
        expect(response.statusCode).toBe(400);
    });

    test('GET /api/users/:id with invalid id should return 404', async () => {
        const response = await request(app).get('/api/users/invalid-id');
        expect(response.statusCode).toBe(404);
    });

    test('PUT /api/users/:id without authentication should fail', async () => {
        const response = await request(app)
            .put('/api/users/1')
            .send({ name: 'Hacker' });
        expect(response.statusCode).toBe(401);
    });

    test('PATCH /api/users/:id should partially update user', async () => {
        const partialUpdate = { email: 'newemail@example.com' };
        const response = await request(app)
            .patch('/api/users/1')
            .send(partialUpdate);
        expect(response.statusCode).toBe(200);
    });

    test('GET /api/users/:id/profile should return user profile', async () => {
        const response = await request(app).get('/api/users/1/profile');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('bio');
    });

    test('POST /api/users/:id/follow should follow user', async () => {
        const response = await request(app)
            .post('/api/users/1/follow')
            .send({ followerId: '2' });
        expect(response.statusCode).toBe(200);
    });

    test('GET /api/users/:id/followers should return followers list', async () => {
        const response = await request(app).get('/api/users/1/followers');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('DELETE /api/users/:id/follow should unfollow user', async () => {
        const response = await request(app)
            .delete('/api/users/1/follow')
            .send({ followerId: '2' });
        expect(response.statusCode).toBe(200);
    });

    test('GET /api/users/search should search users', async () => {
        const response = await request(app)
            .get('/api/users/search')
            .query({ q: 'test' });
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
});
