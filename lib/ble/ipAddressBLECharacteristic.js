'use strict';
var util = require('util');
var bleno = require('bleno');
var winston = require('winston');

var systemUtil = require('../systemUtil.js');

function IPAddressBLECharacteristic() {

    bleno.Characteristic.call(this, {
        uuid: '13333333333333333333333333330002',
        properties: ['read'],
        descriptors: [
            new bleno.Descriptor({
                uuid: '2901',
                value: 'Gets the Wifi IP address.'
            })
        ]
    });

}

util.inherits(IPAddressBLECharacteristic, bleno.Characteristic);

IPAddressBLECharacteristic.prototype.onReadRequest = function(offset, callback) {

    if (offset) {
        callback(this.RESULT_ATTR_NOT_LONG, null);
    } else {
        callback(this.RESULT_SUCCESS, new Buffer(systemUtil.getWifiConfig().ipAddress));
    }

};

module.exports = IPAddressBLECharacteristic;