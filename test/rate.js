'use strict';

var request = require('request');
var cheerio = require('cheerio');


function main() {
  var from = 'HKD';
  var to = 'CNY';
  var url = 'http://www.xe.com/currencyconverter/convert/?Amount=1&From=' + from + '&To=' + to + '#converter';
  console.log(url, '<- url');
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body);
      var $ = cheerio.load(body);
      var txt = $('td[class=rightCol]', 'tr[class=uccRes]');
      txt.find('span').remove();
      var rate = (txt.text() || '').trim();
      rate = ~~(rate * 100) / 100;
      console.log('<' + rate + '>');
    }
  });
}


main();
