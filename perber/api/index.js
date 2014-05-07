 // jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2014-05-06 14:57:44
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-05-07 21:14:27
*/


module.exports = API;

function API (app) {
    console.log('====== API service start ======');

    var mysql = app.get('mysqlClient');
    mysql.query('USE perber', function(error, results) {
        if(error) {
            console.log('mysqlConnectionReady Error: ' + error.message);
            mysql.end();
            return;
        }
        console.log('====== socketio MySQL Connected!! ======')
    });

    var allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
        next();
    }

    app.configure(function () {
        app.use(allowCrossDomain);
    });

    app.options('/api/v1/*', function(req, res){
        res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
        res.send(200);
    });

    // api home
    app.get('/api', function(req, res, next) {
        res.render('api');
    });

    // new one
    app.post('/api/v1/new', function(req, res, next) {

        res.header('Access-Control-Allow-Origin', req.headers.origin);

        var coolData = [
            req.body.msg
        ]

        mysql.query('INSERT INTO Messages SET message = ?', coolData, function selectCb(error, results, fields) {
            if (error) {
                sendError(res, 503, 'error', 'connection', error);
            } else {
                console.log('HAKULAMATATA!!!')
                res.contentType('json');
                res.send({
                    result      : 'success',
                    err         : '',
                    err_type    : '',
                    // fields      : objFields,
                    // rows        : objRows,
                    // length      : objRows.length
                });
            }

        });

    });


}

/**
 * sendError is the JSON we use to send information about errors to the client-side.
 *     We need to check on the client-side for errors.
 */
function sendError(objResponse, iStatusCode, strResult,  strType, objError) {
    // I could throw errors at the HTTP response level, but I want to trap handled errors in my code instead
    //objResponse.statusCode = iStatusCode;
    objResponse.status = objError.code;
    objResponse.send({
        result      : strResult,
        err         : objError.code,
        err_type    : strType
    });
}
// /* jshint ignore:end */