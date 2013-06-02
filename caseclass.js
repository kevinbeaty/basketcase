'use strict';
var match = require('./basketcase'),
    method = match.method,
    _ = require('lodash'),
    // KISS, trust user to validate type names
    matchAlt = /\|/,
    matchType = /\s*([^\s\(]+)/,
    matchArgs = /\((.*)\)/,
    matchArgsSep = /\s*,\s*/;

module.exports = function(){
  var typeDefs = [], fn;

  _.each(arguments, function(arg){
    if(_.isString(arg)){
      typeDefs = typeDefs.concat(arg.split(matchAlt));
    } else if(_.isFunction(arg)){
      fn = arg;
    }
  });

  fn = fn || _.identity;

  var data = Data;
  function Data(){
    if(!(this instanceof Data)){
      return fn.apply(data, arguments);
    }
  }

  _.each(typeDefs, function(typeDef){
    var name = matchType.exec(typeDef),
        args = matchArgs.exec(typeDef);
    name = name && name[1];
    args = args && args[1].split(matchArgsSep);

    if(!name){
      throw new TypeError('Cannot extract type for '+typeDef);
    }

    data[name] = create(new Data(), name, args);
  });

  return data;
};

function create(data, name, argNames){
  function F(args){
    if(!(this instanceof F)){
      return new F(arguments);
    }

    _.each(argNames, function(arg, i){
      this[arg] = args[i];
    }, this);
  }

  F.prototype = data;
  F.prototype.constructor = F;

  F.unapply = method(F)(function(){
    return _.map(argNames, function(arg){
      return this[arg];
    }, this);
  });

  F.toString = function(){
    return name;
  };

  F.prototype.toString = function(){
    return name+'('+F.unapply(this).join(', ')+')';
  };

  return F;
}
