/* 
* @Author: hanjiyun
* @Date:   2013-11-02 18:53:14
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-03-04 02:21:16
*/


$(function() {
    var windowStatus,
        afkDeliveredMessages = 0;
    var chat = $('.chat');

    // First update the title with room's name
    updateTitle();

    // focusInput();

    chat.append(ich.loading());

/*
=================
    Socket.io
=================
*/

    var socket = io.connect("", {
        "connect timeout": 1000
    });

    socket.on('error', function (reason){
        console.error('Unable to connect Socket.IO !!', reason);
    });

    socket.on('connect', function (){
        // console.info('successfully established a working connection');
        if(chat.find('.chat-box').length === 0) {
            socket.emit('history request');
        }
    });

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
                            cover: historyLine.music_cover,
                            location: historyLine.music_location,
                            lang : lang,
                            retained : historyLine.retained,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                        chat.append(parseMusicBox(ich.music_box(musicBoxData)));
                    } else {
                        // console.log('不是虾米')
                        var chatBoxData = {
                            id: historyLine.id,
                            msg: message,
                            lang : lang,
                            retained : historyLine.retained,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                        chat.append(parseChatBox(ich.chat_box(chatBoxData)));
                    }

                });
                
                // initPlayer($(".zenPlayer"))

                initCirclePlayer();

                $('.time').timeago();
                masonryAllItems(chat);
                hideLoading();
            } else {
                hideLoading();
                chat.append(ich.nullbox());
            }
        // }, 1000)
    });


/*
get new msg
*/
    socket.on('new msg', function(data) {
        // 时间
        // var time = new Date();
        // data.time = time;
        // console.log('data', data)

        // 固定
        data.retained = 0;

        // 语言
        if(isChinese(data.msg)){
            data.lang = 'en';
        } else {
            data.lang = 'cn';
        }

        // 模板处理
        var $boxes = parseChatBox(ich.chat_box(data));

        if(chat.find('.chat-box').length === 0) {
            chat.prepend( $boxes );
            masonryAllItems(chat);
        } else {
            chat.prepend( $boxes ).masonry('prepended', $boxes);
        }

        // todo 优化性能
        $(".time").timeago();
        hideNull();

        //update title if window is hidden
        if(windowStatus === "hidden") {
            afkDeliveredMessages += 1;
            updateTitle();
            $('#chatAudio')[0].play();
        }
    });


// get new song
    socket.on('new song', function(data) {

        // 固定
        data.retained = 0;

        // 语言
        if(isChinese(data.message)){
            data.lang = 'en';
        } else {
            data.lang = 'cn';
        }

        // console.log('data', data)

        var time = new Date(data.time);

        var musicBoxData = {
            id: data.id,
            songOriginal: data.songOriginal,
            title: data.song.title,
            artist: data.song.artist,
            cover: data.song.cover,
            location: data.song.location,
            retained : data.retained,
            time: time.format("yyyy-MM-dd hh:mm:ss")
        };

        var $boxes = parseMusicBox(ich.music_box(musicBoxData));

        if(chat.find('.chat-box').length === 0) {
            chat.prepend( $boxes );
            masonryAllItems(chat);
        } else {
            chat.prepend( $boxes ).masonry('prepended', $boxes);
        }

        // 初始化播放器
        initCirclePlayer();

        // todo 优化性能
        $(".time").timeago();
        hideNull();

        //update title if window is hidden
        if(windowStatus === "hidden") {
            afkDeliveredMessages += 1;
            updateTitle();
            $('#chatAudio')[0].play();
        }
    })

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
                chat.append(ich.nullbox());
                chat.masonry('destroy');
            }
        })

        // 播放提示音
        if(windowStatus === "hidden") {
            $('#deletedAudio')[0].play();
        }
    })


