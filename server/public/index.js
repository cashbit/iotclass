console.log("Start");

var socket ;

var audio1 = new Audio('/audio/beep-07.mp3'); 
var audio2 = new Audio('/audio/beep-09.mp3'); 

function load(){
    socket = io();
    socket.on("model",function(msg){
        datamodel.server = msg ;
        updateModel();
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

    document.getElementById("player1-team1").className = "" ;
    document.getElementById("player2-team1").className = "" ;
    document.getElementById("player3-team1").className = "" ;
    document.getElementById("player4-team1").className = "" ;
    document.getElementById("player1-team2").className = "" ;
    document.getElementById("player2-team2").className = "" ;
    document.getElementById("player3-team2").className = "" ;
    document.getElementById("player4-team2").className = "" ;


    Object.keys(data).forEach(function(id){
        //console.log("id",id,data[id]) ;
        var element = document.getElementById(id) ;
        if (element) element.innerHTML = data[id] ;
    });

    var activeplayer = data.activeplayer ;
    if (document.getElementById(activeplayer)) document.getElementById(activeplayer).className = "activeplayer" ;
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

var lastGameStatus ;
var lastSelectedPlayerId ;

function updateModel(){

    if (datamodel.server.gameStarted == true){
        datamodel.gamestatus = "Play" ;
        if (lastGameStatus != datamodel.gamestatus) {
            audio1.play();
        }
    } else {
        datamodel.gamestatus = "Game over" ;
        if (lastGameStatus != datamodel.gamestatus) {
            audio2.play();
        }
    }

    lastGameStatus = datamodel.gamestatus ;

    datamodel.gametime = datamodel.server.gametime ;
    datamodel.playertime = datamodel.server.playertime ;

    datamodel.team1 = datamodel.server.configuration.teams[0].name ;
    datamodel.team2 = datamodel.server.configuration.teams[1].name ;
    
    datamodel.score1 = datamodel.server.configuration.teams[0].score ;
    datamodel.score2 = datamodel.server.configuration.teams[1].score ;

    datamodel.activeplayer = "player"  + (datamodel.server.selectedPlayerId + 1) + 
                             "-team"   + (datamodel.server.teamId + 1) ;

    if (lastSelectedPlayerId != datamodel.server.selectedPlayerId)  {
        audio1.play()
    }    
    
    lastSelectedPlayerId = datamodel.server.selectedPlayerId ;
    
    datamodel["player1-team1"] = datamodel.server.configuration.teams[0].players[0].name ;
    datamodel["player2-team1"] = datamodel.server.configuration.teams[0].players[1].name ;
    datamodel["player3-team1"] = datamodel.server.configuration.teams[0].players[2].name ;
    datamodel["player4-team1"] = datamodel.server.configuration.teams[0].players[3].name ;
    datamodel["player1-team2"] = datamodel.server.configuration.teams[1].players[0].name ;
    datamodel["player2-team2"] = datamodel.server.configuration.teams[1].players[1].name ;
    datamodel["player3-team2"] = datamodel.server.configuration.teams[1].players[2].name ;
    datamodel["player4-team2"] = datamodel.server.configuration.teams[1].players[3].name ;

}