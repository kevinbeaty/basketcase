'use strict';

var _ = require('lodash'),
    match = require('./lib/match'),
    caseOf = require('./lib/caseof'),
    guard = require('./lib/guard'),
    imply = require('./lib/imply'),
    method = require('./lib/multimethod');

module.exports = exports = match;
_.extend(exports, {
  _:_,
  caseOf:caseOf,
  guard:guard,
  imply:imply,
  method:method
});

