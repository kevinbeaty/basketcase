'use strict';
/*globals describe, it, match, eq*/
var imply = match.imply,
    guard = match.guard,
    pred = match.predicates,
    instanceOf = pred.instanceOf,
    otherwise = match.otherwise,
    where = pred.where,
    _ = match._;

describe('unapply List', function(){
  var Empty = function(){};
  Empty.singleton = new Empty();

  var NonEmpty = function(head, tail){
    this.head = head;
    this.tail = tail;
  };
  NonEmpty.prototype.unapply = function(){
    return [this.head, this.tail];
  };

  function List(arr){
    return (arr && arr.length) ? new NonEmpty(arr[0], arr.slice(1)) : Empty.singleton;
  }

  it('should unapply imply(List)(head, tail) NonEmpty, 0', function(){
    var fn =
      imply(List)(
        guard(instanceOf(NonEmpty))(function(head, tail){
          return head + fn(tail);
        }), 0);

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, NonEmpty', function(){
    var fn =
      imply(List)(
        guard(instanceOf(Empty))(0),
        guard(instanceOf(NonEmpty))(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, always', function(){
    var fn =
      imply(List)(
        guard(instanceOf(Empty))(0),
        otherwise(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });
});

describe('unapply Term obj', function(){
  var Var = function(name){
    if(!(this instanceof Var)) return new Var(name);
    this.name = name;
  };
  Var.prototype.unapply = function(){
    return [this.name];
  };

  var Fun = function(arg, body){
    if(!(this instanceof Fun)) return new Fun(arg, body);
    this.arg = arg;
    this.body = body;
  };
  Fun.prototype.unapply = function(){
    return [this.arg, this.body];
  };

  var App = function(f, v){
    if(!(this instanceof App)) return new App(f, v);
    this.f = f;
    this.v = v;
  };
  App.prototype.unapply = function(){
    return [this.f, this.v];
  };

  var termString = match(
      guard(instanceOf(Var))(),
      guard(instanceOf(Fun))(function(x, b){
        return '^'+x+'.'+termString(b);
      }),
      guard(instanceOf(App))(function(f, v){
        return '('+termString(f)+' '+termString(v)+')';
      }));

  it('should print id = ^x.x', function(){
    var id = Fun('x', Var('x'));
    eq(termString(id), '^x.x');
  });

  it('should print t = ^x.^y.(x y)', function(){
    var t = Fun('x', Fun('y', App(Var('x'), Var('y'))));
    eq(termString(t), '^x.^y.(x y)');
  });
});

describe('unapply Term func', function(){
  var Var = _.identity;

  var Fun = function(arg, body){
    return {
      type: 'Fun',
      arg: arg,
      body:body,
      unapply: function(fun){
        return [fun.arg, fun.body];
      }
    };
  };

  var App = function(f, v){
    return {
      type: 'App',
      values:[f, v],
      unapply: function(){
        return this.values;
      }
    };
  };

  var termString = match(
      guard(where({type:'Fun'}))(function(x, b){
        return '^'+x+'.'+termString(b);
      }),
      guard(where({type:'App'}))(function(f, v){
        return '('+termString(f)+' '+termString(v)+')';
      }),
      otherwise());

  it('should print id = ^x.x', function(){
    var id = Fun('x', Var('x'));
    eq(termString(id), '^x.x');
  });

  it('should print t = ^x.^y.(x y)', function(){
    var t = Fun('x', Fun('y', App(Var('x'), Var('y'))));
    eq(termString(t), '^x.^y.(x y)');
  });
});


describe('unapply DivBy2 obj', function(){
  var DivBy2 = function(x){
    if(!(this instanceof DivBy2)) return new DivBy2(x);
    this.x = x;
  };
  DivBy2.prototype.unapply = function(){
    if(this.x % 2 === 0){
      return [this.x/2];
    }
  };

  it('should unapply DivBy2 instanceOf, 0', function(){
    var divBy2 = imply(DivBy2)(guard(instanceOf(DivBy2))(), 0);
    eq(divBy2(2), 1);
    eq(divBy2(4), 2);
    eq(divBy2(-5), 0);
  });

  it('should unapply DivBy2 always, false', function(){
    var divBy2 = imply(DivBy2)(otherwise(), false);
    eq(divBy2(2), 1);
    eq(divBy2(4), 2);
    eq(divBy2(-5), false);
  });
});

describe('unapply DivBy2 func', function(){
  var DivBy2 = function(x){ return x/2; };

  it('should unapply DivBy2 identity', function(){
    var divBy2 = imply(DivBy2)(otherwise());
    eq(divBy2(2), 1);
    eq(divBy2(4), 2);
    eq(divBy2(-5), -2.5);
  });

  it('should unapply DivBy2 always', function(){
    var divBy2 = imply(DivBy2)(otherwise());
    eq(divBy2(2), 1);
    eq(divBy2(4), 2);
    eq(divBy2(-5), -2.5);
  });
});
