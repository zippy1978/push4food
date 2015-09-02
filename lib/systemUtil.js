'use strict';
var fs = require('fs');
var os = require('os');
var exec = require('sync-exec');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;

var WLAN_IFACE_NAME = 'wlan0';
var WPA_SUPPLICANT_FILE = '/etc/wpa_supplicant/wpa_supplicant.conf';

var hasGpio = function() {
    return fs.existsSync('/sys/class/gpio');
};

var buildGpio = function(port, direction, edge) {

    if (hasGpio()) {
        return new require('onoff').Gpio(port, direction, edge);    
    } else {

        winston.warn('Current hardware has no GPIO : faking it!');

        // Fake Gpio object if GPIO not supported on current hardware
        return {
            read: function(){},
            readSync: function(){},
            write: function(){},
            writeSync: function(){},
            watch: function(){
                // Fake waiting
                require('net').createServer(function(socket){}).listen(5000);
            },
            unwatch: function(){},
            direction: function(){},
            setDirection: function(){},
            edge: function(){},
            setEdge: function(){},
            unexport: function(){}
        };
    }

};

var getWifiConfig = function() {

    var result = {
        ipAddress: '',
        ssid: ''
    }

    // Get IP
    var ifaces = os.networkInterfaces();
    if (ifaces[WLAN_IFACE_NAME] !== undefined && ifaces[WLAN_IFACE_NAME].length > 0) {
        result.ipAddress = ifaces[WLAN_IFACE_NAME][0].address;
    }

    // FIX ME !
    // Get SSID
    var fileContent = fs.readFileSync(WPA_SUPPLICANT_FILE, {encoding: 'utf8'});
    var match = fileContent.match(/ssid="(.*)"/);
    if (match.length > 1) {
        result.ssid = match[1];
    }
    
    return result;

};

var setWifiConfig = function(config, restart) {

    // Write file
    var fileContent = '';
    fileContent += 'ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n';
    fileContent += 'update_config=1\n';
    fileContent += 'network={\n';
    fileContent += '    ssid="' + config.ssid + '"\n';
    // TODO : maybe encrypt password here !
    fileContent += '    psk="' + config.password + '"\n';
    fileContent += '}\n';

    fs.writeFileSync(WPA_SUPPLICANT_FILE, fileContent);

    // Restart Wifi interface
    if (restart) {
        exec(sprintf('ifdown %s; ifup %s', WLAN_IFACE_NAME, WLAN_IFACE_NAME));
    }


};

module.exports = {
    hasGpio: hasGpio,
    buildGpio: buildGpio,
    getWifiConfig: getWifiConfig,
    setWifiConfig: setWifiConfig
};