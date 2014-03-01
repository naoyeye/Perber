
var http = require('http');
var url = require('url');
var path = require('path');

module.exports = xiamiRun;


var location;
var xiamiRealSong = {test:'tetete'};

var isSong = /www.xiami.com\/song\/\d+/;

var sidPattern = /(\d+)/,
    songUrlPattern = /a href="(\/song\/\d+)"/g;

var titlePattern = /<div id="title">\s*<h1>(.*)<\/h1>/,
    artistPattern = /<a href="\/artist\/\d+" title=".*">(.*)<\/a>/;


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
    var options = url.parse(pageUrl);

    // console.log('sid=', sid)
    // console.log('options=', options)
    // options.headers = reqHeaders({
    //     'Cookie': cookie
    // });
    http.get(options, function(res) {
        res.setEncoding('utf8');
        var html = '';
        res.on('data', function(data) {
            html += data;
        });
        res.on('end', function() {
            var title = titlePattern.exec(html),
                artist = artistPattern.exec(html);
            title = title ? title[1] : null;
            artist = artist ? artist[1] : null;
            var filename = title + (artist ? (' - ' + artist) : '') + '.mp3';

            // console.log('title', title)
            // console.log('artist', artist)
            // console.log('filename', filename)

            xiamiRealSong['title'] = title;
            xiamiRealSong['artist'] = artist;

            // console.log('xiamiRealSong=', xiamiRealSong)

            if ((title || artist) && title.indexOf('span class') < 0) {
                filename = safeFilter(filename);
                options = url.parse('http://www.xiami.com/song/gethqsong/sid/' + sid);

                http.get(options, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function(data) {
                        location = getLocation(JSON.parse(data).location);

                        xiamiRealSong['location'] = location;

                        console.log('data', data)

                        // return xiamiRealSong;

                        // console.log('xiamiRealSong', xiamiRealSong)

                        // if (location) {
                        //     // return location;
                        //     console.log('')
                        //     xiamiRealSong['location'] = location;
                        // }
                        // return xiamiRealSong;
                    })

                    res.on('data', function() {
                        console.log('end location', xiamiRealSong)
                    })

                })
            }
        })
    })
}

function xiamiRun(pageUrl){
    if (isSong.test(pageUrl)) {

        xiamiParse(pageUrl)
        // console.log('xiamiParse(pageUrl)', xiamiParse(pageUrl))

        // console.log('xiamiRealSong return ', xiamiRealSong)

        // 返回歌曲的名称 作者 真实地址
        return xiamiRealSong;

    } else {
        console.log('no!!')
        // todo
    }
}