/*
=================
   Delete msg
=================
*/
    $('.chat-list').hammer({
        hold_timeout: 1000, // hold time setting
        stop_browser_behavior: { userSelect: "" }
    }).on('hold', '.chat-box', function(event) {
        var $e = $(this);
        //如果已经在删除中 或 此内容已被固定
        if($e.hasClass('waiting') || $e.data('retained') === 1) return;

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
            }, 5000)
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
                    var xiamiREG = /(http:\/\/www.xiami.com\/song\/[0-9]+)\s?/g;

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
        var sinaImgReg = /(http:\/\/ww[0-9]{1}.sinaimg.cn\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+.[a-z]{3})/g,
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
                result = '<div class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div>';
            // qiniu image
            } else if(perberImageReg.test(e)){
                // 从qiniu的url中匹配中key, 删除时会用到
                var keyReg = /(com\/[A-Za-z0-9_=]+)/g,
                    key;
                e.replace(keyReg, function(s,value) {
                    key = value.replace('com/', '');
                });
                result = '<div data-key="'+ key +'" class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div>';
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



//===============
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
    })

    // close intro
    $('body').on('click', '.intro-wrap-close', function(){
        $('.intro-wrap').addClass('intro-wrap-closing');
        
        setTimeout(function(){
            $('body').removeClass('intro-wrap-open');
            $('.intro-wrap').remove();
        }, 300)
    })


    function focusInput() {
        $('.chat-input textarea').focus();
    }


    //var scrollTop = document.body.scrollTop;
    
    // Tips toggle
    $('.chat-input textarea').focus(function(){
        // $('#Tips').removeClass('active');
        
        //console.log(scrollTop)
        
        // for iOS:
        //$('.chat-input').css({'position':'absolute', 'top': scrollTop});
        // console.log($('.chat-input').offset().top)

        $('#Tips').stop().animate({
            top: -100
        },200)
    }).blur(function(){
        // $('#Tips').addClass('active');
        //$('.chat-input').css({'position':'fixed','top':0});
        $('#Tips').stop().animate({
            top: 0
        },200)
    });

    // $(window).scroll(function(){
    //     // console.log(1)
    //     $('.chat-input').css({'position':'absolute','top':0});
    // })


    //masonry
    function masonryAllItems(wrap){
        wrap.masonry({
            // columnWidth: 290,
            'itemSelector': '.chat-box',
            'stamp' : '.retained_1',
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
        $('.chat-list .loading').remove();
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


    // function initPlayer(element){

    //     var status = "stop";
    //     var dragging = false;

    //     // init
    //     var player = element;

    //     player.each(function(index, el){
    //         var $t = $(this);
    //         var location = $t.data('location');

    //         $t.jPlayer({
    //             ready: function () {
    //                 $t.jPlayer("setMedia", {
    //                     // m4a: "/media/2012/07/30/song.m4a",
    //                     // mp3: "player/media/aria.mp3"
    //                     mp3: location
    //                     //oga: "media/2012/07/30/song.ogg"
    //                 });
    //             },
    //             // swfPath: "/static/public/swf",
    //             supplied: "mp3"
    //         });



    //         // preload, update, end
    //         // $t.bind($.jPlayer.event.progress, function(event) {
    //         //     var audio = $t.find('audio');
    //         //     console.log(audio.size())
    //         //     var pc = 0;
    //         //     if ((audio.buffered != undefined) && (audio.buffered.length != 0)) {
    //         //         pc = parseInt(((audio.buffered.end(0) / audio.duration) * 100), 10); 
    //         //         displayBuffered(pc);
    //         //         console.log(pc);
    //         //         if(pc >= 99) {
    //         //             console.log("loaded");
    //         //             $t.find('.buffer').addClass("loaded");
    //         //         }
    //         //     }
    //         // });
            

    //         //player.bind($.jPlayer.event.loadeddata, function(event) {    
    //             //$('.zenPlayer .buffer').addClass("loaded");    
    //         //});
            
    //         $t.bind($.jPlayer.event.timeupdate, function(event) { 
    //             var pc = event.jPlayer.status.currentPercentAbsolute;
    //             if (!dragging) { 
    //                 displayProgress(pc);
    //             }
    //         });
            
    //         $t.bind($.jPlayer.event.ended, function(event) {   
    //             $t.find('.circle').removeClass( "rotate" );
    //             $t.removeClass( "play" );
    //             $t.find('.progress').css({rotate: '0deg'});
    //             status = "stop";
    //         });
            
            
            
            
            
    //         // play/pause
            
    //         $t.find(".button").bind('mousedown', function() {
    //             // not sure if this can be done in a simpler way.
    //             // when you click on the edge of the play button, but button scales down and doesn't drigger the click,
    //             // so mouseleave is added to still catch it.
    //             $(this).bind('mouseleave', function() {
    //                 $(this).unbind('mouseleave');
    //                 onClick();
    //             });
    //         });

    //         $t.find(".button").bind('mouseup', function() {
    //             $(this).unbind('mouseleave');
    //             onClick();
    //         });
    //     })
            

        
        
    //     function onClick() {
    //         if(status != "play") {
    //             status = "play";
    //             $(".zenPlayer").addClass( "play" );
    //             player.jPlayer("play");
    //         } else {
    //             $('.zenPlayer .circle').removeClass( "rotate" );
    //             $(".zenPlayer").removeClass( "play" );
    //             status = "pause";
    //             player.jPlayer("pause");
    //         }
    //     };
        
        
        
        
    //     // draggin
        
    //     var clickControl = $('.zenPlayer .drag');
        
    //     clickControl.grab({
    //         onstart: function(){
    //             dragging = true;
    //             $('.zenPlayer .button').css( "pointer-events", "none" );
                
    //         },
    //         onmove: function(event){
    //             var pc = getArcPc(event.position.x, event.position.y);
    //             player.jPlayer("playHead", pc).jPlayer("play");
    //             displayProgress(pc);
    //         },
    //         onfinish: function(event){
    //             dragging = false;
    //             var pc = getArcPc(event.position.x, event.position.y);
    //             player.jPlayer("playHead", pc).jPlayer("play");
    //             $('.zenPlayer .button').css( "pointer-events", "auto" );
    //         }
    //     }); 
        
        
        
        
        
        
    //     // functions
        
    //     function displayProgress(pc) {
    //         var degs = pc * 3.6+"deg"; 
    //         $('.zenPlayer .progress').css({rotate: degs});        
    //     }
    //     function displayBuffered(pc) {
    //         var degs = pc * 3.6+"deg"; 
    //         $('.zenPlayer .buffer').css({rotate: degs});      
    //     }
        
    //     function getArcPc(pageX, pageY) { 
    //         var self    = clickControl,
    //             offset  = self.offset(),
    //             x   = pageX - offset.left - self.width()/2,
    //             y   = pageY - offset.top - self.height()/2,
    //             a   = Math.atan2(y,x);  
                
    //             if (a > -1*Math.PI && a < -0.5*Math.PI) {
    //            a = 2*Math.PI+a; 
    //         } 

    //         // a is now value between -0.5PI and 1.5PI 
    //         // ready to be normalized and applied               
    //         var pc = (a + Math.PI/2) / 2*Math.PI * 10;   
               
    //         return pc;
    //     }
    // }

    function initCirclePlayer(){
        $('.cp-jplayer').each(function(i, el){
            var $t = $(this);
            if($t.data('inited') !== '1'){
                var id = $t.data('id'),
                    location = $t.data('location');

                $t.data('inited', '1');

                var myCirclePlayer = new CirclePlayer("#jquery_jplayer_" + id, {
                    mp3: location
                }, {
                    cssSelectorAncestor: "#cp_container_"+id,
                    supplied:"mp3"
                });
            }
        })
    }



// =============filedrop==============
    var Bucket = $('.chat-input').data('bucket');
    var Qiniu_isUploading = false;

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        $dropZone.addClass('dragOver');
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }


    function handleFileSelect(evt) {

        evt.stopPropagation();
        evt.preventDefault();

        $dropZone.removeClass('dragOver');

        var files = evt.dataTransfer.files;
        var new_file;

        if(Qiniu_isUploading){
            notice('error', '还有没上传完的 :)', 2000);
            return;
        }

        if(files && files.length > 1){
            notice('error', '一次只上传一个文件就可以 :)', 2000);
            return;
        }

        if(files && files.length > 0){
            for (var i = 0; file = files[i]; i++) {

                //判断文件类型
                if(!file.type || $.inArray(file.type, allowedfiletypes) < 0) {
                    notice('error', '唉，上传图片才可以啊', 2000);
                    return;
                }

                //判断文件大小

                if(file.size > 2000000) {
                    notice('error', '艾玛！文件太大了！减减肥，要小于2M才可以。', 2000);
                    return;
                }

                // 判断是否正在上传、或者有上传完成但未发布的图片
                if($('#imagePreview').size() > 0){
                    notice('error', '别着急，一个一个来', 2000)
                    return;
                }

                var extra = new Object();
                var key = file.name.replace(/[ ]/g, "");
                var time = new Date().getTime();

                extra.key = base64encode(key) + '_' + time;

                new_file = file;

                $('#upimg').fadeIn().css({
                    'background':'#fff',
                });

                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    return function(e) {
                        // Render thumbnail.
                        var div = document.createElement('div');
                        div.setAttribute('id', 'imageThumb')
                        div.setAttribute('style', 'background:url('+ e.target.result +') center center no-repeat;background-size:cover;')
                        document.getElementById('upimg').insertBefore(div, null);
                    };
                })(file);

                reader.readAsDataURL(file);

                // 在开始上传之前，先去后端拿token
                $.ajax({ 
                    url: '/sign',
                    type: 'POST',
                    cache: false,
                    data: { putExtra: JSON.stringify(extra)},
                    dataType : "json",
                    success: function(res){

                        showUploadProgress();

                        var token = res.token;
                        var Qiniu_UploadUrl = "http://up.qiniu.com";
                        // var Qiniu_UploadUrl = "/qiniu_upload";

                        // var Qiniu_Progresses.length = 0;
                        var Qiniu_chunks = 0;
                        var Qiniu_taking = 0;
                        var Qiniu_status = null;
                        // var size = file.size;
                        Qiniu_isUploading = true;

                        var xhr = new XMLHttpRequest();

                        xhr.open('POST', Qiniu_UploadUrl, true);

                        // xhr.open('POST', '/qiniu_upload', true);


                        var formData, startDate;
                        formData = new FormData();

                        // if (key !== null && key !== undefined) formData.append('key', key);
                        // for (var k in Qiniu_params) {
                        //     formData.append(k, Qiniu_params[k]);
                        // }

                        formData.append('token', token);
                        formData.append('file', new_file);
                        formData.append('key', extra.key);
                        // formData.append('callbackBody', "name=$(fname)&hash=$(etag)&location=$(x:location)&=$(x:prise)")

                        var taking;

                        xhr.upload.addEventListener("progress", function(evt) {
                            if (evt.lengthComputable) {

                                var nowDate = new Date().getTime();
                                taking = nowDate - startDate;
                                var x = (evt.loaded) / 1024;
                                var y = taking / 1000;
                                var uploadSpeed = (x / y);
                                var formatSpeed;
                                if (uploadSpeed > 1024) {
                                    formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
                                } else {
                                    formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
                                }
                                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                                // console.log('percentComplete', percentComplete)


                                $('.chat-input .progress .bar').height(percentComplete+"%");

                                if(percentComplete == '100'){
                                    $('#upimg .bar').html('<i class="fa fa-spinner fa-spin"></i>')
                                }

                            }

                        }, false);

                        // 上传完成
                        xhr.onreadystatechange = function(response) {

                            if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
                                Qiniu_taking += taking;
                                //checksum,crc32,ctx,host,offset
                                var blkRet = JSON.parse(xhr.responseText);

                                // console.log('上传完成 !!!')

                                hideUploadProgress();

                                $('#imageThumb').remove();

                                $('#upimg').css({
                                    'background':'none',
                                    'box-shadow': 'none'
                                })

                                // console.log('blkRet', blkRet)

                                var img = {
                                    key: blkRet.key,
                                    path : 'http://'+ Bucket +'.qiniudn.com/' + blkRet.key + '?imageView/1/w/200/h/200'
                                };

                                // console.log('img', img)

                                showPreview(img);

                                Qiniu_isUploading = false;

                            // 上传失败
                            } else if (xhr.status != 200 && xhr.responseText) {
                                console.log('xhr.responseText', xhr.responseText)
                                console.log('response', response)
                                Qiniu_isUploading = false;
                            }
                        };

                        startDate = new Date().getTime();
                        xhr.send(formData);

                        
                       // $('#imagePreview').remove();

                    },
                    error: function(jqXHR, textStatus, err){
                        // console.log(jqXHR)
                        // console.log(textStatus)
                        // console.log(err.error)
                        // todo error dialog
                    }
                })


            }
        }
    }


    function handleDragLeave(evt){
        // console.log('鼠标移开');
        evt.stopPropagation();
        evt.preventDefault();

        $dropZone.removeClass('dragOver');
    }

    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    var $dropZone = $('#drop_zone');
    var allowedfiletypes = ['image/jpeg','image/png','image/gif','image/bmp'];


    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('dragleave', handleDragLeave, false);
    dropZone.addEventListener('drop', handleFileSelect, false);






    // delete image
    $('.chat-input').on('click', '#previewControl .delete', function(){
        var $e = $(this),
            key = $e.data('id');
        // console.log('delete key', key);

        $.ajax({ 
            url: '/delete',
            type: 'POST',
            cache: false,
            data: { key: key},
            dataType : "json",
            success: function(res){
                // console.log(res)
               $('#upimg').html('').hide();

            },
            error: function(jqXHR, textStatus, err){
                console.log(jqXHR)
                console.log(textStatus)
                console.log(err.error)
                // todo error dialog
            }
        })
    })
    // 发布图片
    .on('click', '#previewControl .publish', function(){
        var $e = $(this),
            key = $e.data('id').toString();
            // console.log('publish key', key)

            socket.emit('my msg', {
                msg: 'http://'+ Bucket +'.qiniudn.com/' + key + '?imageView/1/w/500/h/500',
                imgKey: key // 把图片key保存到数据库
            });
            $('#upimg').html('').hide();
    });

})

