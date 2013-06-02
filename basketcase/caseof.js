'use strict';
var _ = require('lodash'),
    toFunction = require('./tofunction'),
    match = require('./match'),
    method = require('./multimethod'),
    matchArray = match.matchArray,
    // KISS, trust user to validate type names
    matchAlt = /\|/,
    matchType = /\s*([^\s\(]+)/,
    matchArgs = /\((.*)\)/,
    matchArgsSep = /\s*,\s*/;

module.exports = exports = caseOf;
_.extend(exports, {
  data:data
});

function caseOf(){
  var extract = matchArray(arguments, {toFunction:extractor, fallthrough: true});
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

  return method(extract)(_.identity);
}


function data(){
  var typeDefs = [], fn;

  _.each(arguments, function(arg){
    if(_.isString(arg)){
      typeDefs = typeDefs.concat(arg.split(matchAlt));
    } else if(_.isFunction(arg)){
      fn = arg;
    }
  });

  fn = fn || _.identity;

  function Data(){
    if(!(this instanceof Data)){
      return fn.apply(Data, arguments);
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

    createType(Data, name, args);
  });

  return Data;
}

function createType(Data, name, argNames){
  Data[name] = F;
  function F(args){
    if(!(this instanceof F)){
      return new F(arguments);
    }

    _.each(argNames, function(arg, i){
      this[arg] = args[i];
    }, this);
  }

  F.prototype = new Data();
  F.prototype.constructor = F;

  F.unapply = method(F)(function(self){
    return _.map(argNames, function(arg){
      return self[arg];
    });
  });

  F.prototype.unapply = function(other){
    if(other instanceof F){
      return method.apply(null, F.unapply(this))(function(){
        return arguments;
      }).apply(null, F.unapply(other));
    }
  };

  F.toString = function(){
    return name;
  };

  F.prototype.toString = function(){
    return name+'('+F.unapply(this).join(', ')+')';
  };
}
