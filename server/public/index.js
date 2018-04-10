console.log("Start");

function gameStart(){
    console.log("gameStart") ;
    datamodel.gamestatus  = "Started" ;
    updateView(datamodel) ;
}

function gameStop(){
    console.log("gameStop") ;
    datamodel.gamestatus  = "Stopped" ;
    updateView(datamodel) ;
}

function updateView(data){
    Object.keys(data).forEach(function(id){
        console.log("id",id,data[id]) ;
        var element = document.getElementById(id) ;
        if (element) element.innerHTML = data[id] ;
    });
    var activeplayer = data.activeplayer ;
    document.getElementById(activeplayer).className = "activeplayer" ;
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
    "activeplayer": "player3-team1"
} ;