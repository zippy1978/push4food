'use strict';
var util = require('util');
var bleno = require('bleno');

var SSIDBLECharacteristic = require('./ssidBLECharacteristic');
var IPAddressBLECharacteristic = require('./ipAddressBLECharacteristic');
var WPAPasswordBLECharacteristic = require('./wpaPasswordBLECharacteristic');

function NetworkBLEService() {
    bleno.PrimaryService.call(this, {
        uuid: '13333333333333333333333333333337',
        characteristics: [
            new SSIDBLECharacteristic(),
            new IPAddressBLECharacteristic(),
            new WPAPasswordBLECharacteristic()
        ]
    });
}

util.inherits(NetworkBLEService, bleno.PrimaryService);

module.exports = NetworkBLEService;