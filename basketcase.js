'use strict';

var _ = require('lodash'),
    predicates = require('./predicates');

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
  return _match(_.map(arguments, toFunction), true);
}

function _match(fns, exhaustError){
  var len = fns.length;
  return function(value){
    var matched, fn, i = 0;
    for(; i<len; ++i){
      matched = fns[i].apply(value, arguments);
      if(!_.isUndefined(matched)){
        return matched;
      }
    }

    if(exhaustError){
      throw new TypeError('match non exhaustive for '+_.toArray(arguments));
    }
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

function caseOf(){
  var extract = _match(_.map(arguments, extractor));
  return function(fn){
    fn = toFunction(fn);
    return function(value){
      var args = extract.apply(value, arguments);
      if(!_.isUndefined(args)){
        if(_.isArray(args) || _.isArguments(args)){
          return fn.apply(value, args);
        } else {
          return fn.call(value, args);
        }
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

  if(_.isRegExp(extract)){
    return function(value){
      var matched = extract.exec(value);
      if(matched){
        return _.rest(matched);
      }
    };
  }

  if(_.isFunction(extract)){
    return extract;
  }

  return method(extract)(_.identity);
}
