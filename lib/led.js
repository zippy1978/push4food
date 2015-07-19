'use strict';
var Gpio = require('onoff').Gpio;

var create = function(port) {
    return new Gpio(port, 'out');
};

var clear = function(led) {
    led.unexport();
};

var blink = function(led, count, speed) {

    led.writeSync(1);
    
    var interval = setInterval(function() {
        led.writeSync(led.readSync() ^ 1);
    }, speed);

    setTimeout(function() {
        clearInterval(interval);
        led.writeSync(0);
    }, speed * count * 2);
};

var on = function(led) {
    led.writeSync(1);
};

var off = function(led) {
    led.writeSync(0);
};

module.exports = {
    create: create,
    clear: clear,
    blink: blink,
    on: on,
    off: off
};
