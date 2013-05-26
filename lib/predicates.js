'use strict';

var _ = require('lodash');

module.exports = {
  equal:equal,
  instanceOf:instanceOf,
  where:where,
  and:and,
  or:or,
  not:not,
  truthy:truthy,
  falsey:falsey,
  always:always,
  never:never
};

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

function instanceOf(){
  return argsIfThen(arguments, _instanceOf, true);
}

function _instanceOf(obj, val){
  return val instanceof obj;
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
