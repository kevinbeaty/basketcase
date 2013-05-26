'use strict';
/*globals describe, it, match, eq*/

describe('primitives', function(){
var pred = match.predicates,
    guard = match.guard,
    otherwise = match.otherwise,
    _ = match._,
    add = function(a){return function(m){return m+a;};};

  it('should guard even ', function(){
    var isEven = function(m){return m%2 === 0;},
        fn = match(guard(isEven)(), 'odd');

    eq(fn(1), 'odd');
    eq(fn(0), 0);
    eq(fn(2), 2);
    eq(fn(-2), -2);
    eq(fn(-1), 'odd');
  });

  it('should match odd/even with undefined fall through', function(){
    var fn = match(
      function(m){
        if(m % 2 === 0){
          return 'even';
        }
      },
      otherwise(function(){
        return 'odd';
      }));

    eq(fn(1), 'odd');
    eq(fn(0), 'even');
    eq(fn(2), 'even');
    eq(fn(-2), 'even');
    eq(fn(-1), 'odd');
  });

  it('should match truthy', function(){
    var fn = match(match.truthy(add(1)), false);

    eq(fn(1), 2);
    eq(fn(true), 2);
    eq(fn(3), 4);
    eq(fn(false), false);
    eq(fn(null), false);
    eq(fn('hi'), 'hi1');
    eq(fn(), false);

  });

  it('should match falsey', function(){
    var fn = match(match.falsey(false), add(1));

    eq(fn(1), 2);
    eq(fn(true), 2);
    eq(fn(3), 4);
    eq(fn(false), false);
    eq(fn(null), false);
    eq(fn('hi'), 'hi1');
    eq(fn(), false);

  });

  it('should match or equal', function(){
    var or = match.or,
        equal = pred.equal,
        fn = match(
          or(equal(1), equal(3))(add(1)),
          or(equal(2), equal(4))(add(-1)),
          add(2));

    eq(fn(1), 2);
    eq(fn(2), 1);
    eq(fn(3), 4);
    eq(fn(4), 3);
    eq(fn(5), 7);
    eq(fn(10), 12);
    eq(fn('hi'), 'hi2');

  });

  it('should match and not equal', function(){
    var and = match.and,
        equal = pred.equal,
        not = pred.not,
        fn = match(
          and(not(equal(1)), not(equal(3)))(add(1)),
          and(not(equal(1)), not(equal(2, 4)))(add(-1)),
          add(2));

    eq(fn(1), 3);
    eq(fn(2), 3);
    eq(fn(3), 2);
    eq(fn(4), 5);
    eq(fn(5), 6);
    eq(fn(10), 11);
    eq(fn('hi'), 'hi1');

  });

  it('should match equal', function(){
    var equal = match.equal,
        fn = match(
          equal(1, 3)(add(1)),
          equal(2, 4)(add(-1)),
          add(2));

    eq(fn(1), 2);
    eq(fn(2), 1);
    eq(fn(3), 4);
    eq(fn(4), 3);
    eq(fn(5), 7);
    eq(fn(10), 12);
    eq(fn('hi'), 'hi2');

  });

  it('should match not(equal)', function(){
    var not = match.not,
        equal = pred.equal,
        fn = match(
          not(equal(1, 3))(add(1)),
          not(equal(1, 2, 4))(add(-1)),
          add(2));

    eq(fn(1), 3);
    eq(fn(2), 3);
    eq(fn(3), 2);
    eq(fn(4), 5);
    eq(fn(5), 6);
    eq(fn(10), 11);
    eq(fn('hi'), 'hi1');

  });

  it('should match where', function(){
    var where = match.where,
      appendName = function(val){
        return function(person){
          return _.defaults({name: person.name + val}, person);
        };
      },

      fn = match(
        where({name:'bob'})(),
        where({age:90})(appendName(' is old')),
        where({name:'fred'})(appendName('?')),
        otherwise());

    eq(fn({name:'bob', age:90}), {name: 'bob', age:90});
    eq(fn({name:'fred', age:90}), {name: 'fred is old', age:90});
    eq(fn({name:'wilma', age:90}), {name: 'wilma is old', age:90});

    eq(fn({name:'bob', age:30}), {name: 'bob', age:30});
    eq(fn({name:'fred', age:30}), {name: 'fred?', age:30});
    eq(fn({name:'wilma', age:30}), {name: 'wilma', age:30});
  });

  it('should match _ predicates', function(){
    var O = function(){this.x=10;},
        fn = match(
          match.isFunction('function'),
          match.isArguments('arguments'),
          match.isArray('array'),
          match.isBoolean(),
          match.isRegExp('regexp'),
          match.isDate('date'),
          match.isElement('element'),
          match.isFinite('finite'),
          match.isNaN('nan'),
          match.isNull(),
          match.isNumber('number'),
          match.isUndefined('undefined'),
          match.isEmpty('empty'),
          match.isString(),
          match.isPlainObject('plainobject'),
          match.isObject('object'));

    eq(fn(arguments), 'arguments');
    eq(fn([]), 'array');
    eq(fn(true), true);
    eq(fn(new Date()), 'date');
    eq(fn(''), 'empty');
    eq(fn('hi'), 'hi');
    eq(fn(1234), 'finite');
    eq(fn(_.identity), 'function');
    eq(fn(+'z'), 'nan');
    eq(fn(null), null);
    eq(fn(1/0), 'number');
    eq(fn({a:1}), 'plainobject');
    eq(fn(/8/), 'regexp');
    eq(fn(new O()), 'object');

  });

  it('should recurse on factorial', function(){
    var equal = match.equal,
        fn = match(
          equal(1, 0)(1),
          function(x){return x*fn(x-1);});

    eq(_.range(0, 7).map(fn), [1,1,2,6,24,120,720]);
  });

  it('should recurse on fibonacci', function(){
    var equal = match.equal,
        fn = match(
          equal(0, 1)(),
          function(x){return fn(x-1) + fn(x-2);});

    eq(_.range(0, 11).map(fn), [0,1,1,2,3,5,8,13,21,34,55]);
  });
});

