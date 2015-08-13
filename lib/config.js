'use strict';

function Config() {
    return {
        buttonPort: 0,
        ledPort: 0,
        orderTemplateFile: null,
        dryrun: false,
        countDownSeconds: 0
    };
};

module.exports = Config;