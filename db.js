'use strict';

var mongojs = require('mongojs');
var dbConfig = require('./config').mongodb;

module.exports = function () {
  return mongojs(genDbUrl());
};

function genDbUrl(){
  var url = dbConfig.username && dbConfig.password
    ? 'mongodb://' + dbConfig.username + ':' + dbConfig.password + '@' + dbConfig.hostname + ':' + dbConfig.port + '/' + dbConfig.db
    : 'mongodb://' + dbConfig.hostname + ':' + dbConfig.port + '/' + dbConfig.db;
  return url;
}
