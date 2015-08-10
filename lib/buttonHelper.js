'use strict';
var exec = require('sync-exec');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;
var systemUtil = require('./systemUtil.js');

var create = function(port, debounceInterval) {
    // Init pullupdown
    initPullUpDown(port);
    
    var button = systemUtil.buildGpio(port, 'in', 'falling');
    button.debounceInterval = debounceInterval;
    
    return button;
};

var clear = function(button) {
    button.unwatch();
    button.unexport();
};

var onPress = function(button, callback) {
    // Watch to detect pressed state
    button.watch(function(err, value) {
        if (value === 0 && callback !== undefined) {
            var pressTime = new Date().getTime();
            
            if (button.pressTime === undefined || (pressTime - button.pressTime) > button.debounceInterval) {
                button.pressTime = pressTime;
                callback();
            }
        }
    });
};

var initPullUpDown = function(port) {
    var result = exec(sprintf('gpio -g mode %s up', port));
   
    if (result.status != 0 && systemUtil.hasGpio()) {
        throw new Error('Unable to configure pullupdown, make sure wiringPi tool is properly installed (http://wiringpi.com/download-and-install/)');
    } else {
        winston.debug(sprintf('GPIO pullup/down configured for button on port %s', port));
    }
};

module.exports = {
    create: create,
    clear: clear,
    onPress: onPress
};
