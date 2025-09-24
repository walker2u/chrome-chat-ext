const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map();

console.log('WebSocket server started on port 8080');

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.room = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'join':
                const { url, name } = data.payload;
                ws.room = url;

                if (!rooms.has(url)) {
                    rooms.set(url, new Set());
                }

                rooms.get(url).add(ws);

                broadcast(ws.room, {
                    type: 'notification',
                    user: 'System',
                    text: `${name} has joined the chat.`
                }, null);

                break;

            case 'message':
                if (ws.room) {
                    broadcast(ws.room, {
                        type: 'message',
                        user: data.payload.user,
                        text: data.payload.text
                    }, ws);
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws.room && rooms.has(ws.room)) {
            rooms.get(ws.room).delete(ws);

            if (rooms.get(ws.room).size === 0) {
                rooms.delete(ws.room);
                console.log(`Room ${ws.room} is now empty and has been closed.`);
            }
        }
    });
});

function broadcast(roomUrl, message, excludeClient) {
    if (rooms.has(roomUrl)) {
        const clients = rooms.get(roomUrl);
        clients.forEach(client => {
            if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}