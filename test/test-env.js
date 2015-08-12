var path = require('path');

var config = {
};

function TestEnv() {

    this.server = {
        plugins:{
            'covistra-system': {
                clock: {
                    nowTs: function() {
                        return 1;
                    }
                }
            }
        }
    };
    this.log = {
        debug: console.log.bind(console),
        warn: console.log.bind(console)
    };
    this.config = {
        get: function(key) {

        }
    };
}

TestEnv.prototype.require = function(modulePath) {
    return require(path.resolve(__dirname, "..", modulePath));
};

module.exports = new TestEnv();
