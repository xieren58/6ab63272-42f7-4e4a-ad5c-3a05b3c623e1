'use strict';

var async = require('async');
var debug = require('debug')('currency_exchange_rate');
var cheerio = require('cheerio');
var request = require('request');

var db = require('../db')();
// debug(db, '<- db');
var Rates = db.collection('rates');
var Logs = db.collection('logs');

var successDelay = 60;
var failDelay = 3;
var successLimit = 10;
var failLimit = 3;

module.exports = function () {
  return new Scraper();
};

function Scraper() {
  this.type = 'currency_exchange_rate';
}

Scraper.prototype.work = function (payload, callback) {
  // { from: 'USD', to: 'HKD' }
  debug(payload, '<- payload');
  getExchagneRate(payload, function (err, rate) {
    // return callback('success');
    if (err) return fail(payload, callback);
    success(payload, rate, callback);
  });
};

function getExchagneRate(data, cb) {
  var from = data.from;
  var to = data.to;
  var url = 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=' + from + '&To=' + to + '#converter';
  debug(url, '<- url');
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // debug(body);
      var $ = cheerio.load(body);
      var txt = $('td[class=rightCol]', 'tr[class=uccRes]');
      txt.find('span').remove();
      var rate = (txt.text() || '').trim();
      rate = (~~(rate * 100) / 100) + '';
      debug(rate, '<- rate');
      cb(null, rate);
    } else {
      cb(error || new Error('statusCode: ' + response.statusCode));
    }
  });
}

function success(payload, rate, cb) {
  var logKey = payload.from + '_' + payload.to;
  debug(logKey, '<- logKey');
  async.waterfall([
    function (next) {
      Logs.findOne({key: logKey}, function (err, log) {
        next(err, log);
      });
    },
    function (log, next) {
      debug(log, '<-- log');
      if (log) {
        if (log.success >= successLimit) return next(null, successLimit + 1);
        log.success += 1;
        Logs.update({key: logKey}, {$set: {success: log.success}}, function (err) {
          next(err, log.success);
        });
      } else {
        Logs.insert({
          key: logKey,
          success: 1,
          fail: 0
        }, function (err) {
          next(err, 1);
        });
      }
    },
    function (result, next) {
      debug(result, '<- log.success');
      if (result > successLimit) return next(null, result);
      Rates.insert({
        from: payload.from,
        to: payload.to,
        created_at: new Date(),
        rate: rate + ''
      }, function (err) {
        next(err, result);
      });
    }
  ], function (err, result) {
    if (err) {
      debug(err, '<-- err');
      return cb('release', successDelay);
    }
    if (result >= successLimit) return cb('success');
    cb('release', successDelay);
  });
}

function fail(payload, cb) {
  var logKey = payload.from + '_' + payload.to;
  async.waterfall([
    function (next) {
      Logs.findOne({key: logKey}, function (err, log) {
        next(err, log);
      });
    },
    function (log, next) {
      if (log) {
        if (log.fail >= failLimit) return next(null, failLimit + 1);
        log.fail += 1;
        Logs.update({key: logKey}, {$set: {fail: log.fail}}, function (err) {
          next(err, log.fail);
        });
      } else {
        Logs.insert({
          key: logKey,
          success: 0,
          fail: 1
        }, function (err) {
          next(err, 1);
        });
      }
    }
  ], function (err, result) {
    debug(result, '<- log.fail');
    if (err) return cb('release', failDelay);
    if (result >= failLimit) return cb('bury');
    cb('release', failDelay);
  });
}




