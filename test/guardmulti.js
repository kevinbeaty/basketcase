'use strict';
/*globals describe, it, match, eq*/

describe('guard multi', function(){
var pred = match.predicates,
    guard = match.guard,
    otherwise = match.otherwise,
    _ = match._,
    not = pred.not,
    and = pred.and,
    or = pred.or,
    add = function(a){return function(m){return m+a;};};

  it('should guard even/odd', function(){
    var isEven = function(m){return m%2 === 0;},
        isOdd = not(or(_.isUndefined, isEven)),
        fn = match(guard(isEven, isOdd)(), 'nomatch');

    eq(fn(), 'nomatch');
    eq(fn(1), 'nomatch');
    eq(fn(0), 'nomatch');
    eq(fn(1, 1), 'nomatch');
    eq(fn(2, 1), 2);
    eq(fn(0, 3), 0);
    eq(fn(2, -1), 2);
    eq(fn(-2, -3), -2);
    eq(fn(-1, 3), 'nomatch');
    eq(fn(0, 0), 'nomatch');
    eq(fn(2, 2), 'nomatch');
    eq(fn(-2, -4), 'nomatch');
  });


  it('should match isOld, isYoung', function(){
    var where = match.where,
      oldBob = {name:'bob', age:90},
      oldFred = {name:'fred', age:80},
      oldWilma = {name:'wilma', age:70},
      youngBob = {name:'bob', age:50},
      youngFred = {name:'fred', age:40},
      youngWilma = {name:'wilma', age:30},
      isOld = function(person){
        return person.age > 60;
      },
      isYoung = not(isOld),
      fn = match(
        guard(isOld, isYoung)(function(old, young){
          return old.name+ ' is older than '+young.name;
        }),
        guard(isYoung, isOld)(function(young, old){
          return young.name+ ' is younger than '+old.name;
        }),
        guard(isYoung, isYoung)(function(young1, young2){
          return young1.name + ' and '+young2.name +' are both young';
        }),
        function(old1, old2){
          var older, younger;
          if(old1.age > old2.age){
            older = old1;
            younger = old2;
          } else {
            older = old2;
            younger = old1;
          }
          return younger.name+ ' is old, but younger than '+older.name;
        });

    eq(fn(oldBob, youngFred), 'bob is older than fred');
    eq(fn(oldBob, youngWilma), 'bob is older than wilma');
    eq(fn(youngBob, oldWilma), 'bob is younger than wilma');
    eq(fn(youngBob, oldFred), 'bob is younger than fred');
    eq(fn(youngBob, youngWilma), 'bob and wilma are both young');
    eq(fn(youngWilma, youngFred), 'wilma and fred are both young');
    eq(fn(oldWilma, oldFred), 'wilma is old, but younger than fred');
    eq(fn(oldBob, oldFred), 'fred is old, but younger than bob');
  });

  it('should match pair predicates', function(){
    var fn = match(
      guard(_.isArray, _.isObject)(function(pair, options){
        if(options.reverse){
          pair.reverse();
        }
        return pair;
      }),
      guard(_.isArray)(function(pair){
        return fn(pair, {});
      }),
      guard(_.isNumber, _.isNumber)(function(one, two, options){
        return fn([one, two], options);
      }),
      function(one, two, options){
        return fn(+one, +two, options);
      });

    eq(fn([1,2]), [1,2]);
    eq(fn(1,2), [1,2]);
    eq(fn('1',2), [1,2]);
    eq(fn(1,'2', {reverse:false}), [1,2]);
    eq(fn([1,2], {reverse:true}), [2,1]);
    eq(fn(1,2, {reverse:true}), [2,1]);
    eq(fn('1','2', {reverse:true}), [2,1]);

  });

  it('should recurse on factorial with acc fall through', function(){
    var equal = match.equal,
        pos = function(x){return x > 0;},
        fn = match(
          guard(_.isNumber, pos)(function(acc, n){
            return fn(acc*n, n-1);
          }),
          guard(_.isNumber, _.isUndefined)(function(n){
            return fn(1, n);
          }),
          otherwise()),
        fact = function(n){return fn(n);};

    eq(_.range(0, 7).map(fact), [1,1,2,6,24,120,720]);
  });
});

