const fastify = require('fastify')();
const path = require('path');
const fs = require('fs');
const GameBackend = require('./GameBackend');

const RunningGames = new Map();
const ServerLaunched = Date.now();

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
});

fastify.register(require('fastify-socket.io'));

fastify.decorateReply('sendPage', function (filename) {
    const stream = fs.createReadStream(filename);
    this.type('text/html').send(stream);
});

fastify.get('/play', (req, res) => {
    res.sendPage(path.join(__dirname, 'pages', 'zaidimas.html'));
});

fastify.get('/new', (req, res) => {
    let code = (Math.random() + 1).toString(36).substring(2);
    RunningGames.set(code, GameBackend(fastify.io.of(code), RunningGames, code))
    res.redirect(`/play?code=${code}`);
});

fastify.get('/stats', (req, res) => {
    res.send({
        activeGames: RunningGames.size,
        serverOnlineSince: Date()
    })
});

fastify.post('/doesThisGameExist', (req, res) => {
    let code = JSON.parse(req.body)?.code;
    RunningGames.has(code) ? res.status(200).send('') : res.status(404).send('');
});

fastify.get('/', (req, res) => {
    res.sendPage(path.join(__dirname, 'pages', 'index.html'));
});

fastify.listen(process.env.PORT || 6969, '0.0.0.0', (err, address) => {
    if (err) return console.error(err);

    console.log(`Klausomasi ${address}`);
});

fastify.ready((err) => {
    if (err) return console.error(err);
});