
'use strict';
/*globals describe, it, match, eq*/
var caseOf = match.caseOf,
    guard = match.guard,
    where = guard.where,
    _ = match._,
    add = function(a){return function(m){return m+a;};};

describe('caseOf extracts', function(){
  it('should extract regexp', function(){
    var name = /(Mr|Mrs|Ms|Dr)\. ([A-Z][a-z]+) ([A-Z][a-z]+)/,
        fn = caseOf(name)(function(title, first, last){
          return [title, first, last];
        });
    eq(fn('Mr. Bob Hope'), ['Mr', 'Bob', 'Hope']);
    eq(fn('Mrs. Jane Doe'), ['Mrs', 'Jane', 'Doe']);
    eq(fn('Sir. Richard Branson'));
  });

  it('should match routes', function(){
    var fn = match(
       caseOf(/groups\/(\d+)/)(add(' group GET')),
       caseOf(/groups\/$/, /groups$/)('groups LIST'),
       caseOf(/users\/(\d+)/)(add(' user GET')),
       caseOf(/users\//, /users/)('users LIST'),
       'none');
    eq(fn('groups'), 'groups LIST');
    eq(fn('groups/'), 'groups LIST');
    eq(fn('groups/2'), '2 group GET');
    eq(fn('groups/123'), '123 group GET');
    eq(fn('groups/bob'), 'none');
    eq(fn('users'), 'users LIST');
    eq(fn('users/'), 'users LIST');
    eq(fn('users/2'), '2 user GET');
    eq(fn('users/123'), '123 user GET');
    eq(fn('users/bob'), 'users LIST');
    eq(fn('somewhere/'), 'none');
  });

  it('should match odd/even with undefined fall through', function(){
    var fn = match(
      caseOf(
        function(m){
          if(m % 2 === 0){
            return m;
          }
        },
        function(m){
          if(m > 0){
            return m;
          }
        })(add(' is even or pos')), add(' is odd or neg'));

    eq(fn(1), '1 is even or pos');
    eq(fn(0), '0 is even or pos');
    eq(fn(2), '2 is even or pos');
    eq(fn(-2), '-2 is even or pos');
    eq(fn(-1), '-1 is odd or neg');
  });

  it('should match caseOf guard equal', function(){
    var or = guard.or,
        equal = guard.equal,
        fn = match(
          caseOf(guard(equal(1))(), guard(equal(3))())(add(1)),
          caseOf(guard(equal(2))(), guard(equal(4))())(add(-1)),
          add(2));

    eq(fn(1), 2);
    eq(fn(2), 1);
    eq(fn(3), 4);
    eq(fn(4), 3);
    eq(fn(5), 7);
    eq(fn(10), 12);
    eq(fn('hi'), 'hi2');

  });
});

