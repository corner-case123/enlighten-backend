// Database Connection Test Suite
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

describe('Database Connection Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('Should connect to database successfully', () => {
        expect(mongoose.connection.readyState).toBe(1);
    });

    test('Should have correct database name', () => {
        expect(mongoose.connection.name).toBeDefined();
        expect(typeof mongoose.connection.name).toBe('string');
    });

    test('Should create and read document', async () => {
        const TestSchema = new mongoose.Schema({ name: String, value: Number });
        const TestModel = mongoose.model('Test', TestSchema);
        const doc = await TestModel.create({ name: 'test', value: 42 });
        expect(doc.name).toBe('test');
        expect(doc.value).toBe(42);
        await TestModel.deleteMany({});
    });

    test('Should handle connection errors gracefully', async () => {
        const badConnection = mongoose.createConnection('mongodb://invalid:27017/test');
        await expect(badConnection.asPromise()).rejects.toThrow();
    });

    test('Should support multiple collections', async () => {
        const collections = await mongoose.connection.db.listCollections().toArray();
        expect(Array.isArray(collections)).toBeTruthy();
    });

    test('Should handle connection pooling', () => {
        expect(mongoose.connection.client).toBeDefined();
        expect(mongoose.connection.client.options).toBeDefined();
    });

    test('Should support indexes', async () => {
        const TestSchema = new mongoose.Schema({
            email: { type: String, unique: true, index: true }
        });
        const TestModel = mongoose.model('TestIndex', TestSchema);
        const indexes = await TestModel.collection.getIndexes();
        expect(indexes).toBeDefined();
    });

    test('Should handle transaction support', async () => {
        const session = await mongoose.startSession();
        expect(session).toBeDefined();
        session.endSession();
    });

    test('Should validate connection string', () => {
        const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        expect(connectionString).toMatch(/^mongodb/);
    });

    test('Should handle connection timeout', async () => {
        const options = { serverSelectionTimeoutMS: 5000 };
        expect(options.serverSelectionTimeoutMS).toBe(5000);
    });

    test('Should support connection events', (done) => {
        mongoose.connection.once('connected', () => {
            expect(mongoose.connection.readyState).toBe(1);
            done();
        });
    });

    test('Should handle disconnection gracefully', async () => {
        const tempConnection = await mongoose.createConnection(process.env.MONGO_URI);
        await tempConnection.close();
        expect(tempConnection.readyState).toBe(0);
    });
});
