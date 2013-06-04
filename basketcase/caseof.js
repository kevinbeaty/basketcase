'use strict';
var _ = require('lodash'),
    toFunction = require('./tofunction'),
    match = require('./match'),
    method = require('./multimethod'),
    matchArray = match.matchArray,
    // KISS, trust user to validate type names
    matchAlt = /\|/,
    matchType = /\s*([^\s\(]+)/,
    matchAttributes = /\((.*)\)/,
    matchAttributesSep = /\s*,\s*/;

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
  var typeByLength = [];

  _(arguments)
    .map(function(arg){
      return arg.split(matchAlt);
    })
    .flatten(true)
    .each(function(typeDef){
      var type = matchType.exec(typeDef),
          attributes = matchAttributes.exec(typeDef),
          attrLength;

      type = type && type[1];
      attributes = attributes && attributes[1].split(matchAttributesSep);
      attributes = attributes || [];
      attrLength = attributes.length;

      if(!type){
        throw new Error('Cannot extract type for '+typeDef);
      }

      Data[type] = createDataType(Data, type, attributes);

      if(!typeByLength[attrLength]){
        typeByLength[attrLength] = Data[type];
      }
    });

  function Data(){
    if(!(this instanceof Data)){
      var args = arguments,
          fn = typeByLength[args.length];
      if(!fn){
        throw new Error('Cannot find type with length '+args.length);
      }
      return fn.apply(null, args);
    }
  }
  return Data;
}

function createDataType(Data, type, attributes){
  function F(args){
    if(!(this instanceof F)){
      return new F(arguments);
    }

    _.each(attributes, function(arg, i){
      this[arg] = args[i];
    }, this);
  }

  F.prototype = new Data();
  F.prototype.constructor = F;

  var unapply = F.unapply = method(F)(function(self){
    return _.map(attributes, function(arg){
      return self[arg];
    });
  });

  F.prototype.unapply = function(other){
    var unThis, unOther, methodOther;
    if(other instanceof F){
      unThis = unapply(this);
      unOther = unapply(other);
      methodOther = method.apply(null, unThis)(unOther);
      return methodOther.apply(null, unOther);
    }
  };

  F.toString = function(){
    return type;
  };

  F.prototype.toString = function(){
    return type+'('+unapply(this).join(', ')+')';
  };

  return F;
}
