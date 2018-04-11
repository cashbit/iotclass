var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){

  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('gameStart', function(msg){
    console.log('gameStart: ' + msg);
  });

  socket.on('gameStop', function(msg){
    console.log('gameStop: ' + msg);
  });
  
});

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});