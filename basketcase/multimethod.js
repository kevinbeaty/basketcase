'use strict';

var _ = require('lodash'),
    guard = require('./guard');

module.exports = exports = method;
function method(){
  var ps = _.map(arguments, function(t){
    return guard.isA(t);
  });
  return guard.apply(null, ps);
}
