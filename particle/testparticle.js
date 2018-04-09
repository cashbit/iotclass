console.log("Start");

var https = require('https');

var fs = require('fs');

var configurationData   = fs.readFileSync('configuration.json') ;
var configuration       = JSON.parse(configurationData) ;

var access_token = configuration.access_token ;

var heater = configuration.heater ;

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

/*
var i = 0 ;
setInterval(function(){
    var device = configuration.devices[i] ;
    readVariable(device.deviceId,device.variableName) ;
    i++ ;
    if (i == configuration.devices.length) i = 0 ;
},3000);
*/

var h = 0;
setInterval(function(){
    var device = heater[h] ;
    console.log(device) ;

    var heaterOn = "false" ;
    var tempsetpoint ;

    var dateTime = new Date() ;
    device.days.forEach(function(day){
        // {"day": 1, "start":"10:00","stop":"10:30", "tempsetpoint":18}
        if (dateTime.getDay() != day.day) return ;

        var start = day.start ;
        var startComponents = start.split(":") ;
        var startHour = startComponents[0] ;
        var startMinute = startComponents[1] ;

        var stop = day.stop ;
        var stopComponents = stop.split(":") ;
        var stopHour = stopComponents[0] ;
        var stopMinute = stopComponents[1] ;

        if (dateTime.getHours() >= startHour){
            if (dateTime.getMinutes() >= startMinute){
                if (dateTime.getHours() < stopHour){
                    heaterOn = "true" ;
                    tempsetpoint = day.tempsetpoint ;
                } else if (
                    dateTime.getHours() == stopHour && 
                    dateTime.getMinutes() <= stopMinute
                    ){
                    heaterOn = "true" ; 
                    tempsetpoint = day.tempsetpoint ;
                }
            }
        }
    })
    
    console.log("heaterOn",heaterOn,"tempsetpoint",tempsetpoint) ;

    if (tempsetpoint) {
        callFunctionIfVariableValueIsDifferent(device.deviceId, "settemp", "tempsetpoint", tempsetpoint,function(response){
            callFunctionIfVariableValueIsDifferent(device.deviceId, "setheater", "heateron", heaterOn);
        })
    } else {
        callFunctionIfVariableValueIsDifferent(device.deviceId, "setheater", "heateron", heaterOn);
    }
 
    h++ ;
    if (h == heater.length) h = 0 ;
},5000);