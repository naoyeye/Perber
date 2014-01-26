/* 
* @Author: hanjiyun
* @Date:   2013-12-16 00:43:01
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-01-22 23:15:43
*/




/*
* Module dependencies
*/

var sio = require('socket.io'),
    parseCookies = require('connect').utils.parseSignedCookies,
    cookie = require('cookie'),
    fs = require('fs');

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
    var sessionStore = app.get('sessionStore');

    var io = sio.listen(server,{
        log: false,
        // 'debug': false,
        // 'log level' : 0
        // 0 - error, 1 - warn, 2 - info, 3 - debug
    });

    io.set('authorization', function (hsData, accept) {
        if(hsData.headers.cookie) {
            var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret),
            sid = cookies['perber'];

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

            // avatar = hs.perber.user.avatar,
            // avatar = ''

            userKey = provider + ":" + nickname,
            room_id = hs.perber.room,
            now = new Date(),


            // Chat Log handler
            // need change to sql

            chatlogFileName = './chats/' + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt";
            chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});

            // console.log(chatlogWriteStream)

        socket.join(room_id);

        client.sadd('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, socketAdded) {
            if(socketAdded) {
                client.sadd('socketio:sockets', socket.id);
                client.sadd('rooms:' + room_id + ':online', userKey, function(err, userAdded) {
                    if(userAdded) {
                        client.hincrby('rooms:' + room_id + ':info', 'online', 1);

                        client.get('users:' + userKey + ':status', function(err, status) {
                            io.sockets.in(room_id).emit('new user', {
                                nickname: nickname,
                                // avatar: avatar,
                                // provider: provider,
                                status: status || 'available'
                            });
                        });
                    }
                });
            }
        });

// new message
        socket.on('my msg', function(data) {
            var no_empty = data.msg.replace("\n","");
            var id = 0;
            if(no_empty.length > 0) {
                var chatlogRegistry = {
                    id : id+1,
                    // type: 'message',
                    from: userKey,
                    atTime: new Date(),
                    withData: data.msg
                }

                // 存入文本
                // todo: save to sql

                chatlogWriteStream.write(JSON.stringify(chatlogRegistry) + "\n");

                io.sockets.in(room_id).emit('new msg', {
                    nickname: nickname,
                    provider: provider,
                    msg: data.msg
                });
            }
        });

// delete message
        socket.on('delete message', function(data) {
            console.log('delete message!!!')
        });


// history message
        socket.on('history request', function() {

            var history = [];
            // var tail = require('child_process').spawn('tac', [chatlogFileName]);
            var tail = require('child_process').spawn('tail', ['-r', chatlogFileName]);


            // console.log('have a history request======!')
            // console.log(tail)
            // console.log('======!')

            // todo 
            tail.stdout.on('data', function (data) {
                // console.log('===start===!')
                // console.log('data:', data.length)
                // console.log('===end===!')

                var lines = data.toString('utf-8').split("\n");

                // console.log(lines.length)

                // for(var i=0; i<lines.length; i++){
                lines.forEach(function(line, index) {
                    if(line.length) {
                        // console.log(index, line)
                        // console.log('哈哈哈')

                        var historyLine = JSON.parse(line);
                        history.push(historyLine);
                    } else {
                        // console.log('空的!!!')
                    };
                });
                // };

                // console.log(history)
                socket.emit('history response', {
                    history: history
                });

                // console.log('push a history response======!')

            });

        });

        // socket.on('disconnect', function() {
        //   // 'sockets:at:' + room_id + ':for:' + userKey
        //     client.srem('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, removed) {
        //         if(removed) {
        //             client.srem('socketio:sockets', socket.id);
        //             client.scard('sockets:for:' + userKey + ':at:' + room_id, function(err, members_no) {
        //                 if(!members_no) {
        //                     client.srem('rooms:' + room_id + ':online', userKey, function(err, removed) {
        //                         if (removed) {
        //                             client.hincrby('rooms:' + room_id + ':info', 'online', -1);
        //                             // chatlogWriteStream.destroySoon();
        //                             io.sockets.in(room_id).emit('user leave', {
        //                                 nickname: nickname,
        //                                 // avatar: avatar,
        //                                 provider: provider
        //                             });
        //                         }
        //                     });
        //                 }
        //             });
        //         }
        //     });
        // });
    });
};