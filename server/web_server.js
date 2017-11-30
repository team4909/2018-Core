const express = require('express'),
    serveStatic = require('serve-static'),

    app = express();

module.exports = function (options) {
    app.use(serveStatic('www', {
        'index': ['index.html']
    }));

    app.listen(options.config.portal_port);
    console.log(`Portal: Listening at http://thegreenalliance.local:${options.config.portal_port}`.general)
}
