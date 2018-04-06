console.log("Start");

var https = require('https');

var fs = require('fs');

var configurationData   = fs.readFileSync('configuration.json') ;
var configuration       = JSON.parse(configurationData) ;

var access_token = configuration.access_token ;

function errorManager(err){
    if (!err) return ;
    console.log(err) ;
}

function readVariable(deviceId,variableName){
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
            } catch (e){
                console.log("Error:",e,body) ;
                var errObj = { datetime: new Date(), e: e, body: body} ;
                fs.appendFile(configuration.errorlogfilename,JSON.stringify(errObj),errorManager);
            }
        });

    }); 
}

function callFunction(deviceId,functionName,args){

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
    });
  });

  req.write(JSON.stringify({ arg: args }));
  req.end();
}

var i = 0 ;
setInterval(function(){
    var device = configuration.devices[i] ;
    readVariable(device.deviceId,device.variableName) ;
    i++ ;
    if (i == configuration.devices.length) i = 0 ;
},3000);
