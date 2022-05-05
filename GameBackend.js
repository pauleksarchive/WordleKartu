const fs = require('fs');
const path = require('path');
const { GameStatus } = require('./lib/Constants');
let wordBank = [];
const WordleAlgo = require('./lib/WordleAlgo');

fs.readFile(path.join(__dirname, 'wordBank', 'lt-LT.txt'), 'utf-8', (err, data) => {
    if (err) return console.error(err);
    
    wordBank = data.split('\n');
});

/**
 * Game handler
 * @param {Object} io - socket server for that room 
 * @param {Map} RunningGames - Map of all running games
 */
module.exports = async (io, RunningGames, gameCode) => {
    const PlayerData = {
        guesses: 0,
        wins: 0
    }
    
    let GameInfoData = {
        status: {
            stage: GameStatus.Intermission,
            until: Date.now() + 30000,
        },
        word: '',
        players: new Map(),
        playerCount: 0,
        playersWhoAnsweredCorrectly: [],
        roomEmpty: false
    }

    let gameStart = () => {}, Intermission = () => {};

    Intermission = async () => {
        if (io.sockets.size == 0 && GameInfoData.roomEmpty == true) {
            console.log(`Shutting down ${gameCode}`);
            RunningGames.delete(gameCode);
            return io.disconnectSockets();
        } 
        console.log(`Intermission ${gameCode}`);

        GameInfoData.status.stage = GameStatus.Intermission;
        GameInfoData.status.until = Date.now() + 10000;
        GameInfoData.status.functionToEmitNext = gameStart;
        GameInfoData.playersWhoAnsweredCorrectly = [];

        io.emit('game end', JSON.stringify({ until: GameInfoData.status.until, answer: GameInfoData.word }));

        setTimeout(() => { gameStart() }, 10000);

        if (io.sockets.size == 0) GameInfoData.roomEmpty = true;
        else GameInfoData.roomEmpty = false;
    }

    gameStart = () => {
        GameInfoData.word = wordBank[Math.floor(Math.random() * wordBank.length)].toLowerCase();
        GameInfoData.status.stage = GameStatus.GameActive;
        GameInfoData.status.until = Date.now() + 30000;
        GameInfoData.status.functionToEmitNext = Intermission;
        GameInfoData.playersWhoAnsweredCorrectly = [];
        GameInfoData.players.forEach((player) => player.guesses = 0);

        console.log(`Gamestart ${gameCode} ${GameInfoData.word}`);

        io.emit('game start', JSON.stringify({ status: GameInfoData.status }));

        setTimeout(() => { Intermission() }, 30000);
    }

    /* CONNECTION HANDLING */
    io.on('connection', (socket) => {
        socket.emit('room update', JSON.stringify({ status: GameInfoData.status }));

        GameInfoData.playerCount++;
        if (!GameInfoData.players.has(socket.id)) GameInfoData.players.set(socket.id, PlayerData);

        socket.on('guess', (data) => {
            if (GameInfoData.status.stage !== GameStatus.GameActive) return;
            if (!/[a-zA-Z]/g.test(data)) return;
            
            let player = GameInfoData.players.get(socket.id);
            if (player.guesses >= 5) return;
            if (data.length != 5) return;
            if (GameInfoData.playersWhoAnsweredCorrectly.includes(socket.id)) return;

            player.guesses++;

            if (data.toLowerCase() == GameInfoData.word) {
                GameInfoData.playersWhoAnsweredCorrectly.push(socket.id);
                player.wins++;
            }

            GameInfoData.players.set(socket.id, player);
            let letters = WordleAlgo(GameInfoData.word.toLowerCase(), data.toLowerCase());
            let dataToSend = { guesses: player.guesses, answeredCorrectly: (GameInfoData.playersWhoAnsweredCorrectly.includes(socket.id) ? true : false), letters }
            socket.emit('answer feedback', JSON.stringify(dataToSend));
        });
        
        socket.on('disconnect', (reason) => {
            GameInfoData.playerCount--;
        });
    });

    Intermission();
}