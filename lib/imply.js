'use strict';

var _ = require('lodash'),
    match = require('./match'),
    matchArray = match.matchArray;

module.exports = exports = imply;
function imply(fn){
  return function(){
    var matched = matchArray(arguments);
    return function(value){
      return matched(fn.apply(value, arguments));
    };
  };
}
