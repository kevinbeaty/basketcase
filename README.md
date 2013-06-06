# Basket Case

[![Build Status](https://secure.travis-ci.org/kevinbeaty/basketcase.png)](http://travis-ci.org/kevinbeaty/basketcase)

Pattern matching for JavaScript.

### Guards

```javascript
var match = require('basketcase'),
    guard = match.guard;

describe('primitives', function(){
  it('should recurse on factorial', function(){
    var equal = guard.equal,
        fn = match(
          guard(equal(1, 0))(1),
          function(x){return x*fn(x-1);});

    eq(_.range(0, 7).map(fn), [1,1,2,6,24,120,720]);
  });

  it('should recurse on fibonacci', function(){
    var equal = guard.equal,
        fn = match(
          guard(equal(0, 1))(),
          function(x){return fn(x-1) + fn(x-2);});

    eq(_.range(0, 11).map(fn), [0,1,1,2,3,5,8,13,21,34,55]);
  });
});
```

### Multi Methods

```javascript
var match = require('basketcase'),
    method = match.method,
    guard = match.guard,
    instanceOf = guard.instanceOf,
    prototypeOf = guard.prototypeOf,
    isA = guard.isA;

describe('Asteroid/Spaceship instanceOf', function(){
  var Asteroid = function(id){
    this.id = id;
  };
  Asteroid.prototype.crash = function(){
    return " Boom! "+this.id;
  };

  var Spaceship = function(id){
    this.id = id;
  };
  Spaceship.prototype.crash = function(){
    return " Bang! "+this.id;
  };

  function rock(id){
    return new Asteroid(id);
  }

  function ship(id){
    return new Spaceship(id);
  }

  it('should overload crash guard method', function(){
    var crash = match(
        method(Asteroid, Asteroid)(rockRock),
        method(Spaceship, Spaceship)(shipShip),
        method(Asteroid, Spaceship)(rockShip),
        method(Spaceship, Asteroid)(shipRock));
    testCrash(crash, rock, ship);
  });

  it('should overload crash guard isA', function(){
    var crash = match(
        guard(isA(Asteroid), isA(Asteroid))(rockRock),
        guard(isA(Spaceship), isA(Spaceship))(shipShip),
        guard(isA(Asteroid), isA(Spaceship))(rockShip),
        guard(isA(Spaceship), isA(Asteroid))(shipRock));
    testCrash(crash, rock, ship);
  });
});

function rockRock(a1, a2){
  return 'Asteroids collide!'+a1.crash() + a2.crash();
}

function shipShip(s1, s2){
  return 'Call the gecko...'+s1.crash()+s2.crash();
}

function rockShip(a, s){
  return 'Space debris'+a.crash()+s.crash();
}

function shipRock(s, a){
  return 'Whoops'+a.crash()+s.crash();
}

function testCrash(crash, rock, ship){
  eq(crash(rock(1), rock(2)), 'Asteroids collide! Boom! 1 Boom! 2');
  eq(crash(ship(1), ship(2)), 'Call the gecko... Bang! 1 Bang! 2');
  eq(crash(rock(3), ship(3)), 'Space debris Boom! 3 Bang! 3');
  eq(crash(ship(4), rock(4)), 'Whoops Boom! 4 Bang! 4');
}

```

### RegExp Extractors

```javascript
var match = require('basketcase'),
    caseOf = match.caseOf;

describe('caseOf regexp extracts', function(){
  it('should extract regexp', function(){
    var name = /(Mr|Mrs|Ms|Dr)\. ([A-Z][a-z]+) ([A-Z][a-z]+)/,
        fn = caseOf(name)(function(title, first, last){
          return [title, first, last];
        });
    eq(fn('Mr. Bob Hope'), ['Mr', 'Bob', 'Hope']);
    eq(fn('Mrs. Jane Doe'), ['Mrs', 'Jane', 'Doe']);
    eq(fn('Sir. Richard Branson'));
  });
});
```

## Algebraic Data Types

```javascript
describe('caseclass Term Mul, Add', function(){
  var Exp = data('Var(name) | Mul(a, b) | Add(a, b) | Div(a, b)'),
      Var = Exp.Var,
      Add = Exp.Add,
      Div = Exp.Div,
      Mul = Exp.Mul;

  var simplify = match(
      caseOf(Mul(Exp, 1), Add(Exp, 0), Div(Exp, 1))(function(a){
        return simplify(a);
      }),
      caseOf(Mul(1, Exp), Add(0, Exp))(function(a, b){
        return simplify(b);
      }),
      caseOf(Add(Number, Number))(function(a, b){
        return a+b;
      }),
      caseOf(Mul(Number, Number))(function(a, b){
        return a*b;
      }),
      caseOf(Add(Mul, Mul))(function(a, b){
        if(_.isEqual(a.a, b.a)){
          return simplify(Mul(a.a, simplify(Add(a.b, b.b))));
        }
        if(_.isEqual(a.b, b.b)){
          return simplify(Mul(a.b, simplify(Add(a.a, b.a))));
        }
      }),
      _.identity);

  var termString = imply(simplify)(
      caseOf(Var, Number)(),
      caseOf(Div)(function(a, b){
        return '('+termString(a)+' / '+termString(b)+')';
      }),
      caseOf(Mul)(function(a, b){
        return '('+termString(a)+' * '+termString(b)+')';
      }),
      caseOf(Add)(function(a, b){
        return '('+termString(a)+' + '+termString(b)+')';
      }));

  it('should print (a+b)*(c+d)', function(){
    var t = Mul(Add(Var('a'), Var('b')), Add(Var('c'), Var('d')));
    eq(termString(t), '((a + b) * (c + d))');
  });

  it('should simplify (a*b)+(a*c)', function(){
    var t = Add(Mul(Var('a'), Var('b')), Mul(Var('a'), Var('c')));
    eq(termString(t), '(a * (b + c))');
  });

  it('should simplify (2*c)+(3*c)', function(){
    var t = Add(Mul(2, Var('c')), Mul(3, Var('c')));
    eq(termString(t), '(c * 5)');
  });

  it('should calculate (2*4)+(3*4)', function(){
    var t = Add(Mul(2, 4), Mul(3, 4));
    eq(termString(t), 20);
  });

  it('should simplify 0+(c*1)+(a+0)/1', function(){
    var t = Add(Add(0, Mul(Var('c'), 1)), Div(Add(Var('a'), 0), 1));
    eq(termString(t), '(c + a)');
  });
});

```
