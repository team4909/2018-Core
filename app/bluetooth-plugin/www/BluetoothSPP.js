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

var prevMacAddr = "";

module.exports = {
    initConnection: function (macAddr, success, error) {
        prevMacAddr = macAddr;
        
        exec(function (msg) {
            for (data of cache.get()) {
                bluetooth.sendRawData(data);
            }

            success(`Connected to server: ${msg}`);
        }, function (err) {
            error(`Could not connect to server: ${err}`);
        }, 'BluetoothSPP', 'initConnection', [macAddr]);
    },
    sendRawData: function (data, success, error) {
        exec(success, function (err) {
            cache.add(data);
        }, 'BluetoothSPP', 'sendData', [data]);
    },
    sendData: function (data, success, error) {
        exec(success, function (err) {
            cache.add(data);

            bluetooth.initConnection(prevMacAddr, success, error)
        }, 'BluetoothSPP', 'sendData', [data]);
    }
};
