module.exports = {
    season: 2018,

    portal_port: 80,
    webhook_port: 4909,

    db: {
        interval: 1000,
        connection_string: "mongodb://127.0.0.1:27017/the-green-alliance",
        collections: {
            matchData: "matches",
            inputLog: "input_log"
        }
    },

    colors: {
        general: 'green',
        webhook: 'cyan',
        bt_worker: 'white',
        error: 'red'
    }
};
