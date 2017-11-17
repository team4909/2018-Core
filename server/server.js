const express = require('express'),
      bodyParser = require('body-parser'),
      
      MongoClient = require('mongodb').MongoClient,
      
      app = express();

var matchResults = [];

// Handle JSON Body Input
app.use(bodyParser.json()).use(function (error, req, res, next){
    res.end("Uh Oh, Something Broke...")
});

// Handle JSON POST Req, Sent By Py. as Data Flows In
app.post('/new_data', function(req, res){
    // New Data from Tablet
    console.log("=====");
    console.log("New Data:");
    console.dir(req.body);
    
    const data = req.body.msg_data.msg;
 
    data.mac = req.body.client_mac;
    data.device = req.body.thread_id;
    data.event = "botb";
    data.competition = 2017;
    
    matchResults.push(data);
    console.dir(data);
    
    res.end();
});

app.post('/bad_data', function(req, res){
    // New Data from Tablet
    console.log("=====");
    console.log("Bad Data:");
    console.dir(req.body);
    res.end();
});

app.post('/new_connection', function(req, res){
    // New Data from Tablet
    console.log("=====");
    console.log("New Connection:");
    console.dir(req.body);
    res.end();
});

app.post('/lost_connection', function(req, res){
    // New Data from Tablet
    console.log("=====");
    console.log("Lost Connection:");
    console.dir(req.body);
    res.end();
});

app.listen(4909);
console.log('Listening at http://localhost:4909')

MongoClient.connect("mongodb://127.0.0.1:27017/FRC-Scouting", function(err, db) {
                    console.error(err);
    const matchData = db.collection("matches");

    setInterval(function() {
        console.dir(matchResults);
        
        if(matchResults.length > 0){
            curMatchResults = matchResults.slice();
        console.dir(curMatchResults);
            matchResults = [];

            matchData.insertMany(curMatchResults, function(err, r) {
                if(err != null){
                    console.error(err);
                    matchResults = matchResults.concat(curMatchResults);
                }
            });
        }
    }, 2500);
});