#!/usr/bin/env node

const app = require('express')(),
    bodyParser = require('body-parser'),
    nano = require('nano')('http://localhost:5984'),
    db = nano.db.use('tga-2018');

// Silently Ignore Incorrect JSON Input
app.use(bodyParser.json()).use(function (error, req, res, next) {
    res.end();
});

// Handle JSON POST Req, Sent By Py. as Data Flows In
app.post('/new_msg', function (req, res) {
    console.log("New Data:");
    console.dir(req.body);

    db.insert(req.body, req.body._id, function (err, body, header) {
        if (err) {
            console.log("Error" + err.message);
        } else {
            console.log("Success");
        }
    });
    
    res.end();
});

app.listen(4909);
console.log(`Webhook: Listening at http://localhost:4909`);
