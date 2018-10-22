 // jshint ignore:start 

/*
 * Module dependencies.
 */

var log = require('debug')('perber:config'),
        express = require('express'),
        redis = require('redis'),
        passport = require('passport'),
        path = require('path'),
        url = require('url'),
        config = {},
        env = require('./env'),
        qiniu = require('qiniu'),
        nodeQiniu = require('node-qiniu'),
        utils = require('../utils');

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
// var RedisStore = require('connect-redis')(session)
var socketSession = require('socketio-session');
var serveStatic = require('serve-static')
var morgan = require('morgan')

var logger = morgan('combined')

socketSession.initializeRedis(session);


function Config (app) {
    // log("Attempt to load from config.json")
    try {
        config = require('./config.json');
        // console.log('Loaded from config.json %j', config);
    } catch (err) {
        console.log("Failed to load file config.json %j", err);
    }

    // log('Attemp to load from environment');
    utils.merge(config, env);

    // log('Save configuration values in app %j', config);
    app.set('config', config);

    // log('Setting port as %d', config.app.port);
    app.set('port', config.app.port);

    // log('Setting view engine as %s', 'jade');
    app.set('view engine', 'jade');

// mysql
// ==========
    app.set('mysqlConf', config.mysqlConf);

    var mysqlConfig = Object.assign({}, config.mysqlConf);

    var mysqlClient = require('mysql').createPool(mysqlConfig);

    app.set('mysqlClient', mysqlClient);

    console.log('====== Connected to MySQL automatically ======');


// qiniu
// ==========

    // node qiniu
    nodeQiniu.config({
        access_key: config.qiniuConfig.access_key,
        secret_key: config.qiniuConfig.secret_key
    });
    var imagesBucket = nodeQiniu.bucket(config.qiniuConfig.bucket_name);

    app.set('imagesBucket', imagesBucket);

    // qiniu
    qiniu.conf.ACCESS_KEY = config.qiniuConfig.access_key
    qiniu.conf.SECRET_KEY = config.qiniuConfig.secret_key


// redis
// ==========
    // log('Setting redisURL', config.redisURL);
    app.set('redisConf', config.redisConf);

    // log('Opening a redis mysql connection');
    // This should be moved to a db.js module
    // var redisConfig = url.parse(config.redisConf);
    var redisConfig = config.redisConf.url
    var redisClient = redis.createClient(redisConfig.port, redisConfig.host);
  
    redisClient.on('error', function(err) {
        console.log('Error connecting to redis %j', err);
    }).on('connect', function() {
        console.log('====== Connected to redis. ======');
    }).on('ready', function() {
        console.log('====== Redis mysql ready. ======');
    });

    if (redisConfig.auth) {
        // auth 1st part is username and 2nd is password separated by ":"
        redisClient.auth(redisConfig.auth.split(':')[1]);
    };

    // log('Saving redisClient connection in app');
    app.set('redisClient', redisClient);

    // log('Creating and saving a session store instance with redis mysql.');
    // var sessionStore = session({
    //     store: new RedisStore({mysql: redisClient, url:'redis://' + redisClient.host}),
    //     // secret: config.session.secret,
    //     cookie: { secure: false },
    //     secret: config.session.secret,
    //     key: config.session.key,
    //     // store: app.get('sessionStore'),
    //     resave: true,
    //     saveUninitialized: true
    // })
    var sessionStore = session({
      store : socketSession.getRedisStore(),
      secret : config.session.secret,
      resave : true,
      saveUninitialized : true,
      key : config.session.key
    })
    app.set('sessionStore', sessionStore);
    app.use(sessionStore);


    // app.use(session({
    //     store: new RedisStore({mysql: redisClient, url:'redis://' + redisClient.host}),
    //     secret: config.session.secret
    // }));



    // log('Setting views lookup root path.');
    app.set('views', path.join(__dirname, '..', '/views/themes/', config.theme.name));

    // log('Setting static files lookup root path.');
    app.use(serveStatic(path.join(__dirname, '..', '/public')));

    if (config.debug === true) {
        console.log('====== express debug enabled ======');
        logger = morgan('dev')
    }

    app.use(logger);

    // log('Use of express body parser middleware.');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(cookieParser(config.session.secret));
    // app.use(session({
    //     secret: config.session.secret,
    //     key: config.session.key,
    //     store: app.get('sessionStore'),
    //     resave: false,
    //     saveUninitialized: true
    // }));
  
    // log('Use of passport middlewares.');
    app.use(passport.initialize());
    app.use(passport.session());

    // log('Use of express router.');
    // app.use(app.router);
}
// /* jshint ignore:end */

module.exports = Config;