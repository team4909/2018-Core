const exec = require('cordova/exec');

var cache = {
    _cache: [],
    add: function (data) {
        this._cache.push(data);
    },
    get: function () {
        return this._cache.splice(0);
    }
};

module.exports = {
    isConnected: false,

    initConnection: function (macAddr, success, error) {
        exec(function () {
            exports.isConnected = true;

            for (data of cache.get()) {
                bluetooth.sendData(data);
            }

            success();
        }, function (err) {
            exports.isConnected = false;

            error(err);
        }, 'BluetoothSPP', 'initConnection', [macAddr]);
    },
    sendData: function (data, success, error) {
        if (exports.isConnected) {
            exec(function () {
                success();
            }, function (err) {
                exports.isConnected = false;

                cache.add(data);

                error(err);
            }, 'BluetoothSPP', 'sendData', [data]);
        } else {
            error("The Server is not Connected.");
        }
    }
};
