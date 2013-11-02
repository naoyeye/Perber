
/*
 * Module dependencies
 */

var passport = require('passport'),
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
        if(req.isAuthenticated()){
            client.hmset(
                'users:' + req.user.provider + ":" + req.user.username,
                req.user
            );
            res.redirect('/rooms');
        } else{
            res.render('index');
        }
    });

    /*
    * Authentication routes
    */

    if(config.auth.twitter.consumerkey.length) {
        app.get('/auth/twitter', passport.authenticate('twitter'));

        app.get('/auth/twitter/callback', 
            passport.authenticate('twitter', {
                successRedirect: '/',
                failureRedirect: '/'
            })
        );
    }

    if(config.auth.facebook.clientid.length) {
        app.get('/auth/facebook', passport.authenticate('facebook'));

        app.get('/auth/facebook/callback', 
            passport.authenticate('facebook', {
                successRedirect: '/',
                failureRedirect: '/'
            })
        );
    }

    /* 
    * douban
    */
    if(config.auth.douban.clientid.length) {
        app.get('/auth/douban', passport.authenticate('douban'));

        app.get('/auth/douban/callback', 
            passport.authenticate('douban', {
                successRedirect: '/',
                failureRedirect: '/'
            })
        );
    }

    // app.get('/auth/douban/callback',function(req,res){
    //     var data={
    //             client_id : config.auth.douban.clientid,
    //             client_secret : config.auth.douban.clientsecret,
    //             redirect_uri : config.auth.douban.callback,
    //             grant_type : 'authorization_code',
    //             code : req.query.code
    //         };

    //     request.post('https://www.douban.com/service/auth2/token',{form:data}, function (e, r, body) {
    //     var err_message={
    //             100:'invalid_request_scheme 错误的请求协议',
    //             101:'invalid_request_method 错误的请求方法',
    //             102:'access_token_is_missing 未找到access_token',
    //             103:'invalid_access_token access_token不存在或已被用户删除',
    //             104:'invalid_apikey apikey不存在或已删除',
    //             105:'apikey_is_blocked apikey已被禁用',
    //             106:'access_token_has_expired access_token已过期',
    //             107:'invalid_request_uri 请求地址未注册',
    //             108:'invalid_credencial1 用户未授权访问此数据',
    //             109:'invalid_credencial2 apikey未申请此权限',
    //             110:'not_trial_user 未注册的测试用户',
    //             111:'rate_limit_exceeded1 用户访问速度限制',
    //             112:'rate_limit_exceeded2 IP访问速度限制',
    //             113:'required_parameter_is_missing 缺少参数',
    //             114:'unsupported_grant_type 错误的grant_type',
    //             115:'unsupported_response_type 错误的response_type',
    //             116:'client_secret_mismatch client_secret不匹配',
    //             117:'redirect_uri_mismatch redirect_uri不匹配',
    //             118:'invalid_authorization_code authorization_code不存在或已过期',
    //             119:'invalid_refresh_token refresh_token不存在或已过期',
    //             120:'username_password_mismatch 用户名密码不匹配',
    //             121:'invalid_user 用户不存在或已删除',
    //             122:'user_has_blocked 用户已被屏蔽',
    //             123:'access_token_has_expired_since_password_changed 因用户修改密码而导致access_token过期',
    //             124:'access_token_has_not_expired access_token未过期',
    //             125:'invalid_request_scope 访问的scope不合法，开发者不用太关注，一般不会出现该错误',
    //             999:'unknown 未知错误'
    //         };

    //         var body_jObject=JSON.parse(body);

    //         if(body_jObject.code){
    //                 var code=body_jObject.code;
    //                 console.log(err_message[code]);
    //         }else{

    //             if(body_jObject.access_token){
    //                 var access_token=body_jObject.access_token;
    //                 // console.log(access_token);
    //                 var header={'Authorization':'Bearer '+access_token};

    //                 request.get('https://api.douban.com/v2/user/~me',{headers:header},function (e, r, body) {
    //                     // console.log(body);
    //                     var user = body
    //                     // res.send(body);
    //                     res.redirect('/rooms');
    //                 });
    //             }
    //         }
            
    //     });
    // });

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    /*
   * Rooms list
   */

   app.get('/rooms', utils.restrict, function(req, res) {
    utils.getPublicRoomsInfo(client, function(rooms) {
        res.render('room_list', { rooms: rooms });
    });
});

  /*
   * Create a rooom
   */

   app.post('/create', utils.restrict, function(req, res) {
    utils.validRoomName(req, res, function(roomKey) {
        utils.roomExists(req, res, client, function() {
            utils.createRoom(req, res, client);
        });
    });
});

  /*
   * Join a room
   */

   app.get('/:id', utils.restrict, function(req, res) {
    utils.getRoomInfo(req, res, client, function(room) {
        utils.getUsersInRoom(req, res, client, room, function(users) {
            utils.getPublicRoomsInfo(client, function(rooms) {
                utils.getUserStatus(req.user, client, function(status) {
                    utils.enterRoom(req, res, room, users, rooms, status);
                });
            });
        });
    });
});

}
