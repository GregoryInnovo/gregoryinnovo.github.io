const express = require('express');
const app = express();
const http = require('http');

const server = http.createServer(app);

app.set('port', process.env.PORT || 8081);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})


server.listen(app.get('port'), () => {
    console.log(`Listen the port in ${app.get('port')}`)
});

