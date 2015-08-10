'use strict';
var pjson = require('../package.json');
var ledHelper = require('./ledHelper.js');
var buttonHelper = require('./buttonHelper.js');
var program = require('commander');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;
var stateMachine = require('state-machine');
var moment = require('moment');
var jsonfile = require('jsonfile');
var foodcommander = require('foodcommander');

var PUSH_BLINK_SPEED_MS = 150; // 150ms
var PUSH_BLINK_COUNT = 4;
var SECOND_MS = 1000; // 1sec

var orderTemplate;
var states;
var button, led;
var quantity = 0;
var secondsLeft = 0;
var estimatedDeliveryDate = null;

var errorInterval = null;

var config = null;

var Config = function Config() {
    return {
        buttonPort: 0,
        ledPort: 0,
        orderTemplateFile: null,
        dryrun: false,
        countDownSeconds: 0
    };
};

var start = function(cfg) {
    
    config = cfg;

    winston.info(sprintf('push4food %s is starting', pjson.version));

    if (config.dryrun) {
        winston.info('Running in dryrun mode: no order will be sent!');   
    } else {
        winston.info('Dryrun mode disabled: this is for real baby!');
    }
    
    // Register shutdown hook
    process.on('SIGINT', exit);
    
    // Read order template
    readOrderTemplate(config.orderTemplateFile);

    // Init led and button
    button = buttonHelper.create(config.buttonPort, PUSH_BLINK_SPEED_MS * PUSH_BLINK_COUNT * 2);
    led = ledHelper.create(config.ledPort);

    // Init state machine
    initStates(config);

    // Main loop
    winston.info('Get ready to get fat !');
    buttonHelper.onPress(button, function() {

        states.push();

        if (states.currentState() === 'ordering') {
            ledHelper.blink(led, PUSH_BLINK_COUNT, PUSH_BLINK_SPEED_MS);
            quantity++;
            winston.debug(sprintf('Quantity is now %s!', quantity));
        }

    });

};

/**
 * Stop push4food
 */
var stop = function() {

};

var readOrderTemplate = function(file) {

    orderTemplate = jsonfile.readFileSync(file);
};

var initStates = function(config) {

    states = stateMachine(function () {

        this.state('idle', {initial: true, enter: function() {reset();}})
            .state('ordering', {enter: function() {startOrderCountDown();}})
            .state('waitingForDelivery', {enter: function() {startWaitForDeliveryCountDown();}})
            .state('error', {enter: function() {startErrorIndicator();}})

            .event('push', 'idle', 'ordering')
            .event('push', 'error', 'idle')
            .event('orderPlaced', 'ordering', 'waitingForDelivery')
            .event('orderFailed', 'ordering', 'error')
            .event('orderDelivered', 'waitingForDelivery', 'idle')
        ;
    });
};

var reset = function() {

    quantity = 0;  
    estimatedDeliveryDate = null;
    clearInterval(errorInterval);
    ledHelper.off(led);  
};

var startOrderCountDown = function() {

    secondsLeft = config.countDownSeconds;

    winston.debug(sprintf('Order countdown started, %s second(s) left', secondsLeft));

    // Blink
    ledHelper.blink(led, config.countDownSeconds, SECOND_MS / 2);

    var interval = setInterval(function() {
        secondsLeft--;
        winston.debug(sprintf('%s second(s) left before ordering...', secondsLeft));
    }, SECOND_MS);

    setTimeout(function() {
        clearInterval(interval);
        placeOrder();
    }, program.countdown * SECOND_MS);
};

var placeOrder = function() {
    
    winston.debug('Placing order...');

    var order = {
        address: orderTemplate.address,
        lines: [{
            dish: orderTemplate.dish,
            variant: orderTemplate.variant,
            quantity: quantity
        }],
        comment: orderTemplate.comment
    };

    var orderModule = getFoodcommanderModuleForFranchiseId('order', orderTemplate.franchiseId);

    orderModule.place(order, program.dryrun).then(function(orderConfirmation) {
        
        estimatedDeliveryDate = orderConfirmation.estimatedDeliveryDate;
        states.orderPlaced();
        
    }).fail(function(error) {
        
        winston.error(sprintf('Order failed with error : %s', error));
        states.orderFailed();
        
    });
};

// TODO
// Ugly fix to get rid off !!!
// In order to fix : change the way modules are located /loaded in foodcommander / moduleUtil.js
var getFoodcommanderModuleForFranchiseId = function(module, franchiseId) {
    return require(sprintf('../node_modules/foodcommander/lib/franchises/%s/%s.js', franchiseId, module));
}

var startWaitForDeliveryCountDown = function() {

    ledHelper.on(led);

    if (estimatedDeliveryDate != null) {

        var secondsToGo = moment(estimatedDeliveryDate).diff(moment(), 'seconds');

        winston.debug(sprintf('Waiting for delivery until %s (%s seconds to go)', estimatedDeliveryDate, secondsToGo));

        setTimeout(function() {
            states.orderDelivered();
        }, secondsToGo * SECOND_MS);


    } else {
        states.orderDelivered();
    }
};

var startErrorIndicator = function() {

    errorInterval = setInterval(function() {
        ledHelper.blink(led, 4, SECOND_MS / 8);
    }, SECOND_MS);
};

var exit = function() {

    winston.info('Exiting...');
    buttonHelper.clear(button);
    ledHelper.clear(led);
    process.exit();
};

module.exports = {
    Config: Config,
    start: start,
    stop: stop
};
