const db = new PouchDB(config.internal_db);

const db_utils = {
    syncDatabase: function (database_credentials) {
        const creds = database_credentials;

        db.sync(`http://${creds.username}:${creds.password}@${creds.host}:${creds.port}/${creds.database}`, {
            live: true,
            retry: true
        }).on('paused', function (info) {
            console.log(`Replication Paused: ${JSON.stringify(info)}`);
        }).on('active', function (info) {
            console.log(`Replication Resumed: ${JSON.stringify(info)}`);
        }).on('error', function (err) {
            console.err(`Replication Error: ${JSON.stringify(err)}`);
        });
    }
};

db_utils.syncDatabase(config.local_db);

const remote_db = config.remote_db;
remote_db.username = localStorage.getItem('username');
remote_db.password = localStorage.getItem('password');

db_utils.syncDatabase(remote_db);
