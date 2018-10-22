// jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2013-12-16 00:43:01
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-10-22 21:47:32
*/




/*
* Module dependencies
*/

var app = require('express')();
var server = require('http').Server(app);
var sio = require('socket.io')(server);

// var sio = require('socket.io');
    // parseCookies = require('connect').utils.parseSignedCookies,

var cookie = require('cookie');

var stepify = require('stepify');
var cookieParser = require('cookie-parser');
var socketSession = require('socketio-session');
var parseCookies = cookieParser;


// +=====Xiami======
var http = require('http');
var https = require('https');
var url = require('url');
var path = require('path');
var xmlreader = require('xmlreader');



// +=====Socket======
/**
* Expose Sockets initialization
*/

module.exports = Sockets;

/**
* Socket.io
*
* @param {Express} app `Express` instance.
* @param {HTTPServer} server `http` server instance.
* @api public
*/



function Sockets (app, server) {
    var config = app.get('config');
    var client = app.get('redisClient');
    var mysql = app.get('mysqlClient');
    var sessionStore = app.get('sessionStore'); // redis
    var imagesBucket = app.get('imagesBucket');


    // 用来记录用户的动作 目前只是记录发言动作
    var address_list = {};

    var io;

    if (config.debug === true) {
        // console.log('====== socket.io debug enabled ======');
        // // 0 - error, 1 - warn, 2 - info, 3 - debug
        io = sio.listen(server, {
            log: true,
            'debug' : true,
            'log level' : 3
        });
    } else {
        io = sio.listen(server,{
            log: false,
            'debug': false,
            // 'log level' : 0
        });
    }

    // TODO: online number
    // var count = 0;

    Date.prototype.format = function(format){
        var o = {
            "M+" : this.getMonth()+1, //month
            "d+" : this.getDate(), //day
            "h+" : this.getHours(), //hour
            "m+" : this.getMinutes(), //minute
            "s+" : this.getSeconds(), //second
            "q+" : Math.floor((this.getMonth()+3)/3), //quarter
            "S" : this.getMilliseconds() //millisecond
        }

        if(/(y+)/.test(format)) format=format.replace(RegExp.$1,(this.getFullYear()+"").substr(4- RegExp.$1.length));
        for(var k in o)if(new RegExp("("+ k +")").test(format))
            format = format.replace(RegExp.$1,RegExp.$1.length==1? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        return format;
    }

    // 清理工
    // 定时运行一次清理程序
    // todo 用schedule实现
    setInterval(cleaner, 60000 * config.app.timer);

    function cleaner(){
        address_list = {};
        // console.log(new Date().format("yyyy-MM-dd hh:mm:ss"));
        // console.log('clean done!', address_list);
    }

    // 过滤转义字符
    function toTxt(str){
        var RexStr = /(&lt;|&gt;|&quot;|&#39;|&#039;|&amp;)/g;
        str = str.replace(RexStr,
            function(MatchStr){
                switch(MatchStr){
                    case "&lt;":
                        return "<";
                        break;
                    case "&gt;":
                        return ">";
                        break;
                    case "&quot;":
                        return '\"';
                        break;
                    case "&#39;":
                        return "'";
                        break;
                    case "&#039;":
                        return "'";
                        break;
                    case "&amp;":
                        return "&";
                        break;
                    default :
                        break;
                }
            }
        )
        return str;
    }

    function parseCookie(cookie){
        var cookies = {};
        cookie.split(';').forEach(function(cookie){
            var parts = cookie.split('=');
            cookies[parts[0].trim()] = (parts[1] || '').trim();
        });
        return cookies;
    }

    io.use(function(socket, next){
        // console.log('socket = ', socket)
        var hsData = socket.request;
        socketSession.parseCookieViaArgs(config.session.secret, config.session.key, socket, function(session){
            // console.log(session); // and we have our session :)

            //code for authenticating the user
            if(!session) {
                next('Error retrieving session!', false);
            }

            let room = /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]

            // console.log('room - ', room)

            hsData.perber = {
                user: session.passport.user,
                room: room
            };
            next(null, true);
        });
    });

    // io.set('authorization', function (hsData, accept) {

    // old
        // io.use(function(socket, next) {
        //     var hsData = socket.request;
        //     if(hsData.headers.cookie) {
        //         var cookies = parseCookie(hsData.headers.cookie);
        //         // var parsedCookie = cookie.parse(hsData.headers.cookie);
        //         // var sid = parseCookies.signedCookie(parsedCookie['connect.sid'], config.session.secret);
        //         // var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret),
        //         var sid = cookies[config.session.key];

        //         console.log('sid - ', sid)

        //         if(!cookie){
        //             return accept('No cookie transmitted.', false);
        //         }

        //         // console.log('sessionStore = ', sessionStore)

        //         sessionStore.load(sid, function(err, session) {
        //             console.log('err = ', err, 'session =- ', session)
        //             if(err || !session) {
        //                 return accept('Error retrieving session!', false);
        //             }
        //             console.log('session', session)
        //             console.log(' session.passport ' , session.passport)

        //             hsData.perber = {
        //                 user: session.passport.user,
        //                 room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
        //             };

        //             return accept(null, true);

        //         });
        //     } else {
        //         console.log('No cookie transmitted!!')
        //         return accept('No cookie transmitted.', false);
        //     }
        // });

    // io.configure(function() {
    //     io.set('store',
    //         new sio.RedisStore({
    //             redisClient: client,
    //             redisPub: client,
    //             redisSub: client
    //         })
    //     );
    //     io.enable('browser client minification');
    //     io.enable('browser client gzip');
    // });

// connection
    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake,
            socketRequest = socket.request,
            // nickname = hs.perber.user.username,
            nickname = '' // todo: random

            // provider = hs.perber.user.provider,
            provider = '' // todo:random

            userKey = provider + ":" + nickname;


        var room_id = socketRequest.perber.room;
        var now = new Date();

        socket.join(room_id);


        client.sadd('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, socketAdded) {

            // console.log('socketAdded!!!')

            if(socketAdded) {
                client.sadd('socketio:sockets', socket.id);
                client.sadd('rooms:' + room_id + ':online', userKey, function(err, userAdded) {
                    if(userAdded) {
                        client.hincrby('rooms:' + room_id + ':info', 'online', 1);

                        client.get('users:' + userKey + ':status', function(err, status) {

                            // count = count + 1;
                            // console.log('new', count)
                            // io.sockets.in(room_id).emit('update online', {
                            //     count: count,
                            //     action: 'add'
                            // });

                            io.sockets.in(room_id).emit('new user', {
                                nickname: nickname,
                                // avatar: avatar,
                                // provider: provider,
                                status: status || 'available'
                            });
                        });

                        // client.scard('rooms:' + room_id + ':info', '', function(err, how_many) {
                        //     console.log('add how_many', how_many)
                        //     io.sockets.in(room_id).emit('update online', {
                        //         count: how_many,
                        //         action: 'add'
                        //     });
                        // })

                        // console.log('added!!')
                    }
                });
            }
        });


        // new message
        socket.on('my msg', function(data) {
            // get ip
            // var address = '106.186.112.11'; // for test
            // 取 nginx 代理的
            var address = socket.handshake.headers["x-real-ip"]

            // 本地开发的时候，需要过滤一下
            address = address.replace('::ffff:', '')

            var msgID,
                isSong = false;


            // ======总流程控制======
            var Handle = stepify()
            // step 1: 发言限制
            .step(function(){
                // 判断是不是已经有过动作
                if( address_list[address] ) {
                    // console.log('已经在列表里!!');

                    // 判断是不是超过了次数
                    if(address_list[address].action < config.app.limit){
                        // 如果没超过次数，则给次数 +1
                        address_list[address].action = address_list[address].action + 1;
                        // console.log('当前用户的最新行为次数是：', address_list[address].action);

                        this.done();

                    } else {
                        // 不做处理，针对此 id 返回警告提示
                        io.sockets.socket(socket.id).emit('limited someone', {
                            address: address
                        });
                        return;
                        this.done();
                    }
                } else {
                    // console.log('没在列表里，需要添加到列表！')
                    address_list[address] = { "action" : 1 }
                    // console.log('address_list =', address_list)
                    this.done();
                }
            })
            // step 2: 获取IP详细信息 用的是淘宝的服务
            .step(function(){

                // var qqip = url.parse();
                var root = this;
                var location = '未知';
                https.get(`https://apis.map.qq.com/ws/location/v1/ip?ip=${address}&key=${config.qqMap.key}`, function(res) {
                    res.setEncoding('utf8');
                    var json = '';
                    res.on('data', function(req) {
                        if ( req.code === 1) {
                            root.done(null, '未知');
                        };

                        json += req;

                        json = JSON.parse(json);

                        if (json.status === 0) {
                            // 如果 city 得不到，则取 nation
                            if(json.result && json.result.ad_info && !json.result.ad_info.city && json.result.ad_info.nation){
                                location = json.result.ad_info.nation;
                            } else if (json.result && json.result.ad_info && json.result.ad_info.city) {
                                location = json.result.ad_info.city;
                            } else {
                                location = '未知'; // :P
                            }
                        } else {
                            location = '未知'; // :P
                        }

                        root.done(null, location); // 传递参数 location 到 step 3
                    })
                })
            })
            // step 3: 检查是否是虾米音乐
            .step(function(location){
                var root = this;

                if(data.song === true){
                    isSong = true;

                    var xiamiRealSong = {};
                    
                    // 第三方服务
                    var xiaiFactory = url.parse('https://xiamirun.leanapp.cn/api?url='+ data.msg);

                    https.get(xiaiFactory, function(res) {
                        res.setEncoding('utf8');
                        var json = '';
                        res.on('data', function(req) {
                            if (req.status === 1) return;
                            
                            xiamiRealSong = JSON.parse(req);
                            if (xiamiRealSong.success) {
                                root.done(null, xiamiRealSong, location);
                            } else {
                                root.done(null, {}, location);
                            }
                        })
                    })
                    // root.done(null, xiamiRealSong, location);
                } else {
                    var xiamiRealSong = {}
                    // 如果不是音乐，则设定 xiamiRealSong 为空，和 location 一起传给 step 4
                    root.done(null, xiamiRealSong, location);
                }
            })
            // step 4: 把之前得到的数据汇总、整理，入库，返回
            .step(function(xiamiRealSong, location){

                data.song = xiamiRealSong;

                var coolData = [
                        data.msg,
                        data.song.title,
                        data.song.artists,
                        data.song.albumTitle,
                        data.song.coverURL,
                        data.song.url,
                        location,
                        address
                    ];

                mysql.query('INSERT INTO Messages SET message = ?, music_title = ?, music_artist = ?, music_album = ?, music_cover = ?, music_location = ?, location = ?, address = ?', coolData, function(error, results) {
                    if(error) {
                        // console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }

                    msgID = results.insertId;

                    // 如果带有qiniu图片key, 往图片表里增加记录
                    if(data.imgKey){
                        var imgKey = data.imgKey;
                        var sql = [imgKey, msgID];
                        mysql.query('INSERT INTO Images SET imgKey = ?, msgID = ?', sql, function(error, results) {
                            if(error) {
                                // console.log("mysql INSERT image key Error: " + error.message);
                                // mysql.end();
                                return;
                            }
                        })
                    }

                    io.sockets.in(room_id).emit('new msg', {
                        id: msgID,
                        msg: data.msg,
                        song: xiamiRealSong,
                        location : location,
                        address : address,
                        time: new Date()
                    });
                });
                
                // ok ! done!
                this.done();
            })
            .run();

        });



        // delete message
        socket.on('delete message', function(data) {

            // console.log('data = ', data);

            // 判断是不是带有imgKey
            if(data.imgKey){

                var command = [data.id, data.imgKey];

                // 从数据库删除图片
                mysql.query('DELETE FROM Images WHERE msgID = ? and imgKey = ?', command, function(error, results) {
                    if(error) {
                        // console.log('从数据库删除图片')
                        // console.log("mysql delete Image Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                });

                // 从qiniu删除图片
                imagesBucket.key(data.imgKey).remove(
                    function(err) {
                        if (err) {
                            // console.log('从qiniu删除图片出错')
                            // console.log(err)
                        }
                    }
                );
            }

            mysql.query('DELETE FROM Messages WHERE id = ?', data.id, function(error, results) {
                if(error) {
                    // console.log("mysql delete Error: " + error.message);
                    // mysql.end();
                    return;
                }
                io.sockets.in(room_id).emit('message deleted', {
                    id: data.id
                });
            });

        });


    // history message
        socket.on('history request', function() {

            var history = [];

            // todo // limit 500
            mysql.query( 'SELECT * FROM Messages ORDER BY id DESC LIMIT 500', function selectCb(error, results, fields) {
                if (error) {  
                    // console.log('GetData Error: ' + error.message);
                    //mysql.end();
                    return;
                }

               // if(results.length > 0){
                    // results.forEach(function(line, index) {
                    //     history.push(line);
                    // });
                    socket.emit('history response', {
                        history: results
                    });
               // }
            });

            // 检查投票
            mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
                if (error) {  
                    // console.log('GetData Error: ' + error.message);
                    // mysql.end();
                    return;
                }

               // if(results.length > 0){
                    // results.forEach(function(line, index) {
                    //     history.push(line);
                    // });
                    socket.emit('new vote', {
                        result: results[0]
                    });
               // }
            });



            // mysql.end();
            // console.log('Connection closed');

        });


    // vote // TODO need clean
        socket.on('my vote', function(data) {
            if(data.vote === 'up'){
                mysql.query('UPDATE vote SET up = up+1', function(error, results) {
                    if(error) {
                        // console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                    // console.log('results', results)
                })
            } else if(data.vote === 'down'){
                mysql.query('UPDATE vote SET down = down+1', function(error, results) {
                    if(error) {
                        // console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                    // console.log('results', results)
                })
            }

            // 去数据库查询最新的投票结果
            mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
                if (error) {  
                    // console.log('GetData Error: ' + error.message);
                    //mysql.end();
                    return;
                }

                // console.log('results', results);
                // console.log('results:', results[0]);
                // 向前端返回投票信息
                io.sockets.in(room_id).emit('new vote', {
                    result: results[0]
                });
            });
        })

    // disconnect
        socket.on('disconnect', function() {
            // console.log('disconnect!!!')
            
          // 'sockets:at:' + room_id + ':for:' + userKey
            client.srem('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, removed) {
                if(removed) {

                    client.srem('socketio:sockets', socket.id);
                    client.scard('sockets:for:' + userKey + ':at:' + room_id, function(err, members_no) {

                        // console.log('members_no', members_no)


                        if(!members_no) {
                            client.srem('rooms:' + room_id + ':online', userKey, function(err, removed) {
                                if (removed) {
                                    client.hincrby('rooms:' + room_id + ':info', 'online', -1);

                                    

                                    // count = count - 1;
                                    // console.log('leave', count)
                                    // io.sockets.in(room_id).emit('update online', {
                                    //     count: count,
                                    //     action: 'remove'
                                    // });
                                    // console.log(client.hincrby)

                                    // io.sockets.in(room_id).emit('user leave', {
                                    //     nickname: nickname,
                                    //     // avatar: avatar,
                                    //     provider: provider
                                    // });


                                    // client.scard('sockets:for:' + userKey + ':at:' + room_id, function(err, how_many) {
                                    //     console.log('leave how_many', how_many)
                                    //     io.sockets.in(room_id).emit('update online', {
                                    //         count: how_many,
                                    //         action: 'remove'
                                    //     });
                                    // })
                                }
                            });
                        }
                    });

                    // client.scard('sockets:for:' + userKey + ':at:' + room_id,function(err, how_many) {
                    //     console.log('leave how_many', how_many)
                    // })

                }
            });
        });
    });
};


// /* jshint ignore:end */