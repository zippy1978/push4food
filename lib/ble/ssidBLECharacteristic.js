'use strict';
var util = require('util');
var bleno = require('bleno');
var winston = require('winston');

var systemUtil = require('../systemUtil.js');

function SSIDBLECharacteristic() {

    bleno.Characteristic.call(this, {
        uuid: '13333333333333333333333333330001',
        properties: ['read', 'write'],
        descriptors: [
            new bleno.Descriptor({
                uuid: '2901',
                value: 'Gets or sets the Wifi SSID.'
            })
        ]
    });

}

util.inherits(SSIDBLECharacteristic, bleno.Characteristic);

SSIDBLECharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {

    if(data.length > 0) {
        systemUtil.setWifiConfig({ssid: data.toString('utf8'), password: ''}, false);
        callback(this.RESULT_SUCCESS)
    } else {
        callback(this.RESULT_UNLIKELY_ERROR);
    }

};

SSIDBLECharacteristic.prototype.onReadRequest = function(offset, callback) {

    if (offset) {
        callback(this.RESULT_ATTR_NOT_LONG, null);
    }
    else {
        callback(this.RESULT_SUCCESS, new Buffer(systemUtil.getWifiConfig().ssid));
    }

};

module.exports = SSIDBLECharacteristic;