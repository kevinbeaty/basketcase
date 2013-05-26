'use strict';

var _ = require('lodash'),
    predicates = require('./lib/predicates'),
    slice = Array.prototype.slice;

module.exports = exports = match;

_.extend(exports, {
  _:_,
  predicates:predicates,
  imply:imply,
  guard:guard
});

_.each(['truthy', 'falsey', 'always', 'never'], function(name){
  exports[name] = guard(predicates[name]);
});

_.each(['and', 'or', 'not', 'equal', 'where', 'instanceOf'], function(name){
  exports[name] = guardArgs(predicates[name]);
});

_.each(['isArguments', 'isArray', 'isBoolean', 'isDate',
  'isElement', 'isEmpty', 'isFinite', 'isFunction', 'isNaN',
  'isNull', 'isNumber', 'isObject', 'isPlainObject', 'isRegExp',
  'isString', 'isUndefined' ], function(name){
  exports[name] = guard(_[name]);
});

exports.otherwise = exports.always;

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
  fn = applyUnapply(fn);
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

function predicateArgs(ps, args){
  var i=0, len = ps.length;
  for(; i<len; ++i){
    if(!ps[i](args[i])){
      return false;
    }
  }

  return true;
}

function guardArgs(p){
  return function(){
    return guard(p.apply(null, arguments));
  };
}

function toFunction(fn){
 var f = _.isFunction(fn) ? fn :
    _.isUndefined(fn) ? applyUnapplyIdentity :
    applyUnapplyConstantly(fn);
 return f;
}

function unapply(value){
  if(value && _.isFunction(value.unapply)){
    return value.unapply.call(value, value);
  }
  return [value];
}

function applyUnapply(fn){
  fn = toFunction(fn);
  return function(value){
    var unapplied = unapply(value);
    if(!_.isUndefined(unapplied)){
      return fn.apply(value, unapplied.concat(slice.call(arguments, 1)));
    }
  };
}

var _applyUnapplyIdentity = applyUnapply(_.identity);
function applyUnapplyIdentity(value){
  return _applyUnapplyIdentity.apply(value, arguments);
}

function applyUnapplyConstantly(value){
  return function(){
    return applyUnapplyIdentity(value);
  };
}
