#!/usr/bin/env node

const colors = require('colors'),
    program = require('commander'),

    config = require('./config'),
    input_server = require('./input_server'),

    MongoClient = require('mongodb').MongoClient,

    app = require('express')(),
    bodyParser = require('body-parser'),
    {
        spawn
    } = require('child_process');

var matchResults = [],
    dataEntryLog = [],

    event_key = "N/A";

colors.setTheme(config.console_colors);

program
    .version('0.0.1')
    .option('--no-bluetooth', 'Disable Bluetooth Worker')
    .parse(process.argv);

input_server({
    config: config,
    bt_worker: program.bluetooth
});

function input_server(options) {
    // Silently Ignore Incorrect JSON Input
    app.use(bodyParser.json()).use(function (error, req, res, next) {
        res.end();
    });

    // Handle JSON POST Req, Sent By Py. as Data Flows In
    app.post('/msg', function (req, res) {
        const msg_data = req.body.msg_data;

        res.end();
    });

    app.listen(options.config.webhook_port);
    console.log(`Webhook: Listening at http://localhost:${options.config.webhook_port}`.webhook)

    if (options.bt_worker != false) {
        const btworker = spawn('sudo', ['python3', 'bt_worker.py']);

        btworker.stdout.on('data', (data) => {
            console.log(`BT Worker: ${data}`.bt_worker);
        });

        btworker.stderr.on('data', (data) => {
            console.error(`BT Worker: Error ${data}`.error);
        });

        btworker.on('close', (code) => {
            console.log(`BT Worker: Exited with code ${code}`.bt_worker);
        });
    } else {
        console.log(`BT Worker: Disabled`.bt_worker);
    }
}
