const WebSocket = require('ws');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ws = new WebSocket('ws://localhost:5050'); //connect to the websocket server
// const ws = new WebSocket('wss://websocket-server-x2bm.onrender.com'); //wss is for online

ws.on('open', () => {
    console.log('Connected to the WebSocket server'); //connection open
    promptForMessage();
});

ws.on('message', (message) => {
    console.log(`Server: ${message}`); //listen for messages from the server
});

ws.on('error', (error) => {
    console.log('WebSocket error:', error); //handle errors
});

ws.on('close', () => {
    console.log('Disconnected from the server');
    process.exit(0);
});

function promptForMessage() {
    rl.question('Enter a message (or "exit" to quit): ' , (message) => {
        if (message.toLowerCase() === 'exit'){
           ws.close();
           rl.close();
           return;
        }
        ws.send(message);
        promptForMessage();
})
}