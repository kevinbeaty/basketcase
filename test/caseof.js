
'use strict';
/*globals describe, it, match, eq*/
var caseOf = match.caseOf,
    add = function(a){return function(m){return m+a;};};

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
});

