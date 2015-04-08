'use strict';

var fivebeans = require('fivebeans');
var tube = 'xieren58';

var client = new fivebeans.client('127.0.0.1', 11300);

client.on('connect', function (){
      // console.log(client);
  client.use(tube, function (err, tubename) {
    console.log(tubename);
  });
});

client.on('error', function (err) {
  // connection failure
});

client.on('close', function (){
  // underlying connection has closed
});

client.connect();
