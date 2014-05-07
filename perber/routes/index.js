// jshint ignore:start
/* 
* @Author: hanjiyun
* @Date:   2013-11-03 04:47:51
* @Email:  jiyun@han.im
* @Last modified by:   hanjiyun
* @Last Modified time: 2014-05-06 16:30:59
*/


/*
* Module dependencies
*/

var utils = require('../utils');
var fs = require('fs');
var qiniu = require('qiniu');
var nodemailer = require("nodemailer");

/**
 * Expose routes
 */

module.exports = Routes;

/**
 * Defines routes for application
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Routes (app, server) {
    var config = app.get('config');
    var client = app.get('redisClient');
    var mysql = app.get('mysqlClient');
    var imagesBucket = app.get('imagesBucket');

    /*
    * mailer config
    */
    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
            user: config.mailer.user,
            pass: config.mailer.pass
        }
    });



    // index
    app.get('/', function(req, res, next) {
        res.render('room', { bucket_name: config.qiniuConfig.bucket_name });
    });


    // delete image
    app.post('/delete', function(req, res, next){
        var key = req.body.key;

        var imgKey = [key];

        // 先去数据库里查询此图片key是不是存在, 防止恶意批量删除
        mysql.query( 'SELECT * FROM Images WHERE imgKey = ?', imgKey, function selectCb(error, results, fields) {
            if (error) {  
                console.log('GetData Error: ' + error.message);
                mysql.end();
                return;
            }

            // console.log('results:', results);

            if(results.length > 0) return;

            imagesBucket.key(key).remove(
                function(err) {
                    if (err) {
                        res.json({status:'err', message: err})
                    } else {
                        res.json({status:'success'})
                    }
                }
            );
        });

    });

    // 七牛得到token
    app.post('/sign', function(req, res, next){
        // console.log(req.body)
        var bucketname = config.qiniuConfig.bucket_name;
        var putPolicy = new qiniu.rs.PutPolicy(bucketname);
        var token = putPolicy.token();
        res.json({token : token})
    })

    // 申请展示位发送邮件
    app.post('/apply', function(req, res, next){
        var mail_text;
        var m_name = req.body.name,
            m_email = req.body.email;

        var mailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/g;


        if(m_name.length > 20) return;
        if(!mailReg.test(m_email)) return;
        if(m_email === '' || m_email.lenth < 1) return;

        if (req.body.name == ''){
            mail_text = "email:" + m_email;
        } else {
            mail_text = "name:" + m_name + ", email:" + m_email
        }

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "Perber ✔ <"+ config.mailer.user +">", // sender address
            to: config.mailer.receiver, // list of receivers
            subject: "Hello, Someone apply for Perber! ✔", // Subject line
            text: mail_text//, // plaintext body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
                res.json({status : 'error'})
            }else{
                console.log("Mail sent: " + response.message);
                res.json({status : 'success'})
            }

            // if you don't want to use this transport object anymore, uncomment following line
            //smtpTransport.close(); // shut down the connection pool, no more messages
        });
    })
}
// jshint ignore:end 