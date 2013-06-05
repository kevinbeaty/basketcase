'use strict';

var _ = require('lodash'),
    toFunction = require('./tofunction');

module.exports = exports = guard;
_.extend(exports, {
  otherwise:guard(always),
  equal:equal,
  isA:isA,
  instanceOf:instanceOf,
  prototypeOf:prototypeOf,
  where:where,
  and:and,
  or:or,
  not:not,
  truthy:truthy,
  falsey:falsey,
  always:always,
  never:never
});

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

function predicateArgs(ps, args){
  var i=0, len = ps.length;
  for(; i<len; ++i){
    if(!ps[i](args[i])){
      return false;
    }
  }

  return true;
}

function always(){
  return true;
}

function never(){
  return false;
}

function truthy(value){
  return !!value;
}

function falsey(value){
  return !value;
}

function equal(){
  return argsIfThen(arguments, _.isEqual, true);
}

function isA(){
  return argsIfThen(arguments, _isA, true);
}

function _isA(obj, val){
  return obj === val ||
    (_.isFunction(obj) && _instanceOf(obj, val)) ||
    (obj && _prototypeOf(obj, val)) ||
    (obj === Array && _.isArray(val)) ||
    (obj === Boolean && _.isBoolean(val)) ||
    (obj === Date && _.isDate(val)) ||
    (obj === Function && _.isFunction(val)) ||
    (obj === Number && _.isNumber(val)) ||
    (obj === Object && _.isObject(val)) ||
    (obj === RegExp && _.isRegExp(val)) ||
    (obj === String && _.isString(val)) ||
    _.isEqual(obj, val);
}

function instanceOf(){
  return argsIfThen(arguments, _instanceOf, true);
}

function _instanceOf(obj, val){
  return val instanceof obj;
}

function prototypeOf(){
  return argsIfThen(arguments, _prototypeOf, true);
}

function _prototypeOf(obj, val){
  return obj.isPrototypeOf(val);
}

function where(){
  return argsIfThen(arguments, _where, true);
}

function _where(pattern, val){
  return !!val && _.where([val], pattern).length == 1;
}

function not(p){
  return function(value){
    return !p(value);
  };
}

function or(){
  return argsIfThen(arguments, function(a, v){
    return a(v);
  }, true);
}

function and(){
  return argsIfThen(arguments, function(a, v){
    return !a(v);
  }, false);
}

function argsIfThen(args, p, then){
  return function(value){
    var i = 0, len = args.length;
    for(; i < len; ++i){
      if(p(args[i], value)) return then;
    }
    return !then;
  };
}
