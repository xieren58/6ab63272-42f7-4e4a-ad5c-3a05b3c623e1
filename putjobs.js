'use strict';

var fivebeans = require('fivebeans');

var host = 'localhost';
var port = 11300;
var tube = 'xieren58';


var job1 = {
  type: 'currency_exchange_rate',
  payload: {
    from: 'USD',
    to: 'HKD'
  }
};

var job2 = {
  type: 'currency_exchange_rate',
  payload: {
    from: 'CNY',
    to: 'HKD'
  }
};


var doneEmittingJobs = function () {
  console.log('We reached our completion callback. Now closing down.');
  emitter.end();
  process.exit(0);
};

var continuer = function (err, jobid) {
  console.log('emitted job id: ' + jobid);
  return doneEmittingJobs();
};

var emitter = new fivebeans.client(host, port);
emitter.on('connect', function () {
  emitter.use(tube, function (err, tname) {
    console.log('using ' + tname);
    emitter.put(0, 60, 0, JSON.stringify([tube, job1]), function (err, jobid) {
      continuer(err, jobid);
      // emitter.put(0, 20, 60, JSON.stringify([tube, job2]), continuer);
    });
  });
});

emitter.connect();
