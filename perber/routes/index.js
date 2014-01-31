/* 
* @Author: hanjiyun
* @Date:   2013-11-03 04:47:51
* @Email:  jiyun@han.im
* @Last modified by:   hanjiyun
* @Last Modified time: 2014-01-31 22:16:04
*/


/*
* Module dependencies
*/

var /*passport = require('passport'),*/
    utils = require('../utils');

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

function Routes (app) {
    var config = app.get('config');
    var client = app.get('redisClient');
  
/*
* Homepage
*/

app.get('/', function(req, res, next) {
    res.render('room');
});


}
