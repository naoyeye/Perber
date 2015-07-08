// jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2013-12-16 00:41:38
* @Last Modified by:   Jiyun
* @Last Modified time: 2015-07-08 14:27:29
*/



/*
 * Module dependencies
 */

var express = require('express'),
    init = require('./init');

/*
 * Create and config server
 */

var app = exports.app = express();


app.set('view engine', 'jade');
app.use(express.favicon(__dirname + '/public/img/favicon.png')); 

/**
 * Configure application
 */

require('./config')(app);

/*
 * Clean db and create folder
 */

init(app.get('redisClient'));

/*
 * Passportjs auth strategy
 */

// require('./strategy')(app);


/*
 * Routes
 */

require('./routes')(app);


/*
 * API
*/

require('./api')(app);


/*
 * Web server
 */

if(app.get('config').credentials) {
    exports.server = require('https').createServer(app.get('config').credentials, app).listen(app.get('port'), function() {
        console.log('Perber started on port %d', app.get('port'));
    });
} else {
    exports.server = require('http').createServer(app).listen(app.get('port'), function() {
        console.log('Perber started on port %d', app.get('port'));
    });
}

/*
 * Socket.io
 */

require('./sockets')(app, exports.server);


/*
 * Catch uncaught exceptions
 */

process.on('uncaughtException', function(err){
    console.log('Exception: ' + err.stack);
});
// /* jshint ignore:end */