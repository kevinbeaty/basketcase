'use strict';
/*globals describe, it, match, eq*/
var imply = match.imply,
    caseOf = match.caseOf,
    data = caseOf.data,
    method = match.method,
    guard = match.guard,
    isA = guard.isA,
    _ = match._;

describe('caseclass List', function(){
  var List = data('Empty | NonEmpty(head, tail)'),
      Empty = List.Empty,
      NonEmpty = List.NonEmpty,
      toList = function(arr){
        return arr.length ? List(arr[0], arr.slice(1)) : List();
      };

  it('should have List toString', function(){
    eq(Empty.toString(), 'Empty');
    eq(Empty().toString(), 'Empty()');
    eq(NonEmpty.toString(), 'NonEmpty');
    eq(NonEmpty(1, [2, 3]).toString(), 'NonEmpty(1, 2,3)');
    eq(List().toString(), 'Empty()');
    eq(List(1, [2, 3]).toString(), 'NonEmpty(1, 2,3)');
  });

  it('should unapply imply toList (head, tail)', function(){
    var fn = imply(toList)(
        caseOf(Empty)(0),
        caseOf(NonEmpty)(function(head, tail){
          return head + fn(tail);
        }));

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should convert toList fallthrough', function(){
    var fn = match(
        caseOf(Empty)(0),
        caseOf(NonEmpty)(function(head, tail){
          return head + fn(tail);
        }),
        function(arr){
          return fn(toList(arr));
        });

    eq(fn([1,2,3,4,5]), 15);
  });

  it('should unapply match (head, tail) List', function(){
    var fn = match(
        caseOf(Empty)(0),
        caseOf(NonEmpty)(function(head, tail){
          return head + fn(toList(tail));
        }));

    eq(fn(List(1, [2,3,4,5])), 15);
  });

  it('should unapply imply(List)(head, tail) NonEmpty, 0', function(){
    var fn =
      imply(List)(
        caseOf(List.NonEmpty)(function(head, tail){
          return head + (tail.length ? fn(tail[0], tail.slice(1)) : fn());
        }), 0);

    eq(fn(1, [2,3,4,5]), 15);
  });

  it('should unapply NonEmpty(head, tail) method(list.head, list.tail)', function(){
    var fn = match(
        method(NonEmpty)(function(l){
          return l.head + fn(toList(l.tail));
        }), 0),
        list = NonEmpty(1, [2, 3, 4, 5]);

    eq(List(), List.Empty());
    eq(List(1, []), NonEmpty(1, []));
    eq(List(1, [2, 3, 4, 5]), list);
    eq(list.head, 1);
    eq(list.tail, [2, 3, 4, 5]);

    eq(isA(List)(Empty()), true);
    eq(isA(Empty)(Empty()), true);
    eq(isA(NonEmpty)(Empty()), false);

    eq(isA(List)(NonEmpty(1,[2])), true);
    eq(isA(NonEmpty)(NonEmpty(1,[2])), true);
    eq(isA(Empty)(NonEmpty(1,[2])), false);

    eq(isA(List)(list), true);
    eq(isA(NonEmpty)(list), true);
    eq(isA(Empty)(list), false);

    eq(fn(list), 15);

    list.head = 2;
    eq(fn(list), 16);

    list.tail = [];
    eq(fn(list), 2);

    list.tail = [5, 4];
    eq(fn(list), 11);
  });
});

describe('caseclass Term BinOp', function(){
  var Term = data(
    'Var(name)',
    'Const(value)',
    'Fun(arg, body)',
    'App(f, v)',
    'BinOp(op, a, b)');

  var Var = Term.Var,
      Const = Term.Const,
      Fun = Term.Fun,
      App = Term.App,
      BinOp = Term.BinOp,
      Add = _.partial(BinOp, '+'),
      Mul = _.partial(BinOp, '*');

  var termString = match(
      caseOf(Var, Const)(),
      caseOf(Fun)(function(x, b){
        return '^'+x+'.'+termString(b);
      }),
      caseOf(App)(function(f, v){
        return '('+termString(f)+' '+termString(v)+')';
      }),
      caseOf(BinOp)(match(
        method('*', Term, Const(1))(pickA),
        method('*', Const(1), Term)(pickB),
        method('+', Term, Const(0))(pickA),
        method('+', Const(0), Term)(pickB),
        function(op, a, b){
          return '('+termString(a)+' '+op+' '+termString(b)+')';
        })));

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
    var t = Add(Var('a'), Const(1));
    eq(termString(t), '(a + 1)');
  });

  it('should print 2*(c+3)', function(){
    var t = Mul(Const(2), Add(Var('c'), Const(3)));
    eq(termString(t), '(2 * (c + 3))');
  });

  it('should simplify 1*(c+3)', function(){
    var t = Mul(Const(1), Add(Var('c'), Const(3)));
    eq(termString(t), '(c + 3)');
  });

  it('should simplify 1*(c+0)*1*3', function(){
    var t = Mul(Mul(Mul(Const(1), Add(Var('c'), Const(0))), Const(1)), Const(3));
    eq(termString(t), '(c * 3)');
  });

  it('should simplify 0+(c*1)+(a+0)', function(){
    var t = Add(Add(Const(0), Mul(Var('c'), Const(1))), Add(Var('a'), Const(0)));
    eq(termString(t), '(c + a)');
  });
});

describe('caseclass Term Mul, Add', function(){
  var Term = data(
    'Var(name)',
    'Const(value)',
    'Mul(a, b)',
    'Add(a, b)');

  var Var = Term.Var,
      Const = Term.Const,
      Add = Term.Add,
      Mul = Term.Mul;

  var termString = match(
      caseOf(Var, Const)(),
      caseOf(Mul(Term, Const(1)), Add(Term, Const(0)))(function(a){
        return termString(a);
      }),
      caseOf(Mul(Const(1), Term), Add(Const(0), Term))(function(a, b){
        return termString(b);
      }),
      caseOf(Mul)(function(a, b){
        return '('+termString(a)+' * '+termString(b)+')';
      }),
      caseOf(Add)(function(a, b){
        return '('+termString(a)+' + '+termString(b)+')';
      }));

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
    var t = Add(Var('a'), Const(1));
    eq(termString(t), '(a + 1)');
  });

  it('should print 2*(c+3)', function(){
    var t = Mul(Const(2), Add(Var('c'), Const(3)));
    eq(termString(t), '(2 * (c + 3))');
  });

  it('should simplify 1*(c+3)', function(){
    var t = Mul(Const(1), Add(Var('c'), Const(3)));
    eq(termString(t), '(c + 3)');
  });

  it('should simplify 1*(c+0)*1*3', function(){
    var t = Mul(Mul(Mul(Const(1), Add(Var('c'), Const(0))), Const(1)), Const(3));
    eq(termString(t), '(c * 3)');
  });

  it('should simplify 0+(c*1)+(a+0)', function(){
    var t = Add(Add(Const(0), Mul(Var('c'), Const(1))), Add(Var('a'), Const(0)));
    eq(termString(t), '(c + a)');
  });
});
