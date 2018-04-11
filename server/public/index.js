console.log("Start");

var socket ;

function load(){
    socket = io();
    socket.on("model",function(msg){
        console.log("model",msg) ;
        datamodel.server = msg ;
        updateView(datamodel) ;
    })

    socket.on("warning",function(msg){
        console.log("warning",msg) ;
    })

    updateView(datamodel) ;
}

function gameStart(){
    console.log("gameStart") ;
    socket.emit('gameStart','ciao');
}

function gameStop(){
    console.log("gameStop") ;
    socket.emit('gameStop','ciao');
}

function updateView(data){
    Object.keys(data).forEach(function(id){
        //console.log("id",id,data[id]) ;
        var element = document.getElementById(id) ;
        if (element) element.innerHTML = data[id] ;
    });
    var activeplayer = data.activeplayer ;
    if (document.getElementById(activeplayer)) document.getElementById(activeplayer).className = "activeplayer" ;
}

function toMinuteSeconds(milliseconds){
    var seconds = Math.floor(milliseconds / 1000) ;
    var minutes = Math.floor(seconds / 60) ;
    var onlySixtySeconds = seconds - minutes * 60 ;
    return minutes + " : " + onlySixtySeconds ;
}

function updateTimes(){
    var now = new Date().getTime(); 
    datamodel.elapsedGameSeconds = now - datamodel.gameStartTime ;
    datamodel.gametime = toMinuteSeconds(datamodel.elapsedGameSeconds) ;
    updateView(datamodel) ;
}

var datamodel = {
    "gamestatus" : "wait",
    "gametime": "00:00:00",
    "playertime": "00:00",
    "team1":"Team number 1",
    "team2":"Team number 2",
    "score1": 0,
    "score2": 10,
    "player1-team1":"P 1 1",
    "player2-team1":"P 2 1",
    "player3-team1":"P 3 1",
    "player4-team1":"P 4 1",
    "player1-team2":"P 1 2",
    "player2-team2":"P 2 2",
    "player3-team2":"P 3 2",
    "player4-team2":"P 4 2",
    "activeplayer": "player3-team1",
    "gameStartTime" : 0,
    "elapsedGameSeconds" : 0,
    "playerStartTime" : 0,
    "elapsedPlayerSeconds" : 0
} ;