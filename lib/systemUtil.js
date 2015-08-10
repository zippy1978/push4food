'use strict';
var fs = require('fs');
var winston = require('winston');

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

module.exports = {
    hasGpio: hasGpio,
    buildGpio: buildGpio
};