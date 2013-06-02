/*jshint strict:false*/
match = require('..');
eq = function eq(one, two){
  if(!match.guard.equal(one)(two)){
    console.log(one);
    console.log(two);
    throw new Error(one+' != '+two);
  }
};
