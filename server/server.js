#!/usr/bin/env node

const colors = require('colors'),
    program = require('commander'),

    config = require('./config'),
    input_server = require('./input_server'),
    web_server = require('./web_server');

colors.setTheme(config.colors);

program
    .version('0.0.1')
    .option('--no-bluetooth', 'Disable Bluetooth Worker')
    .parse(process.argv);

input_server({
    config: config,
    bt_worker: program.bluetooth
});

web_server({
    config: config
});
