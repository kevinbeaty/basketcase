'use strict';
/*globals describe, it, match, eq*/
var imply = match.imply,
    method = match.method,
    caseOf = match.caseOf,
    guard = match.guard,
    otherwise = guard.otherwise,
    _ = match._;

describe('unapply List', function(){
  var Empty = {};

  var NonEmpty = function(head, tail){
    this.head = head;
    this.tail = tail;
  };
  NonEmpty.unapply = method(NonEmpty)(function(){
    return [this.head, this.tail];
  });

  function List(arr){
    return (arr && arr.length) ? new NonEmpty(arr[0], arr.slice(1)) : Empty;
  }

  it('should unapply imply(List)(head, tail) NonEmpty, 0', function(){
    var fn =
      imply(List)(
        caseOf(NonEmpty)(function(head, tail){
          return head + fn(tail);
        }), 0);

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, NonEmpty', function(){
    var fn =
      imply(List)(
        caseOf(Empty)(0),
        caseOf(NonEmpty)(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });
});

describe('unapply Term', function(){
  var Term = function(){};

  var Var = function(name){
    if(!(this instanceof Var)) return new Var(name);
    this.name = name;
  };
  Var.prototype = new Term();
  Var.unapply = method(Var)(function(){
    return [this.name];
  });

  var Fun = function(arg, body){
    if(!(this instanceof Fun)) return new Fun(arg, body);
    this.arg = arg;
    this.body = body;
  };
  Fun.prototype = new Term();
  Fun.unapply = method(Fun)(function(){
    return [this.arg, this.body];
  });

  var App = function(f, v){
    if(!(this instanceof App)) return new App(f, v);
    this.f = f;
    this.v = v;
  };
  App.prototype = new Term();
  App.unapply = method(App)(function(){
    return [this.f, this.v];
  });

  var BinOp = function(op, a, b){
    this.op = op;
    this.a = a;
    this.b = b;
  };
  BinOp.prototype = new Term();
  BinOp.unapply = method(BinOp)(function(){
    return [this.op, this.a, this.b];
  });

  var Mul = function(a, b){
    if(!(this instanceof Mul)) return new Mul(a, b);
    BinOp.call(this, '*', a, b);
  };
  Mul.prototype = new BinOp();
  Mul.unapply = BinOp.unapply;

  var Add = function(a, b){
    if(!(this instanceof Add)) return new Add(a, b);
    BinOp.call(this, '+', a, b);
  };
  Add.prototype = new BinOp();
  Add.unapply = BinOp.unapply;

  var termString = match(
      caseOf(Var)(),
      caseOf(Fun)(function(x, b){
        return '^'+x+'.'+termString(b);
      }),
      caseOf(App)(function(f, v){
        return '('+termString(f)+' '+termString(v)+')';
      }),
      caseOf(BinOp)(match(
        method('*', Term, 1)(pickA),
        method('*', 1, Term)(pickB),
        method('+', Term, 0)(pickA),
        method('+', 0, Term)(pickB),
        function(op, a, b){
          return '('+termString(a)+' '+op+' '+termString(b)+')';
        })),
      otherwise());

  function pickA(op, a){return termString(a);}
  function pickB(op, a, b){return termString(b);}

  it('should print id = ^x.x', function(){
    var id = Fun('x', Var('x'));
    eq(termString(id), '^x.x');
  });

  it('should print t = ^x.^y.(x y)', function(){
    var t = Fun('x', Fun('y', App(Var('x'), Var('y'))));
    eq(termString(t), '^x.^y.(x y)');
  });

  it('should print t = ^x.^y.(x y)', function(){
    var t = Fun('x', Fun('y', App(Var('x'), Var('y'))));
    eq(termString(t), '^x.^y.(x y)');
  });

  it('should print a+b', function(){
    var t = Add(Var('a'), Var('b'));
    eq(termString(t), '(a + b)');
  });

  it('should print a*b', function(){
    var t = Mul(Var('a'), Var('b'));
    eq(termString(t), '(a * b)');
  });

  it('should print (a+b)*(c+d)', function(){
    var t = Mul(Add(Var('a'), Var('b')), Add(Var('c'), Var('d')));
    eq(termString(t), '((a + b) * (c + d))');
  });

  it('should print a+1', function(){
    var t = Add(Var('a'), 1);
    eq(termString(t), '(a + 1)');
  });

  it('should print 2*(c+3)', function(){
    var t = Mul(2, Add(Var('c'), 3));
    eq(termString(t), '(2 * (c + 3))');
  });

  it('should simplify 1*(c+3)', function(){
    var t = Mul(1, Add(Var('c'), 3));
    eq(termString(t), '(c + 3)');
  });

  it('should simplify 1*(c+0)*1*3', function(){
    var t = Mul(Mul(Mul(1, Add(Var('c'), 0)), 1), 3);
    eq(termString(t), '(c * 3)');
  });

  it('should simplify 0+(c*1)+(a+0)', function(){
    var t = Add(Add(0, Mul(Var('c'), 1)), Add(Var('a'), 0));
    eq(termString(t), '(c + a)');
  });
});

describe('unapply DivBy2 obj', function(){
  var DivBy2 = function(x){
    if(!(this instanceof DivBy2)) return new DivBy2(x);
    this.x = x;
  };
  DivBy2.unapply = method(DivBy2)(function(){
    if(this.x % 2 === 0){
      return [this.x/2];
    }
  });

  it('should unapply DivBy2 caseOf, 0', function(){
    var divBy2 = imply(DivBy2)(caseOf(DivBy2)(), 0);
    eq(divBy2(2), 1);
    eq(divBy2(4), 2);
    eq(divBy2(-5), 0);
  });
});
