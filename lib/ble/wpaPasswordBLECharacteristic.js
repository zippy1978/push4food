'use strict';
var util = require('util');
var bleno = require('bleno');
var winston = require('winston');

var systemUtil = require('../systemUtil.js');

function WPAPasswordBLECharacteristic() {

    bleno.Characteristic.call(this, {
        uuid: '13333333333333333333333333330003',
        properties: ['write'],
        descriptors: [
            new bleno.Descriptor({
                uuid: '2901',
                value: 'Sets the Wifi password.'
            })
        ]
    });

}

util.inherits(WPAPasswordBLECharacteristic, bleno.Characteristic);

WPAPasswordBLECharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {

    if(data.length > 0) {
        var config = systemUtil.getWifiConfig();
        systemUtil.setWifiConfig({ssid: config.ssid, password: data.toString('utf8')}, true);
        callback(this.RESULT_SUCCESS)
    } else {
        callback(this.RESULT_UNLIKELY_ERROR);
    }

};

module.exports = WPAPasswordBLECharacteristic;