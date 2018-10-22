/* 
* @Author: hanjiyun
* @Date:   2013-11-02 18:53:14
* @Last Modified by:   hanjiyun
* @Last Modified time: 2018-10-22 20:52:27
*/

/*

         _         _           _          _              _           _      
        /\ \      /\ \        /\ \       / /\           /\ \        /\ \    
       /  \ \    /  \ \      /  \ \     / /  \         /  \ \      /  \ \   
      / /\ \ \  / /\ \ \    / /\ \ \   / / /\ \       / /\ \ \    / /\ \ \  
     / / /\ \_\/ / /\ \_\  / / /\ \_\ / / /\ \ \     / / /\ \_\  / / /\ \_\ 
    / / /_/ / / /_/_ \/_/ / / /_/ / // / /\ \_\ \   / /_/_ \/_/ / / /_/ / / 
   / / /__\/ / /____/\   / / /__\/ // / /\ \ \___\ / /____/\   / / /__\/ /  
  / / /_____/ /\____\/  / / /_____// / /  \ \ \__// /\____\/  / / /_____/   
 / / /     / / /______ / / /\ \ \ / / /____\_\ \ / / /______ / / /\ \ \     
/ / /     / / /_______/ / /  \ \ / / /__________/ / /_______/ / /  \ \ \    
\/_/      \/__________\/_/    \_\\/_____________\/__________\/_/    \_\/    
                                                                            

*/

