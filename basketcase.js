'use strict';

var _ = require('lodash'),
    predicates = require('./predicates'),
    slice = Array.prototype.slice;

module.exports = exports = match;
_.extend(exports, {
  _:_,
  predicates:predicates,
  imply:imply,
  caseOf:caseOf,
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

function caseOf(extract){
  extract = extractor(extract);
  return function(fn){
    fn = toFunction(fn);
    return function(value){
      var args = extract(value);
      if(args){
        return fn.apply(null, args);
      }
    };
  };
}

function guard(){
  var ps = arguments;
  return function(fn){
    fn = toFunction(fn);
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

function extractor(extract){
  if(extract && _.isFunction(extract.unapply)){
    return function(value){
      return extract.unapply(value);
    };
  }

  return method(extract)(_.identity);
}
