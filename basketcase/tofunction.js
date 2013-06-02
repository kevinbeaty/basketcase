'use strict';

var _ = require('lodash');

module.exports = exports = toFunction;

function toFunction(fn){
 return _.isFunction(fn) ? fn :
    _.isUndefined(fn) ? _.identity :
    constantly(fn);
}

function constantly(c){
  return function(){
    return c;
  };
}
