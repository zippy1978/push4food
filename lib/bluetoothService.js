'use strict';
var bleno = require('bleno');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;

var NetworkBLEService = require('./ble/networkBLEService');

var SERVICE_NAME = 'push4food';

function BluetoothService() {

    this._networkBLEService = new NetworkBLEService();

};

BluetoothService.prototype.start = function() {
    
    var self = this;

    winston.info('Starting Bluetooth');


    bleno.on('stateChange', function(state) {
        
        if (state === 'poweredOn') {

            bleno.startAdvertising(SERVICE_NAME, [self._networkBLEService.uuid], function(err) {
                if (err) {
                    winston.error(err);
                }
            });
        }
        else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('advertisingStart', function(err) {
        
        if (!err) {
            
            winston.info('Bluetooth (BLE) started');
            
            bleno.setServices([
                self._networkBLEService
            ]);
        } else {
            winston.error(err);
        }
    });
    
    bleno.on('advertisingStartError', function(err) {
        winston.error(err);
    });
    
    bleno.on('accept', function(clientAddress) {
        winston.info(sprintf("BLE accepted connection from %s", clientAddress));
    });
    

}

BluetoothService.prototype.stop = function() {
};


module.exports = BluetoothService;