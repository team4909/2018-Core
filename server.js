const express = require('express'),
      bodyParser = require('body-parser'),
      
      app = express();

// Handle JSON Body Input
app.use(bodyParser.json()).use(function (error, req, res, next){
    res.end("Uh Oh, Something Broke...")
});

// Handle JSON POST Req, Sent By Py. as Data Flows In
app.post('/', function(req, res){
    // New Data from Tablet
    console.dir(req.body);
    res.end();
});

app.listen(4909);
console.log('Listening at http://localhost:4909')
