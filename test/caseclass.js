'use strict';
/*globals describe, it, match, eq*/
var data = require('../caseclass'),
    imply = match.imply,
    method = match.method,
    guard = match.guard,
    pred = match.predicates,
    otherwise = match.otherwise,
    where = pred.where,
    _ = match._;

describe('unapply List', function(){
  var List = data(
        'Empty | NonEmpty(head, tail)',
        function(arr){
            return (arr && arr.length) ?
              this.NonEmpty(arr[0], arr.slice(1)) :
              this.Empty;
        });

  it('should have List toString', function(){
    eq(List.Empty.toString(), 'Empty');
    eq(List.Empty().toString(), 'Empty()');
    eq(List.NonEmpty.toString(), 'NonEmpty');
    eq(List.NonEmpty(1, [2, 3]).toString(), 'NonEmpty(1, 2,3)');
  });

  it('should unapply imply(List)(head, tail) NonEmpty, 0', function(){
    var fn =
      imply(List)(
        method(List.NonEmpty)(function(head, tail){
          return head + fn(tail);
        }), 0);

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, NonEmpty', function(){
    var fn =
      imply(List)(
        method(List.Empty)(0),
        method(List.NonEmpty)(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, always', function(){
    var fn =
      imply(List)(
        method(List.Empty)(0),
        otherwise(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });
});

describe('unapply Term obj', function(){
  var Term = data(
    'Var(name)',
    'Fun(arg, body)',
    'App(f, v)',
    'BinOp(op, a, b)');

  var Var = Term.Var,
      Fun = Term.Fun,
      App = Term.App,
      BinOp = Term.BinOp,
      Add = makeBinOp('+'),
      Mul = makeBinOp('*');

  function makeBinOp(op){
    return function(a, b){
      return BinOp(op, a, b);
    };
  }
  function pickA(op, a){return a;}
  function pickB(op, a, b){return b;}
  var simplifyA = simplifySkip(1); // skip op
  var simplifyB = simplifySkip(2); // skip op plus unary a
  function simplifySkip(n){
    return function(){
      var args = _.drop(arguments, n);
      return simplify.apply(null, args);
    };
  }

  var simplify = match(
      method('*', 1, BinOp)(simplifyB),
      method('*', BinOp, 1)(simplifyA),
      method('*', Var, 1)(pickA),
      method('*', 1, Var)(pickB),
      method('+', 0, BinOp)(simplifyB),
      method('+', BinOp, 0)(simplifyA),
      method('+', Var, 0)(pickA),
      method('+', 0, Var)(pickB),
      function(op, a, b){
        return '('+termString(a)+' '+op+' '+termString(b)+')';
      });

  var termString = match(
      method(Var)(),
      method(Fun)(function(x, b){
        return '^'+x+'.'+termString(b);
      }),
      method(App)(function(f, v){
        return '('+termString(f)+' '+termString(v)+')';
      }),
      method(BinOp)(simplify),
      otherwise());

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
