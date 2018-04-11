var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){

  console.log('a user connected',socket.id);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('gameStart', function(msg){
    console.log('gameStart: ' + msg);
    gameStart();
  });

  socket.on('gameStop', function(msg){
    console.log('gameStop: ' + msg);
    gameStop();
  });
  
});

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


/// GAME

var https = require('https');

var fs = require('fs');

var configurationData   = fs.readFileSync('../config/configuration.json') ;
var configuration       = JSON.parse(configurationData) ;

var access_token = configuration.access_token ;

function errorManager(err){
    if (!err) return ;
    console.log(err) ;
}

function readVariable(deviceId,variableName,callback){
    var start = new Date();
    https.get({
        host: 'api.particle.io',    
        path: '/v1/devices/' + deviceId + '/' + variableName + '?access_token=' + access_token
    }, function(response) {
        
        var body = '';

        response.on('data', function(d) {
            body += d;
        });

        response.on('end', function() {
            try{
                var stop = new Date();
                var deltaT = stop.getTime() - start.getTime();
                var parsed = JSON.parse(body);
                var obj = {
                    datetime: new Date(),
                    deviceId: deviceId,
                    variableName: variableName,
                    result: parsed.result,
                    deltaT : deltaT
                };
                fs.appendFile(configuration.datalogfilename,JSON.stringify(obj)+"\n\r",errorManager) ;
                if (callback) callback(obj) ;
            } catch (e){
                console.log("Error:",e,body) ;
                var errObj = { datetime: new Date(), e: e, body: body} ;
                fs.appendFile(configuration.errorlogfilename,JSON.stringify(errObj),errorManager);
                if (callback) callback(e) ;
            }
        });

    }); 
}

function callFunction(deviceId,functionName,args,callback){

  var options = {
    "method": "POST",
    "hostname": "api.particle.io",
    "port": null,
    "path": "/v1/devices/" + deviceId + "/" + functionName + "?access_token=" + access_token,
    "headers": {
      "content-type": "application/json",
      "cache-control": "no-cache"
    }
  };

  var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
      if (callback) callback(body) ;
    });
  });

  req.write(JSON.stringify({ arg: args.toString() }));
  req.end();
}

function callFunctionIfVariableValueIsDifferent(deviceId,functionName,variableName,value,callback){
    readVariable(deviceId,variableName,function(response){
        if (typeof response.result == "undefinded") {
            if (callback) callback(response) ;
            return ;
        }
        if (response.result.toString() != value.toString()) {
            callFunction(deviceId,functionName,value,callback);
        } else if (callback) callback(response) ;
    });
}

function listenForEvents(eventname,callback){
    var EventSource = require('eventsource');
        var eventSource;
        var particleUrl="https://api.particle.io/v1/devices/events?access_token="+access_token;

        console.log("Preparing eventsource:",particleUrl);
        eventSource = new EventSource(particleUrl);
        
        eventSource.onclose = function(e) {
            console.log("eventsource close:");
            console.log(e);
        };

        eventSource.onopen = function(e) {
            console.log("eventsource open:")
            console.log(e);
        };

        eventSource.onmessage = function(e) {
            console.log("eventsource message:")
            console.log(e);
        };

        eventSource.onerror=function(e) {
            console.log("eventsource error:")
            console.log(e);
            if (e.readyState == EventSource.CLOSED) {
            // Connection was closed.
            }
        };
    
        eventSource.addEventListener(eventname,function(e) {
            //console.log("eventsource EVENT:")
            //console.log(e);
            e.parseddata = JSON.parse(e.data) ;
            callback(e) ;
        });
}

