// jshint ignore:start 
/* 
* @Author: hanjiyun
* @Date:   2013-12-16 00:43:01
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-06-13 11:33:08
*/




/*
* Module dependencies
*/

var sio = require('socket.io'),
    parseCookies = require('connect').utils.parseSignedCookies,
    cookie = require('cookie');

var stepify = require('stepify');



// +=====Xiami======
var http = require('http');
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


    // xiami
    var isXiamiSong = /www.xiami.com\/song\/\d+/;

    var sidPattern = /(\d+)/,
        songUrlPattern = /a href="(\/song\/\d+)"/g;

    var titlePattern = /<div id="title">\s*<h1>(.*)<\/h1>/,
        artistPattern = /<a href="\/artist\/\d+" title=".*">(.*)<\/a>/,
        coverPattern = /<img class="cdCDcover185" src=".*" \/>/;


    // 用来记录用户的动作 目前只是记录发言动作
    var address_list = {};

    var io;

    if (config.debug === true) {
        console.log('====== socket.io debug enabled ======');
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
    setInterval(cleaner, 60000 * config.app.timer);

    function cleaner(){
        address_list = {};
        console.log(new Date().format("yyyy-MM-dd hh:mm:ss"));
        console.log('clean done!', address_list);
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

    io.set('authorization', function (hsData, accept) {
        if(hsData.headers.cookie) {
            var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret),
            sid = cookies[config.session.key];

            sessionStore.load(sid, function(err, session) {
                if(err || !session) {
                    return accept('Error retrieving session!', false);
                }
                // console.log('session', session)
                // console.log(' session.passport ' , session.passport)

                hsData.perber = {
                    user: session.passport.user,
                    room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
                };

                return accept(null, true);

            });
        } else {

            // console.log('No cookie transmitted!!')
            return accept('No cookie transmitted.', false);
        }
    });

    // var l =  io.sockets.clients().filter(function(s) {return !s.disconnected;}).length;
    // console.log(l)

    io.configure(function() {
        io.set('store',
            new sio.RedisStore({
                redisClient: client,
                redisPub: client,
                redisSub: client
            })
        );
        io.enable('browser client minification');
        io.enable('browser client gzip');
    });

// connection
    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake,
            // nickname = hs.perber.user.username,
            nickname = '' // todo: random

            // provider = hs.perber.user.provider,
            provider = '' // todo:random

            userKey = provider + ":" + nickname,
            room_id = hs.perber.room,
            now = new Date();

        socket.join(room_id);


        // Mysql Connected
        mysql.query('USE perber', function(error, results) {
            if(error) {
                console.log('mysqlConnectionReady Error: ' + error.message);
                mysql.end();
                return;
            }
            console.log('====== socketio MySQL Connected!! ======')
        });


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


        // 判断某字符串是否在数组中
        // 暂时没用到
            // function inList(needle, array, bool){  
            //     if(typeof needle=="string"||typeof needle=="number"){
            //         for(var i in array){
            //             if(needle===array[i]){
            //                 if(bool){
            //                     return i;
            //                 }
            //                 return true;
            //             }
            //         }
            //         return false;
            //     }  
            // }


        // xiamiHandle start
        function getMp3Location(str) {
            try {
                var a1 = parseInt(str.charAt(0)),
                    a2 = str.substring(1),
                    a3 = Math.floor(a2.length / a1),
                    a4 = a2.length % a1,
                    a5 = [],
                    a6 = 0,
                    a7 = '',
                    a8 = '';
                for (; a6 < a4; ++a6) {
                    a5[a6] = a2.substr((a3 + 1) * a6, (a3 + 1));
                }
                for (; a6 < a1; ++a6) {
                    a5[a6] = a2.substr(a3 * (a6 - a4) + (a3 + 1) * a4, a3);
                }
                for (var i = 0,a5_0_length = a5[0].length; i < a5_0_length; ++i) {
                    for (var j = 0,a5_length = a5.length; j < a5_length; ++j) {
                        a7 += a5[j].charAt(i);
                    }
                }
                a7 = decodeURIComponent(a7);
                for (var i = 0,a7_length = a7.length; i < a7_length; ++i) {
                    a8 += a7.charAt(i) === '^' ? '0': a7.charAt(i);
                }
                return a8;
            } catch(e) {
                return false;
            }
        }

        function xiamiParse(pageUrl, root, location) {
            
            var sid = sidPattern.exec(pageUrl)[1];
            var options = url.parse('http://www.xiami.com/song/playlist/id/'+ sid +'/object_name/default/object_id/0');
            var xiamiRealSong = {};

            http.get(options, function(res) {
                res.setEncoding('utf8');

                var xml = '';

                res.on('data', function(data) {
                    xml += data;
                    // console.log('xml on data = ', xml)
                })

                res.on('end', function() {
                    console.log('xml end = ', xml);
                    xmlreader.read(xml, function(errors, res){
                        if(null !== errors ){
                            console.log('errors', errors)
                            return;
                        }

                        // console.log('res.playlist.trackList.track', res.playlist.trackList.track)
                        // console.log(decodeURIComponent(res.playlist.trackList.track.title.text()))

                        xiamiRealSong.title = toTxt(res.playlist.trackList.track.title.text());
                        xiamiRealSong.artist =  toTxt(res.playlist.trackList.track.artist.text());
                        xiamiRealSong.album = toTxt(res.playlist.trackList.track.album_name.text());
                        xiamiRealSong.location = getMp3Location(res.playlist.trackList.track.location.text());

                        // 封面处理
                        var cover;
                        var coverpath = res.playlist.trackList.track.pic.text();
                        var coverReg = /http:\/\/[a-zA-Z0-9-.-\/-_]+.(jpg|jpeg|png|gif|bmp)/g;

                        // 正则替换小的封面为大封面
                        if(coverReg.test(coverpath)){
                            coverpath.replace(coverReg, function(s,value) {
                                cover = s.replace('_1', '');
                            });
                        }
                        xiamiRealSong.cover =  cover;

                        // console.log('xiamiRealSong', xiamiRealSong)

                        // 得到歌曲信息，传递给 step 4;
                        root.done(null, xiamiRealSong, location);

                    });

                })
            })
        }

        function xiamiRun(pageUrl, root, location){
            if (isXiamiSong.test(pageUrl)) {
                xiamiParse(pageUrl, root, location);
            }
        }
        // xiamiHandle end


        // new message
        socket.on('my msg', function(data) {

            // get ip
            var address = hs.headers['x-forwarded-for'] || hs.address.address;
            // var address = '106.186.112.11'; // for test

            var msgID,
                isSong = false;


            // ======总流程控制======
            var Handle = stepify()
            // step 1: 发言限制
            .step( function(){
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
                        // come on die young!!
                        console.log(new Date().format("yyyy-MM-dd hh:mm:ss"));
                        console.log('come on die young!!')

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
                var taobaoip = url.parse('http://ip.taobao.com/service/getIpInfo.php?ip='+ address);

                var root = this;

                var location;

                http.get(taobaoip, function(res) {
                    res.setEncoding('utf8');
                    var json = '';
                    res.on('data', function(req) {
                        if( req.code === 1) return;

                        json += req;
                        json = JSON.parse(json);
                        // location为所在地
                        // 文档见 http://ip.taobao.com/instructions.php
                        // 如果 city 得不到，则取 country
                        if( json.data.city.length === 0 ){
                            location = json.data.country;
                        } else {
                            location = json.data.city;
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
                    // 需要同时把 root 和 location 都传给 xiamiRun()
                    // 以便回调时 step 4 能接收到这俩参数
                    xiamiRun(data.msg, root, location);
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
                        data.song.artist,
                        data.song.album,
                        data.song.cover,
                        data.song.location,
                        location,
                        address
                    ]

                mysql.query('INSERT INTO Messages SET message = ?, music_title = ?, music_artist = ?, music_album = ?, music_cover = ?, music_location = ?, location = ?, address = ?', coolData, function(error, results) {
                    if(error) {
                        console.log("mysql INSERT Error: " + error.message);
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
                                console.log("mysql INSERT image key Error: " + error.message);
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
                        console.log('从数据库删除图片')
                        console.log("mysql delete Image Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                });

                // 从qiniu删除图片
                imagesBucket.key(data.imgKey).remove(
                    function(err) {
                        if (err) {
                            console.log('从qiniu删除图片出错')
                            console.log(err)
                        }
                    }
                );
            }

            mysql.query('DELETE FROM Messages WHERE id = ?', data.id, function(error, results) {
                if(error) {
                    console.log("mysql delete Error: " + error.message);
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
                    console.log('GetData Error: ' + error.message);
                    mysql.end();
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

            // mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
            //     if (error) {  
            //         console.log('GetData Error: ' + error.message);
            //         // mysql.end();
            //         return;
            //     }

            //    // if(results.length > 0){
            //         // results.forEach(function(line, index) {
            //         //     history.push(line);
            //         // });
            //         socket.emit('new vote', {
            //             result: results[0]
            //         });
            //    // }
            // });



            // mysql.end();
            // console.log('Connection closed');

        });


    // vote // TODO need clean
        // socket.on('my vote', function(data) {
        //     if(data.vote === 'up'){
        //         mysql.query('UPDATE vote SET up = up+1', function(error, results) {
        //             if(error) {
        //                 console.log("mysql INSERT Error: " + error.message);
        //                 // mysql.end();
        //                 return;
        //             }
        //             // console.log('results', results)
        //         })
        //     } else if(data.vote === 'down'){
        //         mysql.query('UPDATE vote SET down = down+1', function(error, results) {
        //             if(error) {
        //                 console.log("mysql INSERT Error: " + error.message);
        //                 // mysql.end();
        //                 return;
        //             }
        //             // console.log('results', results)
        //         })
        //     }

        //     // 去数据库查询最新的投票结果
        //     mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
        //         if (error) {  
        //             console.log('GetData Error: ' + error.message);
        //             mysql.end();
        //             return;
        //         }
        //         // console.log('results:', results[0]);
        //         // 向前端返回投票信息
        //         io.sockets.in(room_id).emit('new vote', {
        //             result: results[0]
        //         });
        //     });
        // })

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