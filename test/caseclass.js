'use strict';
/*globals describe, it, match, eq*/
var data = require('../caseclass'),
    imply = match.imply,
    caseOf = match.caseOf,
    method = match.method,
    guard = match.guard,
    pred = match.predicates,
    isA = pred.isA,
    otherwise = match.otherwise,
    where = pred.where,
    _ = match._;

describe('caseclass List', function(){
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
        caseOf(List.NonEmpty)(function(head, tail){
          return head + fn(tail);
        }), 0);

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List)(head, tail) Empty, NonEmpty', function(){
    var fn =
      imply(List)(
        caseOf(List.Empty)(0),
        caseOf(List.NonEmpty)(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply imply(List) method(list.head, list.tail) NonEmpty, 0', function(){
    var fn =
      imply(List)(
        method(List.NonEmpty)(function(list){
          return list.head + fn(list.tail);
        }), 0);

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply NonEmpty(head, tail) method(list.head, list.tail)', function(){
    var fn = match(
        method(List.NonEmpty)(function(l){
          return l.head + fn(List(l.tail));
        }), 0),
        list = List.NonEmpty(1, [2, 3, 4, 5]);

    eq(List(), List.Empty);
    eq(List([1]), List.NonEmpty(1, []));
    eq(List([1, 2, 3, 4, 5]), list);
    eq(list.head, 1);
    eq(list.tail, [2, 3, 4, 5]);

    eq(isA(List)(List.Empty()), true);
    eq(isA(List.Empty)(List.Empty()), true);
    eq(isA(List.NonEmpty)(List.Empty()), false);

    eq(isA(List)(List.NonEmpty([1,2])), true);
    eq(isA(List.NonEmpty)(List.NonEmpty([1,2])), true);
    eq(isA(List.Empty)(List.NonEmpty([1,2])), false);

    eq(isA(List)(list), true);
    eq(isA(List.NonEmpty)(list), true);
    eq(isA(List.Empty)(list), false);
    eq(fn(list), 15);

    list.head = 2;
    eq(fn(list), 16);

    list.tail = [];
    eq(fn(list), 2);

    list.tail = [5, 4];
    eq(fn(list), 11);
  });
});

describe('caseclass Term obj', function(){
  var Term = data(
    'Var(name)',
    'Fun(arg, body)',
    'App(f, v)',
    'BinOp(op, a, b)');

  var Var = Term.Var,
      Fun = Term.Fun,
      App = Term.App,
      BinOp = Term.BinOp,
      Add = _.partial(BinOp, '+'),
      Mul = _.partial(BinOp, '*');

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
