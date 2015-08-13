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

function CoreService(config) {
    
    this._config = config;
    this._orderTemplate = null;
    this._states = null;
    this._button = null;
    this._led = null;
    this._quantity = null;
    this._secondsLeft = null;
    this._estimatedDeliveryDate = null;
    this._errorInterval = null;
};

CoreService.prototype.start = function() {
    
    var self = this;

    winston.info(sprintf('push4food %s is starting', pjson.version));

    if (this._config.dryrun) {
        winston.info('Running in dryrun mode: no order will be sent!');   
    } else {
        winston.info('Dryrun mode disabled: this is for real baby!');
    }
    
    // Register shutdown hook
    process.on('SIGINT', function() {
        winston.info('Exiting...');
        buttonHelper.clear(self._button);
        ledHelper.clear(self._led);
        process.exit();
    });
    
    // Read order template
    this._readOrderTemplate(this._config.orderTemplateFile);

    // Init led and button
    this._button = buttonHelper.create(this._config.buttonPort, PUSH_BLINK_SPEED_MS * PUSH_BLINK_COUNT * 2);
    this._led = ledHelper.create(this._config.ledPort);

    // Init state machine
    this._initStates();

    // Main loop
    winston.info('Get ready to get fat !');

    buttonHelper.onPress(this._button, function() {

        self._states.push();

        if (self._states.currentState() === 'ordering') {
            ledHelper.blink(self._led, PUSH_BLINK_COUNT, PUSH_BLINK_SPEED_MS);
            self._quantity++;
            winston.debug(sprintf('Quantity is now %s!', self._quantity));
        }

    });

};

CoreService.prototype.stop = function() {

    winston.info('Stopping');
    buttonHelper.clear(this._button);
    ledHelper.clear(this._led);
};

CoreService.prototype._readOrderTemplate = function(file) {

    this._orderTemplate = jsonfile.readFileSync(file);
};

CoreService.prototype._initStates = function() {

    var self = this;
    
    this._states = stateMachine(function () {

        this.state('idle', {initial: true, enter: function() {self._reset();}})
            .state('ordering', {enter: function() {self._startOrderCountDown();}})
            .state('waitingForDelivery', {enter: function() {self._startWaitForDeliveryCountDown();}})
            .state('error', {enter: function() {self._startErrorIndicator();}})

            .event('push', 'idle', 'ordering')
            .event('push', 'error', 'idle')
            .event('orderPlaced', 'ordering', 'waitingForDelivery')
            .event('orderFailed', 'ordering', 'error')
            .event('orderDelivered', 'waitingForDelivery', 'idle')
        ;
    });
};

CoreService.prototype._reset = function() {

    this._quantity = 0;  
    this._estimatedDeliveryDate = null;
    clearInterval(this._errorInterval);
    ledHelper.off(this._led);  
};

CoreService.prototype._startOrderCountDown = function() {
    
    var self = this;

    this._secondsLeft = this._config.countDownSeconds;

    winston.debug(sprintf('Order countdown started, %s second(s) left', this._secondsLeft));

    // Blink
    ledHelper.blink(this._led, this._config.countDownSeconds, SECOND_MS / 2);

    var interval = setInterval(function() {
        self._secondsLeft--;
        winston.debug(sprintf('%s second(s) left before ordering...', self._secondsLeft));
    }, SECOND_MS);

    setTimeout(function() {
        clearInterval(interval);
        self._placeOrder();
    }, this._config.countDownSeconds * SECOND_MS);
};

// TODO : fix foodcommander : it must return if store is closed !!! (rejecting is not enough !!)
CoreService.prototype._placeOrder = function() {
    
    var self = this;
    
    winston.debug('Placing order...');

    var order = {
        address: this._orderTemplate.address,
        lines: [{
            dish: this._orderTemplate.dish,
            variant: this._orderTemplate.variant,
            quantity: this._quantity
        }],
        comment: this._orderTemplate.comment
    };

    var orderModule = this._getFoodcommanderModuleForFranchiseId('order', this._orderTemplate.franchiseId);

    orderModule.place(order, this._config.dryrun).then(function(orderConfirmation) {
        
        self._estimatedDeliveryDate = orderConfirmation.estimatedDeliveryDate;
        self._states.orderPlaced();
        
    }).fail(function(error) {
        
        winston.error(sprintf('Order failed with error : %s', error));
        self._states.orderFailed();
        
    });
};

// TODO
// Ugly fix to get rid off !!!
// In order to fix : change the way modules are located /loaded in foodcommander / moduleUtil.js
CoreService.prototype._getFoodcommanderModuleForFranchiseId = function(module, franchiseId) {
    return require(sprintf('../node_modules/foodcommander/lib/franchises/%s/%s.js', franchiseId, module));
}

CoreService.prototype._startWaitForDeliveryCountDown = function() {
    
    var self = this;

    ledHelper.on(this._led);

    if (this._estimatedDeliveryDate != null) {

        var secondsToGo = moment(this._estimatedDeliveryDate).diff(moment(), 'seconds');

        winston.debug(sprintf('Waiting for delivery until %s (%s seconds to go)', this._estimatedDeliveryDate, secondsToGo));

        setTimeout(function() {
            self._states.orderDelivered();
        }, secondsToGo * SECOND_MS);


    } else {
        this._states.orderDelivered();
    }
};

CoreService.prototype._startErrorIndicator = function() {
    
    var self = this;

    this._errorInterval = setInterval(function() {
        ledHelper.blink(self._led, 4, SECOND_MS / 8);
    }, SECOND_MS);
};

module.exports = CoreService;
