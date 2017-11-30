const MongoClient = require('mongodb').MongoClient,

    app = require('express')(),
    bodyParser = require('body-parser'),
    {
        spawn
    } = require('child_process');

var matchResults = [],
    dataEntryLog = [],

    event_key = "N/A";

module.exports = function (options) {
    // Silently Ignore Incorrect JSON Input
    app.use(bodyParser.json()).use(function (error, req, res, next) {
        res.end();
    });

    // Handle JSON POST Req, Sent By Py. as Data Flows In
    app.post('/msg', function (req, res) {
        // Handle Msg Metadata
        const msg_data = req.body.msg_data;
        msg_data.type = req.body.msg_type;
        msg_data.input_device = req.body.client_mac;
        msg_data.season = config.season;

        // Handle Change of Event Key, Only Affects New Data
        if (msg_data.type == "New_Event_Key")
            event_key = msg_data.event_key;

        // Set Event Key
        msg_data.event_key = event_key;

        // Push All Logs of Entry
        dataEntryLog.push(msg_data);

        // Switch based on Msg Type
        switch (msg_data.type) {
            // Push Match Record to DB
            case "New_Match_Record":
                matchResults.push(msg_data);
                break;

                // TODO: Trigger Warning in Portal for Connection Loss
            case "New_Connection":
                break;
            case "Lost_Connection":
                break;
        }

        res.end();
    });

    app.listen(options.config.webhook_port);
    console.log(`Webhook: Listening at http://localhost:${options.config.webhook_port}`.webhook)

    MongoClient.connect(options.config.db.connection_string, function (err, db) {
        if (err) {
            console.error(`Webhook: Error ${err}`.error);
            return;
        }

        const matchData = db.collection(options.config.db.collections.matchData),
            inputLog = db.collection(options.config.db.collections.inputLog);

        setInterval(function () {
            function processData(dataArray, dbCollection) {
                if (dataArray.length > 0) {
                    currentArray = dataArray.splice(0);

                    dbCollection.insertMany(currentArray, function (err, r) {
                        if (err != null) {
                            console.error(`Webhook: Error ${err}`.error);
                            dataArray = dataArray.concat(currentArray);
                        }
                    });
                }
            }

            processData(matchResults, matchData);
            processData(dataEntryLog, inputLog);
        }, options.config.db.interval);
    });


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
