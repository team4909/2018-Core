var exec = require('cordova/exec');

exports.initConnection = function(macAddr, success, error) {
  exec(success, error, 'BluetoothSPP', 'initConnection', [macAddr]);
};

exports.sendData = function(data, success, error) {
  exec(success, error, 'BluetoothSPP', 'sendData', [data]);
};