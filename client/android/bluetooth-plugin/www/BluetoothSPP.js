var exec = require('cordova/exec');

exports.isConnected = false;

exports.initConnection = function (macAddr, success, error) {
    exec(function () {
        exports.isConnected = true;

        success();
    }, function (err) {
        exports.isConnected = false;

        error(err);
    }, 'BluetoothSPP', 'initConnection', [macAddr]);
};

exports.sendData = function (data, success, error) {
    if (exports.isConnected) {
        exec(function () {
            success();
        }, function (err) {
            exports.isConnected = false;

            error(err);
        }, 'BluetoothSPP', 'sendData', [data]);
    } else {
        error("The Server is not Connected.");
    }
};
