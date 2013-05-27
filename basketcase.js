'use strict';

var _ = require('lodash'),
    predicates = require('./lib/predicates'),
    slice = Array.prototype.slice;

module.exports = exports = match;
_.extend(exports, {
  _:_,
  predicates:predicates,
  imply:imply,
  guard:guard,
  method:method,
  otherwise:guard(predicates.always)
});

function match() {
  var fns = _.map(arguments, toFunction),
      len = fns.length;
  return function(value){
    var matched, fn, i = 0;
    for(; i<len; ++i){
      matched = fns[i].apply(value, arguments);
      if(!_.isUndefined(matched)){
        return matched;
      }
    }
    throw new TypeError('match non exhaustive for '+slice.call(arguments));
  };
}

function imply(fn){
  return function(){
    var matched = match.apply(null, arguments);
    return function(value){
      return matched(fn.apply(value, arguments));
    };
  };
}

function guard(){
  var ps = arguments;
  return function(fn){
    fn = applyUnapply(fn);
    return function(value){
      var args = arguments;
      if(predicateArgs(ps, args)){
        return fn.apply(value, args);
      }
    };
  };
}

function method(){
  var ps = _.map(arguments, function(t){
    return predicates.isA(t);
  });
  return guard.apply(null, ps);
}

function predicateArgs(ps, args){
  var i=0, len = ps.length;
  for(; i<len; ++i){
    if(!ps[i](args[i])){
      return false;
    }
  }

  return true;
}

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

function applyUnapply(fn){
  fn = toFunction(fn);
  return function(value){
    var unapplied = unapply.apply(null, arguments);
    if(!_.isUndefined(unapplied)){
      return fn.apply(value, unapplied);
    }
  };
}

function unapply(){
  var args = _.map(arguments, function(value){
    if(value && _.isFunction(value.unapply)){
      return value.unapply.call(value, value);
    }
    return [value];
  });

  return _.flatten(args, true);
}
