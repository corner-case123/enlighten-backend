// Socket.IO Test Suite
const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');

describe('Socket.IO Tests', () => {
    let ioServer, serverSocket, clientSocket, httpServer;

    beforeAll((done) => {
        httpServer = createServer();
        ioServer = new Server(httpServer);
        httpServer.listen(() => {
            const port = httpServer.address().port;
            clientSocket = io(`http://localhost:${port}`);
            ioServer.on('connection', (socket) => {
                serverSocket = socket;
            });
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        ioServer.close();
        clientSocket.close();
        httpServer.close();
    });

    test('Should emit and receive messages', (done) => {
        clientSocket.on('message', (msg) => {
            expect(msg).toBe('Hello from server');
            done();
        });
        serverSocket.emit('message', 'Hello from server');
    });

    test('Should handle chat messages', (done) => {
        clientSocket.on('chat-message', (data) => {
            expect(data.text).toBe('Test message');
            expect(data.sender).toBeDefined();
            done();
        });
        serverSocket.emit('chat-message', {
            text: 'Test message',
            sender: 'user1'
        });
    });

    test('Should handle user join events', (done) => {
        clientSocket.on('user-joined', (username) => {
            expect(username).toBe('TestUser');
            done();
        });
        serverSocket.emit('user-joined', 'TestUser');
    });

    test('Should handle user disconnect events', (done) => {
        clientSocket.on('user-left', (username) => {
            expect(username).toBe('TestUser');
            done();
        });
        serverSocket.emit('user-left', 'TestUser');
    });

    test('Should broadcast to multiple clients', (done) => {
        const secondClient = io(`http://localhost:${httpServer.address().port}`);
        let receivedCount = 0;
        
        clientSocket.on('broadcast-message', (msg) => {
            expect(msg).toBe('Broadcast');
            receivedCount++;
            if (receivedCount === 2) done();
        });

        secondClient.on('broadcast-message', (msg) => {
            expect(msg).toBe('Broadcast');
            receivedCount++;
            if (receivedCount === 2) done();
        });

        setTimeout(() => {
            ioServer.emit('broadcast-message', 'Broadcast');
        }, 100);
    });

    test('Should handle room joining', (done) => {
        serverSocket.join('test-room');
        clientSocket.on('room-joined', (room) => {
            expect(room).toBe('test-room');
            done();
        });
        serverSocket.emit('room-joined', 'test-room');
    });

    test('Should handle typing indicators', (done) => {
        clientSocket.on('typing', (data) => {
            expect(data.user).toBe('user1');
            expect(data.isTyping).toBe(true);
            done();
        });
        serverSocket.emit('typing', { user: 'user1', isTyping: true });
    });

    test('Should handle connection errors', (done) => {
        const badClient = io('http://localhost:9999', {
            reconnection: false
        });
        badClient.on('connect_error', (error) => {
            expect(error).toBeDefined();
            badClient.close();
            done();
        });
    });

    test('Should validate socket handshake', () => {
        expect(clientSocket.connected).toBeTruthy();
        expect(clientSocket.id).toBeDefined();
    });

    test('Should handle custom events', (done) => {
        clientSocket.on('custom-event', (data) => {
            expect(data.type).toBe('notification');
            expect(data.message).toBe('New notification');
            done();
        });
        serverSocket.emit('custom-event', {
            type: 'notification',
            message: 'New notification'
        });
    });

    test('Should handle acknowledgments', (done) => {
        serverSocket.on('ping', (callback) => {
            callback('pong');
        });
        clientSocket.emit('ping', (response) => {
            expect(response).toBe('pong');
            done();
        });
    });
});
