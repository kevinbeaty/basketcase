'use strict';

var _ = require('lodash'),
    toFunction = require('./tofunction');

module.exports = exports = match;
_.extend(exports, {
  matchArray:matchArray
});

function match(){
  return matchArray(arguments);
}

function matchArray(fns, opts){
  opts = opts || {};
  var toFun = opts.toFunction || toFunction;
  fns = _.map(fns, toFun);

  var len = fns.length;
  return function(value){
    var matched, fn, i = 0;
    for(; i<len; ++i){
      matched = fns[i].apply(value, arguments);
      if(!_.isUndefined(matched)){
        return matched;
      }
    }

    if(!opts.fallthrough){
      throw new TypeError('match non exhaustive for '+_.toArray(arguments));
    }
  };
}

