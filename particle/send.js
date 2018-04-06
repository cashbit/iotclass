var http = require("https");

var options = {
  "method": "POST",
  "hostname": "api.particle.io",
  "port": null,
  "path": "/v1/devices/36001b001551353531343431/setheater?access_token=c2ffac1a877fc1cbc61834b24a533fe80534cc1a",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache",
    "postman-token": "e9934841-8a5a-1bd9-defa-657b0f6ee145"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write(JSON.stringify({ arg: 'false' }));
req.end();