listenForEvents('variableChanged',function(e){
    //console.log(typeof e.parseddata, e.parseddata)
    
    if (!datamodel.gameStarted) return io.emit("warning","NO GAME STARTED") ;

    var deviceId = e.parseddata.coreid ;
    //callFunction(deviceId,"message","setalarm:2");
    if (e.parseddata.data.indexOf("button2") > -1) gameStart() ;
    if (e.parseddata.data.indexOf("button1") > -1) gameStop() ;
    if (e.parseddata.data.indexOf("deltaLight:low") > -1) {
        score();
        printScore();
        choosePlayer();
    }
}) ;

var datamodel = {
    teamId : 0,
    configuration: {
      teams : configuration.teams
    }
} ;

var playerTimeout ;
var gameTimeout ;
var gameInterval ;

function saveGame(){
    var filename = configuration.datalogfilename ;
    fs.writeFile(filename,JSON.stringify(datamodel),errorManager) ;
    io.emit("model",datamodel) ;
}

function loadGame(){
    var filename = configuration.datalogfilename ;
    var gameData = fs.readFileSync(filename) ;
    datamodel = JSON.parse(gameData) ;
    console.log("datamodel",datamodel) ;
}

function gameStart(){
    if (datamodel.gameStarted) return console.log("Game already running....") ;
    console.log("Game started") ;
    datamodel.gameStarted = true ;
    datamodel.teamId = 0 ;
    configuration.teams.forEach(function(team){
        team.score = 0 ;
    });
    datamodel.gameStartTime = new Date().getTime() ;
    gameTimeout = setTimeout(gameStop,configuration.maxTimePerGame) ;
    gameInterval = setInterval(updateTimes,500) ;
    choosePlayer();
    saveGame();
}

function toMinuteSeconds(milliseconds){
    var seconds = Math.floor(milliseconds / 1000) ;
    var minutes = Math.floor(seconds / 60) ;
    var onlySixtySeconds = seconds - minutes * 60 ;
    return minutes + " : " + onlySixtySeconds ;
}

function updateTimes(){
    var now = new Date().getTime(); 

    datamodel.elapsedGameMilliSeconds = now - datamodel.gameStartTime ;
    datamodel.gametime = toMinuteSeconds(datamodel.elapsedGameMilliSeconds) ;

    datamodel.elapsedPlayerMilliSeconds = now - datamodel.playerStartTime ;
    datamodel.playertime = toMinuteSeconds(datamodel.elapsedPlayerMilliSeconds) ;

    saveGame();
}

function gameStop(){
    printScore() ;
    datamodel.teamId = 0 ;
    datamodel.gameStarted = false ;
    clearTimeout(playerTimeout) ;
    clearTimeout(gameTimeout) ;
    clearTimeout(gameInterval) ;
    console.log("Game over !!!!") ;
    saveGame();
}

function chooseTeam(){
    var team = configuration.teams[datamodel.teamId] ;
    datamodel.teamId++ ;
    if (!configuration.teams[datamodel.teamId]) datamodel.teamId = 0 ;
    saveGame();
    return team ;
}

function choosePlayer(){
    var team = chooseTeam() ;
    var totPlayers = team.players.length ;
    var randomNumber = Math.random() ;
    var thisPlayer = Math.floor((randomNumber * totPlayers));

    datamodel.selectedTeam = team ;
    datamodel.selectedPlayer = team.players[thisPlayer] ;
    datamodel.selectedPlayerId = thisPlayer ;
    datamodel.playerStartTime = new Date().getTime() ;

    console.log("choosePlayer",datamodel.selectedTeam.name, datamodel.selectedPlayer.name) ;
    playerTimeout = setTimeout(choosePlayer,configuration.timeout) ;
    saveGame();
}

function score(){
    datamodel.selectedTeam.score = datamodel.selectedTeam.score || 0 ;
    datamodel.selectedTeam.score++ ;

    datamodel.selectedPlayer.score = datamodel.selectedPlayer.score || 0 ;
    datamodel.selectedPlayer.score++ ;

    clearTimeout(playerTimeout) ;
    saveGame();
}

function printScore(){
    configuration.teams.forEach(function(team){
        console.log(team.name,team.score) ;
    })
}