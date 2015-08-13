'use strict';
var bleno = require('bleno');
var winston = require('winston');

function BluetoothService() {
    
};

BluetoothService.prototype.start = function() {
    
  winston.info('Starting Bluetooth');

    var uuid = 'e2c56db5dffb48d2b060d0f5a71096e0';
    var major = 0; // 0x0000 - 0xffff
    var minor = 0; // 0x0000 - 0xffff
    var measuredPower = -59; // -128 - 127

    bleno.startAdvertisingIBeacon(uuid, major, minor, measuredPower);
}

BluetoothService.prototype.stop = function() {
};


module.exports = BluetoothService;