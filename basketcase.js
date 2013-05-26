'use strict';

var _ = require('lodash'),
    predicates = require('./lib/predicates');

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

var applyUnapplyIdentity = applyUnapply(_.identity);

function match() {
  var fns = _.map(arguments, toFunction);
  return function(value){
    var matched, fn, i = 0, len = fns.length;
    for(; i<len; ++i){
      matched = fns[i].call(value, value);
      if(!_.isUndefined(matched)){
        return matched;
      }
    }
    matched = applyUnapplyIdentity(value);
    return _.isUndefined(matched) ? value : matched;
  };
}

function imply(fn){
  fn = applyUnapply(fn);
  return function(){
    var matched = match.apply(null, arguments);
    return function(value){
      return matched(fn(value));
    };
  };
}

function guard(p){
  return function(fn){
    fn = applyUnapply(fn);
    return function(value){
      if(!!p(value)){
        return fn(value);
      }
    };
  };
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
      return fn.apply(value, unapplied);
    }
  };
}

function applyUnapplyConstantly(value){
  return function(){
    return applyUnapplyIdentity(value);
  };
}
