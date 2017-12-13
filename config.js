module.exports = {
    portal_port: 80,
    webhook_port: 4909,

    internal_db: "tga-matches-2018",

    local_db: {
        host: "thegreenalliance.local",
        port: "5984",
        database: "tga-matches-2018",

        username: "the-green-alliance",
        password: "the-green-alliance"
    },

    remote_db: {
        host: "thegreenalliance-db.roshanravi.com",
        port: "5984",
        database: "the-green-alliance"
    },

    console_colors: {
        general: 'green',
        webhook: 'cyan',
        bt_worker: 'white',
        error: 'red'
    }
};
