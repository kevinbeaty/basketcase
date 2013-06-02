'use strict';

var _ = require('lodash'),
    match = require('./match'),
    caseOf = require('./caseof'),
    guard = require('./guard'),
    imply = require('./imply'),
    method = require('./multimethod');

module.exports = exports = match;
_.extend(exports, {
  _:_,
  caseOf:caseOf,
  guard:guard,
  imply:imply,
  method:method
});

