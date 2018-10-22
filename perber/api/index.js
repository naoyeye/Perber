 // jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2014-05-06 14:57:44
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-10-22 14:17:17
*/


module.exports = API;
var nodemailer = require("nodemailer");

function API (app) {
    console.log('====== API service start ======');

    var mysql = app.get('mysqlClient');
    mysql.query('USE perber', function(error, results) {
        if(error) {
            console.log('mysqlConnectionReady Error: ' + error.message);
            //mysql.end();
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

    // app.configure(function () {
    //     app.use(allowCrossDomain);
    // });

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
                // console.log('HAKULAMATATA!!!')
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

    // for wandoujia doraemon --- 2015-02-09
    // push mail notification for third-party applications
    var pond = [];
    app.post('/api/v1/doraemonpushmail', function(req, res, next) {

        // 如果池子里已经有了这个条目，就不再发送邮件
        for (var i = pond.length - 1; i >= 0; i--) {
            if (pond[i] === req.body.id) {
                console.log('this id already exists');
                return;
            }
        };

        var config = app.get('config');

        res.header('Access-Control-Allow-Origin', req.headers.origin);

        if (req.headers.origin !== 'http://www.wandoujia.com') {
            res.json({status : 'Permission denied!'})
            return;
        }

        nodemailer.createTestAccount((err, account) => {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: config.mailer.user,
                    pass: config.mailer.pass
                }
            });

            if (!req.body.type || !req.body.id) {
                return;
            }

            var mail_text = '出现错误的条目是： ' + req.body.type + ' : ' + req.body.id + ' ，请尽快在 http://www.wandoujia.com/needle/ 中处理。这是一封自动发送的邮件，不要回答！！不要回答！！';

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: "无聊治愈所的一号门神 ✔ <"+ config.mailer.user +">", // sender address
                to: ['hanjiyun@wandoujia.com', 'sunboheng@wandoujia.com'], // list of receivers
                subject: "T_T 无聊治愈所的条目又出问题了", // Subject line
                text: mail_text//, // plaintext body
            }

            // send mail with defined transport object
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                    res.json({status : 'error'})
                }else{
                    console.log("Mail sent: " + response.message);
                    pond.push(req.body.id);
                    res.json({status : 'success'})
                }

                // if you don't want to use this transport object anymore, uncomment following line
                //smtpTransport.close(); // shut down the connection pool, no more messages
            });
        })
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