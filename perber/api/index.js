 // jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2014-05-06 14:57:44
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-05-07 20:50:25
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

    app.get('/api', function(req, res, next) {
        res.render('api');
    });

    app.all('/api/v1/*', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    // new one
    app.post('/api/v1/new', function(req, res, next) {

        res.setHeader('content-type', 'application/json');
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");

        var strQuery = '';

        console.log('req ========= ', req.params);

        // var song = [];

        // song.title = req.body.song.title || null;

        var coolData = [
            req.body.msg
        ]

        mysql.query('INSERT INTO Messages SET message = ?', coolData, function selectCb(error, results, fields) {
            if (error) {
                sendError(res, 503, 'error', 'connection', error);
            } else {
                console.log('HAKULAMATATA!!!')
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