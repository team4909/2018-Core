const config = {
    portal_port: 80,
    webhook_port: 4909,

    database: {
        matches: "tga-matches-testing",
        schedule: "tga-schedule-testing"
    },

    local_db: {
        host: "thegreenalliance.local",
        port: "5984"
    },

    remote_db: {
        host: "tga-cloud.team4909.com",
        port: "5984",

        console_colors: {
            general: 'green',
            webhook: 'cyan',
            bt_worker: 'white',
            error: 'red'
        }
    }
};

if (typeof module != "undefined") module.exports = config;
