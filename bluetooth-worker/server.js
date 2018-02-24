#!/usr/bin/env node

const app = require('express')(),
	bodyParser = require('body-parser'),
	{
		spawn
	} = require('child_process');

const nano = require('nano')('http://localhost:5984'),
    db = nano.db.use('tga-2018');

input_server();

function input_server() {
	// Silently Ignore Incorrect JSON Input
	app.use(bodyParser.json()).use(function(error, req, res, next) {
		res.end();
	});

	// Handle JSON POST Req, Sent By Py. as Data Flows In
	app.post('/new_msg ', function(req, res) {
		const msg_data = req.body.msg_data;
        
        db.insert(msg_data);
        
		res.end();
	});

	app.listen(4909);
	console.log(`Webhook: Listening at http://localhost:4909`)

	const btworker = spawn('sudo', ['/usr/bin/python3', '/home/pi/the-green-alliance/bluetooth-worker/bluetooth-worker.py']);

	btworker.stdout.on('data', (data) => {
		console.log(`BT Worker: ${data}`);
	});

	btworker.stderr.on('data', (data) => {
		console.log(`BT Worker: Exited with error ${data}`);
        process.exit(-1);
	});

	btworker.on('close', (code) => {
		console.log(`BT Worker: Exited with code ${code}`);
        process.exit(-1);
	});
}
