const db = new PouchDB("tga-2018");

db.sync(`http://admin:password@thegreenalliance.local:5984/tga-2018`, {
    live: true,
    retry: true
}).on('paused', function (info) {
    console.log(`Replication Paused: ${JSON.stringify(info)}`);
}).on('active', function (info) {
    console.log(`Replication Resumed: ${JSON.stringify(info)}`);
}).on('error', function (err) {
    console.error(`Replication Error: ${JSON.stringify(err)}`);
});

db.sync(`http://${localStorage.getItem('username')}:${localStorage.getItem('password')}@tga-cloud.team4909.org:5984/tga-2018`, {
    live: true,
    retry: true
}).on('paused', function (info) {
    console.log(`Replication Paused: ${JSON.stringify(info)}`);
}).on('active', function (info) {
    console.log(`Replication Resumed: ${JSON.stringify(info)}`);
}).on('error', function (err) {
    console.error(`Replication Error: ${JSON.stringify(err)}`);
});