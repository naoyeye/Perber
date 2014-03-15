/* 
* @Author: hanjiyun
* @Date:   2013-12-16 00:43:01
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-03-15 15:28:28
*/




/*
* Module dependencies
*/

var sio = require('socket.io'),
    parseCookies = require('connect').utils.parseSignedCookies,
    cookie = require('cookie');//,
    // xiami = require('./xiami');



// +=====Xiami======
var http = require('http');
var url = require('url');
var path = require('path');
var xmlreader = require("xmlreader");

var isXiamiSong = /www.xiami.com\/song\/\d+/;

var sidPattern = /(\d+)/,
    songUrlPattern = /a href="(\/song\/\d+)"/g;

var titlePattern = /<div id="title">\s*<h1>(.*)<\/h1>/,
    artistPattern = /<a href="\/artist\/\d+" title=".*">(.*)<\/a>/,
    coverPattern = /<img class="cdCDcover185" src=".*" \/>/;






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

    var io = sio.listen(server,{
        log: false,
        // 'debug': false,
        // 'log level' : 0
        // 0 - error, 1 - warn, 2 - info, 3 - debug
    });

    var count = 0;

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
            now = new Date(),


        socket.join(room_id);


        // Mysql Connected
        mysql.query('USE perber', function(error, results) {
            if(error) {
                console.log('mysqlConnectionReady Error: ' + error.message);
                mysql.end();
                return;
            }
            // console.log('MySQL Connected!!')
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


// xiamiHandle start
        function safeFilename(value) {
            return value.replace(/(\/|\\|\:|\*|\?|\"|\<|\>|\||\s+)/g, ' ');
        }

        function safeFilter(value) {
            return safeFilename(removeSpan(value));
        }

        function removeSpan(value) {
            return value.replace('<span>', ' ').replace('</span>', '');
        }

        function getLocation(str) {
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

        function xiamiParse(pageUrl) {
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
                    // console.log('xml end = ', xml)
                    xmlreader.read(xml, function(errors, res){
                        if(null !== errors ){
                            console.log('errors', errors)
                            return;
                        }

                        // console.log('res.playlist.trackList.track', res.playlist.trackList.track)
                        // console.log(decodeURIComponent(res.playlist.trackList.track.title.text()))

                        xiamiRealSong['title'] = res.playlist.trackList.track.title.text();
                        xiamiRealSong['artist'] =  res.playlist.trackList.track.artist.text();
                        xiamiRealSong['album'] = res.playlist.trackList.track.album_name.text();
                        xiamiRealSong['location'] = getLocation(res.playlist.trackList.track.location.text());

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
                        xiamiRealSong['cover'] =  cover;

                        // console.log('xiamiRealSong', xiamiRealSong)
                        //至此，已得到全部了歌曲信息

                        // 往数据库中插入
                        var data = [
                            pageUrl,
                            xiamiRealSong.title,
                            xiamiRealSong.artist,
                            xiamiRealSong.album,
                            xiamiRealSong.cover,
                            xiamiRealSong.location
                        ]
                        mysql.query('INSERT INTO Messages SET message = ?, music_title = ?, music_artist = ?, music_album = ?, music_cover = ?, music_location = ?', data, function(error, results) {
                            if(error) {
                                console.log("mysql INSERT Error: " + error.message);
                                // mysql.end();
                                return;
                            }

                            var msgID = results.insertId;

                            // 向前端返回歌曲信息
                            io.sockets.in(room_id).emit('new song', {
                                id: msgID,
                                song: xiamiRealSong,
                                songOriginal : pageUrl,
                                time: new Date()
                            });
                        })
                    });

                })
            })
        }

        function xiamiRun(pageUrl){
            if (isXiamiSong.test(pageUrl)) {
                xiamiParse(pageUrl)
            }
        }
// xiamiHandle end


// new message
        socket.on('my msg', function(data) {

            var no_empty = data.msg.replace("\n","");
            var msgID,
                havaImg = false;
                isSong = false;

            if(data.imgKey){
                havaImg = true;
            }

            /*
            ===================
            !!!!IMPORTANT!!!!
            ===================
            */

            // 歌曲类的信息交由 xiamiRun(data.msg) 处理
            // 这部分的逻辑太乱了 TAT
            if(data.song === true){
                isSong = true;
                // xiami url parse
                xiamiRun(data.msg);

            } else {
                // 这里只处理不是歌曲的信息(文字、图片)

                var chatlogRegistry = [data.msg]
                var imgKey = data.imgKey;

                mysql.query('INSERT INTO Messages SET message = ?', chatlogRegistry, function(error, results) {
                    if(error) {
                        console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }

                    msgID = results.insertId;

                    // 如果带有qiniu图片key, 往图片表里增加记录
                    if(havaImg){
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
                        time: new Date()
                    });
                });
            }
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

            mysql.query('DELETE FROM Messages WHERE id = ? and retained = 0', data.id, function(error, results) {
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

            mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
                if (error) {  
                    console.log('GetData Error: ' + error.message);
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


    // 新投票
        socket.on('my vote', function(data) {
            if(data.vote === 'up'){
                mysql.query('UPDATE vote SET up = up+1', function(error, results) {
                    if(error) {
                        console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                    // console.log('results', results)
                })
            } else if(data.vote === 'down'){
                mysql.query('UPDATE vote SET down = down+1', function(error, results) {
                    if(error) {
                        console.log("mysql INSERT Error: " + error.message);
                        // mysql.end();
                        return;
                    }
                    // console.log('results', results)
                })
            }

            // 去数据库查询最新的投票结果
            mysql.query( 'SELECT * FROM vote WHERE id = 1', function selectCb(error, results, fields) {
                if (error) {  
                    console.log('GetData Error: ' + error.message);
                    mysql.end();
                    return;
                }
                // console.log('results:', results[0]);
                // 向前端返回投票信息
                io.sockets.in(room_id).emit('new vote', {
                    result: results[0]
                });
            });
        })

    // 断开连接
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


