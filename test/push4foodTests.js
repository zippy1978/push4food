'use strict';
var assert = require('assert');
var push4food = require('../lib/push4food.js');

describe('push4food node module', function () {
  it('must access led module as submodule', function () {
     assert.notEqual(null, push4food.led);
      
  });
    
  it('must access button module as submodule', function () {
     assert.notEqual(null, push4food.button);
      
  });
});