$(function() {
    var windowStatus,
        afkDeliveredMessages = 0;
    var chat = $('.chat');

    // First update the title with room's name
    updateTitle();

    // window width
    if(window.innerWidth < 401){
        $('#Tips').remove();
    }

    chat.append(ich.loader());

/*
=================
    Socket.io
=================
*/

    var socket = io.connect();

    socket.on('error', function (reason){
        console.error('Unable to connect Socket.IO !!', reason);
    });

    socket.on('connect', function (){
        if(chat.find('.chat-box').length === 0) {
            socket.emit('history request');
        }
    });



/*
update online people number
*/
    // socket.on('update online', function(data){
    //     if(data && data.count){
    //         updateOnlineCount(data.count, data.action);
    //     }
    // })


/*
history response
*/
    socket.on('history response', function(data) {

        // setTimeout(function(){
            if(data.history && data.history.length) {

                var $lastInput,
                    lastInputUser;

                data.history.forEach(function(historyLine) {
                    var lang;

                    if(isChinese(historyLine.message)){
                        lang = 'en';
                    } else {
                        lang = 'cn';
                    }

                    var isXiamiSong = /www.xiami.com\/song\/\d+/;

                    var time = new Date(historyLine.creation_ts);
                    var message = historyLine.message;
                    // 检查是不是虾米歌曲链接
                    if (isXiamiSong.test(message)) {
                        // console.log('是虾米')
                        // xiamiParse(pageUrl)
                        var musicBoxData = {
                            id: historyLine.id,
                            songOriginal: message,
                            title: historyLine.music_title,
                            artist: historyLine.music_artist,
                            album: historyLine.music_album,
                            cover: historyLine.music_cover,
                            song_location: historyLine.music_location,
                            location: historyLine.location,
                            address: historyLine.address,
                            lang : lang,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                        chat.append(parseMusicBox(ich.music_box(musicBoxData)));
                    } else {
                        // console.log('不是虾米')
                        var chatBoxData = {
                            id: historyLine.id,
                            msg: message,
                            location: historyLine.location,
                            address: historyLine.address,
                            lang : lang,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                        chat.append(parseChatBox(ich.chat_box(chatBoxData)));
                    }

                });
                
                // initPlayer($(".zenPlayer"))
                // 初始化播放器
                initZenPlayer();

                $('.time').timeago();
                masonryAllItems(chat);
            } else {
                chat.append(ich.nullbox());
            }
        // }, 1000)

        hideLoading();

    });

    // 判断对象的长度
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

/*
get new msg
*/
    socket.on('new msg', function(data) {
        // 时间
        // var time = new Date();
        // data.time = time;

        // 语言
        if(isChinese(data.msg)){
            data.lang = 'en';
        } else {
            data.lang = 'cn';
        }

        // 判断是不是音乐
        if(Object.size(data.song) > 0){
            var musicBoxData = {
                id: data.id,
                songOriginal: data.msg,
                title: data.song.title,
                artist: data.song.artists,
                album: data.song.albumTitle,
                cover: data.song.coverURL,
                song_location: data.song.url,
                location: data.location,
                address: data.address,
                time: data.time
            };
            var $boxes = parseMusicBox(ich.music_box(musicBoxData));
        } else {
            var $boxes = parseChatBox(ich.chat_box(data));
        }

        // 模板处理
        // var $boxes = parseChatBox(ich.chat_box(data));

        if(chat.find('.chat-box').length === 0) {
            chat.prepend( $boxes );
            masonryAllItems(chat);
        } else {
            chat.prepend( $boxes ).masonry('prepended', $boxes);
        }


        // 以下几项需要优化性能。因为会重复运行？ 
        // 比如 页面里如果有很多播放器，用户新发了一个一首音乐，
        // initZenPlayer 就会把所有的播放器都初始化一遍
        // 其实只要初始化刚刚发的那个就可以了
        
        // 初始化播放器
        if(Object.size(data.song) > 0){
            initZenPlayer();
        }

        // 时间显示
        $(".time").timeago();

        // 隐藏为空时的icon
        hideNull();

        //update title if window is hidden
        if(windowStatus === "hidden") {
            afkDeliveredMessages += 1;
            updateTitle();
            $('#chatAudio')[0].play();
        }
    });

/*
delete msg
*/
    socket.on('message deleted', function(data) {

        // 匹配删除目标
        var target = $('.chat-box[data-id="'+data.id+'"]');

        // 如果要删除的目标正在被其他人删除，则clearTimeout以完成进度条动画
        if(target.find('.progressWrapper').size() > 0){
            clearTimeout(target.delTime)
        }

        // 移除
        chat.masonry( 'remove', target);

        // 重新布局 relayout
        // todo : 如果不是在第一屏，就不用重新布局，以免找不到当前正在看的内容
        chat.masonry();

        // 重新布局完成后 判断是否已清空
        chat.masonry( 'on', 'removeComplete', function( msnryInstance, removedItems ) {
            // console.log(msnryInstance.items.length)
            if(msnryInstance.items.length === 0){
                // console.log('iii')
                if($('.nullbox').size() === 0){
                    chat.append(ich.nullbox());
                    chat.masonry('destroy');
                }
            }
        })


        // 播放提示音
        if(windowStatus === "hidden") {
            if(afkDeliveredMessages > 0){
                afkDeliveredMessages = afkDeliveredMessages - 1;
                updateTitle();
            }
            $('#deletedAudio')[0].play();
        }
    })


/*
=================
   Delete msg
=================
*/
    $('.chat').hammer({
        hold_timeout: 1000, // hold time setting
        stop_browser_behavior: { userSelect: "" }
    }).on('hold', '.chat-box', function(event) {
        var $e = $(this);
        //如果已经在删除中 或 此内容已被固定
        if($e.hasClass('waiting')) return;

        // 显示删除按钮
        $e.append(ich.confirm_template());
        $e.addClass('waiting animate');

        // 绑定 删除事件
        $e.find('.delete').click(function(){
            showProgress($e); // 显示等待进程
            $(this).hide(); // 隐藏删除icon
            var imgKey = $(this).parents('.chat-box').eq(0).find('.imgbox').data('key') // 如果带有qiniu图片, 得到图片key

            // 5秒动画后向socket发出删除命令
            // 这里的时间需要和css那边的动画时间一致
            $e.delTime = setTimeout(function(){
                var id = $e.data('id');
                
                // 如果没有qiniu图片
                if(!imgKey){
                    // console.log('没有图片')
                    socket.emit('delete message', {
                        id: id
                    });
                } else {
                    // console.log('有图片')
                    socket.emit('delete message', {
                        id: id,
                        imgKey : imgKey.toString()
                    })
                }
                chat.masonry( 'remove', $e);
                // $('.chat').masonry();
                clearTimeout($e.delTime)
            }, 800)
        })

        // 绑定 "取消删除"事件
        $e.find('.cancel').click(function(){
            $e.removeClass('waiting animate');
            $e.find('.confirm').remove();
            $e.find('.progressWrapper').remove();
            clearTimeout($e.delTime)
        })
    })

/*
=================
    Limited someone
=================
*/
    socket.on('limited someone', function(data){
        notice('error', '说话太快，会累。影响到别人，不好。', 2000);
    })


/*
=================
   Say
=================
*/

    $(".chat-input textarea").keypress(function(event) {
        // nl2
        var inputText = $(this).val().trim().replace(/\r\n/gi, '');//.replace('\n', '').replace('\r','').replace(' ','');

        switch (event.keyCode) {
            case 13:
                if (!event.shiftKey && inputText){
                    var chunks = inputText.substring(0, 240);//,

                    // 检查用户输入的内容是不是虾米的歌曲地址
                    var xiamiREG = /(http(s)?:\/\/)?(www\.)?xiami.com\/(song\/[\w-./?%&=]*)?$/;

                    // 如果是虾米音乐，向后端发送数据时，增加一个 'song'
                    // 然后在后端解析虾米音乐的真实mp3地址
                    if(xiamiREG.test(chunks)){

                        notice('success', '请稍等，正在解析音乐信息....', 4000);

                        socket.emit('my msg', {
                            msg: chunks,
                            song: true
                        });
                    } else {
                        socket.emit('my msg', {
                            msg: chunks
                        });
                    }

                    // 清空输入框
                    $(this).val('');
                    return false;
                }
                break;
            case 8:
            case 46:
        }
    });



// 解析文字和图片
    var textParser = function(text) {

        //sina weibo
        var sinaImgReg = /(http:\/\/w[a-z0-9]{2}.sinaimg.cn\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+.[a-z]{3})/g,
            // qiniu
            perberImageReg = /(http:\/\/[a-zA-Z0-9_\-]+.qiniudn.com\/[a-zA-Z0-9_=?\/]+)/g,
            // instagram
            instagramImgReg = /(http:\/\/distilleryimage[0-9]{1,2}.ak.instagram.com\/[a-zA-Z0-9_]+.jpg)/g,
            // normal link
            linkReg = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
            // xiami
            xiamiReg = /(http:\/\/www.xiami.com\/song\/[0-9]+)\s?/g;

        // replace link and image
        text = text.replace(linkReg, function(e){

            var result;
            // sina + instagram
            if(sinaImgReg.test(e) || instagramImgReg.test(e)){
                result = '<div class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div><a href="'+ e +'" target="_blank" class="view_full_size" title="查看原图"><i class="fa fa-dot-circle-o"></i><span>Full size</span></a>';
            // qiniu image
            } else if(perberImageReg.test(e)){
                // 从qiniu的url中匹配中key, 删除时会用到
                var keyReg = /(com\/[A-Za-z0-9_=]+)/g,
                    key;
                e.replace(keyReg, function(s,value) {
                    key = value.replace('com/', '');
                });
                var fullSizePath = 'http://'+ Bucket +'.qiniudn.com/' + key;
                result = '<div data-key="'+ key +'" class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div><a href="'+ fullSizePath +'" target="_blank" class="view_full_size" title="查看原图"><i class="fa fa-dot-circle-o"></i><span>Full size</span></a>';
            } else if(xiamiReg.test(e)){
                // var songidReg = /(song\/[0-9]+)/g,
                //     songid;
                // e.replace(songidReg, function(s,value) {
                //     console.log('s', s)
                //     console.log('value', value)
                //     songid = value.replace('song/', '');
                // });

                // console.log('songid', songid)
                var sidPattern = /(\d+)/;
                var songid =  sidPattern.exec(e)[1];

                result = '<embed src="http://www.xiami.com/widget/0_' + songid + '/singlePlayer.swf" type="application/x-shockwave-flash" width="257" height="33" wmode="transparent"></embed>';

            } else {
                result = '<a href="' + e + '" target="_blank">'+ e +'</a>';
            }
            return result;
        })

        //replace @ twitter
        text = text.replace(/(@)([a-zA-Z0-9_]+)/g, "<a href=\"http://twitter.com/$2\" target=\"_blank\">$1$2</a>");

        // text = text.replace(/(\n)/g, '<hr>');

        text = injectEmoticons(text);

        return text;
    };

    var parseChatBox = function(chatBox) {
        var chatBoxMsg = chatBox.find('p');
        parseChatBoxMsg(chatBoxMsg);
        return chatBox;
    };

    var parseChatBoxMsg = function(chatBoxMsg) {
        var msg = chatBoxMsg.html();
        return chatBoxMsg.html(textParser(msg));
    };

// 解析音乐
    var musicParser = function(music){
        // console.log('music', music)
        return music;
    }

    var parseMusicBox = function(musicBox){
        var musicBoxMsg = musicBox.find('.musicBoxWapper');
        parseMusicBoxSong(musicBoxMsg);
        return musicBox;
    }

    var parseMusicBoxSong = function(musicBoxMsg) {
        var music = musicBoxMsg.html();
        return musicBoxMsg.html(musicParser(music));
    };



    var patterns = {
        angry: /\&gt;:-o|\&gt;:o|\&gt;:-O|\&gt;:O|\&gt;:-\(|\&gt;:\(/g,
        naughty: /\&gt;:-\)|\&gt;:\)|\&gt;:-\&gt;|\&gt;:\&gt;/g,
        sick: /:-\&amp;|:\&amp;|=\&amp;|=-\&amp;|:-@|:@|=@|=-@/g,
        smile: /:-\)|:\)|=-\)|=\)/g,
        wink: /;-\)|;\)/g,
        frown: /:-\(|:\(|=\(|=-\(/g,
        ambivalent: /:-\||:\|/g,
        gasp: /:-O|:O|:-o|:o|=-O|=O|=-o|=o/g,
        laugh: /:-D|:D|=-D|=D/g,
        kiss: /:-\*|:\*|=-\*|=\*/g,
        yuck: /:-P|:-p|:-b|:P|:p|:b|=-P|=-p|=-b|=P|=p|=b/g,
        yum: /:-d|:d/g,
        grin: /\^_\^|\^\^|\^-\^/g,
        sarcastic: /:-\&gt;|:\&gt;|\^o\)/g,
        cry: /:'\(|='\(|:'-\(|='-\(/g,
        cool: /8-\)|8\)|B-\)|B\)/g,
        nerd: /:-B|:B|8-B|8B/g,
        innocent: /O:-\)|o:-\)|O:\)|o:\)/g,
        sealed: /:-X|:X|=X|=-X/g,
        footinmouth: /:-!|:!/g,
        embarrassed: /:-\[|:\[|=\[|=-\[/g,
        crazy: /%-\)|%\)/g,
        confused: /:-S|:S|:-s|:s|%-\(|%\(|X-\(|X\(/g,
        moneymouth: /:-\$|:\$|=\$|=-\$/g,
        heart: /\(L\)|\(l\)/g,
        thumbsup: /\(Y\)|\(y\)/g,
        thumbsdown: /\(N\)|\(n\)/g,
        "not-amused": /-.-\"|-.-|-_-\"|-_-/g,
        "mini-smile": /c:|C:|c-:|C-:/g,
        "mini-frown": /:c|:C|:-c|:-C/g,
        content: /:j|:J/g,
        hearteyes: /\&lt;3/g
    };

    var emoticHTML = "<span class='emoticon $emotic'></span>";

    var injectEmoticons = function(text) {
        for(var emotic in patterns) {
            text = text.replace(patterns[emotic], emoticHTML.replace("$emotic", "emoticon-" + emotic));
        }
        return text;
    }

    var isChinese = function(text){
        if( /[\u4e00-\u9fa5]/g.test(text)){
            return false;
        } else {
            return true;
        }
    }

    // time.format("yyyy-MM-dd hh:mm:ss")
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

    // Simplified Chinese
    $.timeago.settings = {
        refreshMillis : 1000,
        allowFuture: false,
        localeTitle: true,
        cutoff:0,
        // strings: {
        //     prefixAgo: null,
        //     prefixFromNow: "从现在开始",
        //     suffixAgo: "之前",
        //     suffixFromNow: null,
        //     seconds: "刚刚",
        //     minute: "大约 1 分钟",
        //     minutes: "%d 分钟",
        //     hour: "大约 1 小时",
        //     hours: "大约 %d 小时",
        //     day: "1 天",
        //     days: "%d 天",
        //     month: "大约 1 个月",
        //     months: "%d 月",
        //     year: "大约 1 年",
        //     years: "%d 年",
        //     numbers: [],
        //     wordSeparator: ""
        // }
        strings: {
            prefixAgo: null,
            prefixFromNow: null,
            suffixAgo: "ago",
            suffixFromNow: "from now",
            seconds: "less than a minute",
            minute: "about a minute",
            minutes: "%d minutes",
            hour: "about an hour",
            hours: "about %d hours",
            day: "a day",
            days: "%d days",
            month: "about a month",
            months: "%d months",
            year: "about a year",
            years: "%d years",
            wordSeparator: " ",
            numbers: []
          }
    }



/*
=================
    TITLE notifications
=================
*/

    var hidden,
        change,
        vis = {
            hidden: "visibilitychange",
            mozHidden: "mozvisibilitychange",
            webkitHidden: "webkitvisibilitychange",
            msHidden: "msvisibilitychange",
            oHidden: "ovisibilitychange" /* not currently supported */
        };

    for (var hidden in vis) {
        if (vis.hasOwnProperty(hidden) && hidden in document) {
            change = vis[hidden];
            break;
        }
    }

    if (change) {
        document.addEventListener(change, onchange);
    } else if (/*@cc_on!@*/false) { // IE 9 and lower
        document.onfocusin = document.onfocusout = onchange
    } else {
        window.onfocus = window.onblur = onchange;
    }

    function onchange (evt) {
        var body = document.body;
            evt = evt || window.event;

        if (evt.type == "focus" || evt.type == "focusin") {
            windowStatus = "visible";
        } else if (evt.type == "blur" || evt.type == "focusout") {
            windowStatus = "hidden";
        } else {
            windowStatus = this[hidden] ? "hidden" : "visible";
        }

        if(windowStatus == "visible" && afkDeliveredMessages) {
            afkDeliveredMessages = 0;
            updateTitle();
        }

        // if (windowStatus == "visible") {
        //     focusInput();
        // }
    }

    function updateTitle() {
        // On chrome, we have to add a timer for updating the title after the focus event
        // else the title will not update
        window.setTimeout(function () {
            $('title').html(ich.title_template({
                count: afkDeliveredMessages,
            }, true));
        },100);
    }





/*
=================
    MISC
=================
*/
    // open intro
    $('#Tips li').click(function(){
        var elementId = $(this).attr('id');

        if(elementId === 'about'){
            $('body').append(ich.about_content_template());
        } else if(elementId === 'usage'){
            $('body').append(ich.usage_content_template());
        }

        
        setTimeout(function(){
            $('body').addClass('intro-wrap-open');
        },0)
    });

    // close intro
    $('body').on('click', '.intro-wrap-close', function(){
        $('.intro-wrap').addClass('intro-wrap-closing');
        
        setTimeout(function(){
            $('body').removeClass('intro-wrap-open');
            $('.intro-wrap').remove();
        }, 300)
    });

    // Disable long-Press action on mobile
    if (isPC() === false) {
        var styles = '.chat-box {-webkit-touch-callout: none; -webkit-user-select: none;}';
        includeStyleElement(styles, 'newstyle');
    }

    function isPC () {
        var userAgentInfo = navigator.userAgent;
        var Agents = new Array('Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod');
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
        }
        return flag;
    };

    function includeStyleElement (styles, styleId) {
        if (document.getElementById(styleId)) {
            return;
        }
        var style = document.createElement('style');
        style.id = styleId;
        //这里最好给ie设置下面的属性
        /*if (isIE()) {
            style.type = “text/css”;
            style.media = “screen”
        }*/
        (document.getElementsByTagName('head')[0] || document.body).appendChild(style);

        if (style.styleSheet) { //for ie
            style.styleSheet.cssText = styles;
        } else {//for w3c
            style.appendChild(document.createTextNode(styles));
        }
    }

    function focusInput() {
        $('.chat-input textarea').focus();
    }


    //masonry
    function masonryAllItems(wrap){
        wrap.masonry({
            // columnWidth: 290,
            'itemSelector': '.chat-box',
            // 'gutter': 5,
            // isResizeBound: false,
            visibleStyle: { opacity: 1, transform: 'scale(1)' },
            isAnimated: true,
            animationOptions: {
                duration: 550,
                easing: 'linear',
                queue: false
            }
        });
    }

    function hideLoading(){
        $('.loader').remove();
    }

    function hideNull(){
        $('.chat .nullbox').remove();
    }

    function showProgress($e){
        $e.find('.inner').append(ich.progress());
    }

    function showUploadProgress(){
        $('#upimg').append(ich.upload_progress());
    }

    function hideUploadProgress(){
        $('.chat-input .progress').remove();
    }

    function showPreview(img){
        $('#upimg').append(ich.image_preview(img));
    }

    function notice(type, text, timeout){
        var arry = {
            type : type,
            text : text
        },
        notice = $('.noticeWrap');
        notice.append(ich.notice_template(arry)).addClass(type).animate({
            top: 0
        } , 200)

        var noticeHeight = $('.noticeWrap').height();

        // console.log(noticeHeight)

        setTimeout(function(){
            notice.stop().animate({
                top: -noticeHeight
            }, 300, function(){
                notice.html('').attr('class','noticeWrap')
            })
        }, timeout)
    }

// =============player==============

    function initZenPlayer(){
        $('.zenPlayer').each(function(i, el){
            var $t = $(this);
            if($t.data('inited') !== '1'){
                var id = $t.data('id'),
                    location = $t.data('location');

                $t.data('inited', '1');

                var myZenPlayer = new zenPlayer("#jquery_jplayer_" + id + ' .player' , {
                    mp3: location
                }, {
                    cssSelectorAncestor: "#jquery_jplayer_" + id,
                    supplied: "mp3",
                    swfPath: '/static/public/swf'
                });
            }
        })
    }

    function updateOnlineCount(num, _action){
        var number = $('#number'),
            action = $('#action'),
            online = $('#onlineCount');
        online.show();
        number.html(num+' 在线').attr('title', num+' 在线');

        if(_action === 'add'){
            online.addClass('addP').removeClass('removeP');
            action.html('有人来了');
            setTimeout(function(){
                online.attr('class','');
                // action.html('');
            },100)
        }
        if(_action === 'remove'){
            online.addClass('removeP').removeClass('addP');
            action.html('有人走了');
            setTimeout(function(){
                online.attr('class','');
                // action.html('');
            },100)
        }
    }



// =============filedrop==============
    var Bucket = $('.chat-input').data('bucket');
    // var Qiniu_isUploading = false;

    // function handleDragOver(evt) {
    //     evt.stopPropagation();
    //     evt.preventDefault();

    //     $dropZone.addClass('dragOver');
    //     evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    // }


    // function handleFileSelect(evt) {

    //     evt.stopPropagation();
    //     evt.preventDefault();

    //     $dropZone.removeClass('dragOver');

    //     var files = evt.dataTransfer.files;
    //     var new_file;

    //     if(Qiniu_isUploading){
    //         notice('error', '还有没上传完的 :)', 2000);
    //         return;
    //     }

    //     if(files && files.length > 1){
    //         notice('error', '一次只上传一个文件就可以 :)', 2000);
    //         return;
    //     }

    //     if(files && files.length > 0){
    //         for (var i = 0; file = files[i]; i++) {

    //             //判断文件类型
    //             if(!file.type || $.inArray(file.type, allowedfiletypes) < 0) {
    //                 notice('error', '唉，上传图片才可以啊', 2000);
    //                 return;
    //             }

    //             //判断文件大小

    //             if(file.size > 2000000) {
    //                 notice('error', '艾玛！文件太大了！减减肥，要小于2M才可以。', 2000);
    //                 return;
    //             }

    //             // 判断是否正在上传、或者有上传完成但未发布的图片
    //             if($('#imagePreview').size() > 0){
    //                 notice('error', '别着急，一个一个来', 2000)
    //                 return;
    //             }

    //             var extra = new Object();
    //             var key = file.name.replace(/[ ]/g, "");
    //             var time = new Date().getTime();

    //             extra.key = base64encode(key) + '_' + time;

    //             new_file = file;

    //             $('#upimg').fadeIn().css({
    //                 'background':'#fff',
    //             });

    //             var reader = new FileReader();

    //             reader.onload = (function(theFile) {
    //                 return function(e) {
    //                     // Render thumbnail.
    //                     var div = document.createElement('div');
    //                     div.setAttribute('id', 'imageThumb')
    //                     div.setAttribute('style', 'background:url('+ e.target.result +') center center no-repeat;background-size:cover;')
    //                     document.getElementById('upimg').insertBefore(div, null);
    //                 };
    //             })(file);

    //             reader.readAsDataURL(file);

    //             // 在开始上传之前，先去后端拿token
    //             $.ajax({ 
    //                 url: '/sign',
    //                 type: 'POST',
    //                 cache: false,
    //                 data: { putExtra: JSON.stringify(extra)},
    //                 dataType : "json",
    //                 success: function(res){

    //                     showUploadProgress();

    //                     var token = res.token;
    //                     var Qiniu_UploadUrl = "http://up.qiniu.com";
    //                     // var Qiniu_UploadUrl = "/qiniu_upload";

    //                     // var Qiniu_Progresses.length = 0;
    //                     var Qiniu_chunks = 0;
    //                     var Qiniu_taking = 0;
    //                     var Qiniu_status = null;
    //                     // var size = file.size;
    //                     Qiniu_isUploading = true;

    //                     var xhr = new XMLHttpRequest();

    //                     xhr.open('POST', Qiniu_UploadUrl, true);

    //                     // xhr.open('POST', '/qiniu_upload', true);


    //                     var formData, startDate;
    //                     formData = new FormData();

    //                     // if (key !== null && key !== undefined) formData.append('key', key);
    //                     // for (var k in Qiniu_params) {
    //                     //     formData.append(k, Qiniu_params[k]);
    //                     // }

    //                     formData.append('token', token);
    //                     formData.append('file', new_file);
    //                     formData.append('key', extra.key);
    //                     // formData.append('callbackBody', "name=$(fname)&hash=$(etag)&location=$(x:location)&=$(x:prise)")

    //                     var taking;

    //                     xhr.upload.addEventListener("progress", function(evt) {
    //                         if (evt.lengthComputable) {

    //                             var nowDate = new Date().getTime();
    //                             taking = nowDate - startDate;
    //                             var x = (evt.loaded) / 1024;
    //                             var y = taking / 1000;
    //                             var uploadSpeed = (x / y);
    //                             var formatSpeed;
    //                             if (uploadSpeed > 1024) {
    //                                 formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
    //                             } else {
    //                                 formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
    //                             }
    //                             var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    //                             // console.log('percentComplete', percentComplete)


    //                             $('.chat-input .progress .bar').height(percentComplete+"%");

    //                             if(percentComplete == '100'){
    //                                 $('#upimg .bar').html('<i class="fa fa-spinner fa-spin"></i>')
    //                             }

    //                         }

    //                     }, false);

    //                     // 上传完成
    //                     xhr.onreadystatechange = function(response) {

    //                         if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
    //                             Qiniu_taking += taking;
    //                             //checksum,crc32,ctx,host,offset
    //                             var blkRet = JSON.parse(xhr.responseText);

    //                             // console.log('上传完成 !!!')

    //                             hideUploadProgress();

    //                             $('#imageThumb').remove();

    //                             $('#upimg').css({
    //                                 'background':'none',
    //                                 'box-shadow': 'none'
    //                             })

    //                             // console.log('blkRet', blkRet)

    //                             var img = {
    //                                 key: blkRet.key,
    //                                 path : 'http://'+ Bucket +'.qiniudn.com/' + blkRet.key + '?imageView/1/w/200/h/200'
    //                             };

    //                             // console.log('img', img)

    //                             showPreview(img);

    //                             Qiniu_isUploading = false;

    //                         // 上传失败
    //                         } else if (xhr.status != 200 && xhr.responseText) {
    //                             // console.log('xhr.responseText', xhr.responseText)
    //                             // console.log('response', response)
    //                             Qiniu_isUploading = false;
    //                         }
    //                     };

    //                     startDate = new Date().getTime();
    //                     xhr.send(formData);

                        
    //                    // $('#imagePreview').remove();

    //                 },
    //                 error: function(jqXHR, textStatus, err){
    //                     // console.log(jqXHR)
    //                     // console.log(textStatus)
    //                     // console.log(err.error)
    //                     // todo error dialog
    //                 }
    //             })


    //         }
    //     }
    // }


    // function handleDragLeave(evt){
    //     // console.log('鼠标移开');
    //     evt.stopPropagation();
    //     evt.preventDefault();

    //     $dropZone.removeClass('dragOver');
    // }

    // // Setup the dnd listeners.
    // var dropZone = document.getElementById('drop_zone');
    // var $dropZone = $('#drop_zone');
    // var allowedfiletypes = ['image/jpeg','image/png','image/gif','image/bmp'];


    // dropZone.addEventListener('dragover', handleDragOver, false);
    // dropZone.addEventListener('dragleave', handleDragLeave, false);
    // dropZone.addEventListener('drop', handleFileSelect, false);






    // // delete image
    // $('.chat-input').on('click', '#previewControl .delete', function(){
    //     var $e = $(this),
    //         key = $e.data('id');
    //     // console.log('delete key', key);

    //     $.ajax({ 
    //         url: '/delete',
    //         type: 'POST',
    //         cache: false,
    //         data: { key: key},
    //         dataType : "json",
    //         success: function(res){
    //             // console.log(res)
    //            $('#upimg').html('').hide();

    //         },
    //         error: function(jqXHR, textStatus, err){
    //             // console.log(jqXHR)
    //             // console.log(textStatus)
    //             // console.log(err.error)
    //             notice('error', '出错了。'+ err.error, 2000)
    //         }
    //     })
    // })
    // // 发布图片
    // .on('click', '#previewControl .publish', function(){
    //     var $e = $(this),
    //         key = $e.data('id').toString();
    //         // console.log('publish key', key)

    //         socket.emit('my msg', {
    //             msg: 'http://'+ Bucket +'.qiniudn.com/' + key + '?imageView/1/w/500/h/500',
    //             imgKey: key // 把图片key保存到数据库
    //         });
    //         $('#upimg').html('').hide();
    // });



    // 翻转
    $('#front').click(function(){
        $('.fixed_block.null').addClass('flip')
    })
    $('#back2front').click(function(){
        $('.fixed_block.null').removeClass('flip')
    })

    // 申请
    $('#applyBtn').click(function(){
        var $t = $(this),
            name = $('#input_name').val(),
            email = $('#input_email').val();

        var mailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/g;


        if(name.length > 20){
            notice('error', '名称太长了', 3000);
            return;
        }

        if(email.length < 1){
            notice('error', '还没填写邮箱', 3000);
            return;
        }

        if(!mailReg.test(email)){
            notice('error', '请检查邮箱地址是否写错', 3000);
            return;
        }


        $t.attr('class','ui loading button').attr('disabled', 'disabled')

        $('#input_name').val('');
        $('#input_email').val('');

        $.ajax({ 
            url: '/apply',
            type: 'POST',
            cache: false,
            data: { name: name, email: email},
            dataType : "json",
            success: function(res){
                if(res.status === 'success'){
                    notice('success', '已收到申请，稍后会有人联系你', 3000)
                    $t.attr('class','ui green button').attr('disabled', '')
                    $('.fixed_block.null').removeClass('flip')
                }
            },
            error: function(jqXHR, textStatus, err){
                // console.log(jqXHR)
                // console.log(textStatus)
                // console.log(err.error)
                notice('error', '出错了。'+ err.error, 2000)
                $t.attr('class','ui green button').attr('disabled', '')
                $('.fixed_block.null').removeClass('flip')
            }
        })

    })

    // 投票
    // 得到最新投票
    socket.on('new vote', function(data) {
        $('#count_upup').html(data.result.up + ' 点头');
        $('#count_down').html(data.result.down + ' 摇头');
        $('#vote_bar .button').removeClass('loading');
    })

    // 先检查是否已经投票了
    if(getCookie('voted') === 'true'){
        var vote_data = {
            voted_class:'disabled',
            count_upup : null,
            count_down : null,
            voted:true
        };
    } else {
        var vote_data = {
            voted_class:'',
            count_upup : null,
            count_down : null,
            voted:true
        };
    }

    // 添加至模板
    $('#vote_bar').append(ich.vote_template(vote_data))

    // 投票按钮点击事件
    $('#vote_bar .button').click(function(){

        // 判断是否投过票
        if (getCookie('voted') === 'true') {
            return;
        }

        var $t = $(this);

        if($t.attr('id') === 'v_upup'){
            socket.emit('my vote', {
                vote: 'up'
            });
        } else {
            socket.emit('my vote', {
                vote: 'down'
            });
        }

        $t.addClass('loading');
        $('#vote_bar .button').addClass('disabled')
        SetCookie('voted', true)

    })


    /*
    功能：保存cookies函数 
    参数：name，cookie名字；value，值
    */
    function SetCookie(name,value){
        var Days = 20;   //cookie 将被保存两个月
        var exp  = new Date();  //获得当前时间
        exp.setTime(exp.getTime() + Days*24*60*60*1000);  //换成毫秒
        document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
    } 
    /*
    功能：获取cookies函数 
    参数：name，cookie名字
    */
    function getCookie(name){
        var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
        if(arr != null)
      return unescape(arr[2]); 
        return null;

    } 
    /*
    功能：删除cookies函数 
    参数：name，cookie名字
    */
    function delCookie(name){
        var exp = new Date();  //当前时间
        exp.setTime(exp.getTime() - 1);
        var cval=getCookie(name);
        if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();
    }
})

