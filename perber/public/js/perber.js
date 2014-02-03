/* 
* @Author: hanjiyun
* @Date:   2013-11-02 18:53:14
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-02-03 00:38:25
*/


$(function() {
    var windowStatus,
        afkDeliveredMessages = 0;

    // First update the title with room's name
    updateTitle();

    // focusInput();

    $('.chat').append(ich.loading());

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
        if($('.chat .chat-box').length === 0) {
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

                    var time = new Date(historyLine.creation_ts),
                        chatBoxData = {
                            id: historyLine.id,
                            msg: historyLine.message,
                            lang : lang,
                            retained : historyLine.retained,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                    // console.log(chatBoxData)
                    $('.chat').append(parseChatBox(ich.chat_box(chatBoxData)));
                });

                // bindDeleteMes();
                $('.time').timeago();
                masonryHistory($('.chat'));
                hideLoading();
            } else {
                hideLoading();
                $('.chat').append(ich.nullbox());
            }
        // }, 1000)
    });


/*
new msg
*/
    socket.on('new msg', function(data) {
        var time = new Date();
        data.time = time;

        if(isChinese(data.msg)){
            data.lang = 'en';
        } else {
            data.lang = 'cn';
        }

        var $boxes = parseChatBox(ich.chat_box(data));

        if($('.chat .chat-box').length == 0) {
            $('.chat').prepend( $boxes )
        } else {
            $('.chat').prepend( $boxes ).masonry('prepended', $boxes)
        }

        masonryHistory($('.chat'));
        // bindDeleteMes();
        $(".time").timeago();
        hideNull();

        //update title if window is hidden
        if(windowStatus === "hidden") {
            afkDeliveredMessages +=1;
            updateTitle();
            $('#chatAudio')[0].play();
        }
    });


/*
delete msg
*/
    socket.on('message deleted', function(data) {

        var chat = $('.chat-box');

        chat.each(function(){
            var el = $(this);

            if(el.data('id') === data.id){
                // todo maybe no need to clear?
                if(el.find('.progressWrapper').size() > 0){
                    clearTimeout(el.delTime)
                }
                $('.chat').masonry( 'remove', el);
                $('.chat').masonry();

                if(windowStatus === "hidden") {
                    $('#deletedAudio')[0].play();
                }
            }
        });

        // todo 
        // 判断是否删光了. ps: 上面的 masonry 不支持回调，只好在这里 setTimeout 了 :( 
        // 这里的处理还不是很完善
        var sadTime = setTimeout(function(){
            // console.log(chat.size())
            if(chat.size() === 0){
                // console.log('空k')
                $('.chat .nullbox').show();
                $('.chat').masonry('destroy');
            }
            clearTimeout(sadTime);
        }, 500)
    })


/*
upload image
*/

// todo




// ========================


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
        //准备删除时 和 固定条目
        if($e.hasClass('waiting') || $e.data('retained') === 1) return;

        // 显示删除按钮
        $e.append(ich.confirm_template());
        $e.addClass('waiting animate');

        // 绑定 删除事件
        $e.find('.delete').click(function(){
            showProgress($e);
            $del = $(this);
            $del.hide();

            // 10秒动画后向socket发出删除命令
            // 这里的时间需要和css那边的动画时间一致
            $e.delTime = setTimeout(function(){
                var id = $e.data('id');
                socket.emit('delete message', {
                    id: id
                });
                $('.chat').masonry( 'remove', $e);
                $('.chat').masonry();
                clearTimeout($e.delTime)
            }, 5000)
        })

        // 绑定 取消删除事件
        $e.find('.cancel').click(function(){
            $e.removeClass('waiting animate');
            $e.find('.confirm').remove();
            $e.find('.progressWrapper').remove();
            clearTimeout($e.delTime)
        })
    })

/*
=================
   drop upload image
=================
*/

// upload image to qiniu
    // imagesBucket.putFile(
    //     'exampleKey2', // new file name
    //     '/Users/hanjiyun/Google Drive/Project/Perber/perber/public/apple-touch-icon-114x114-precomposed.png' // file path
    // ).then(
    //     function(reply){
    //         // 上传成功
    //         console.dir(reply);
    //     },
    //     function(err){
    //         console.log(err);
    //     }
    // )

/*
=================
   Say
=================
*/

    $(".chat-input textarea").keypress(function(event) {
        // nl2br
        var inputText = $(this).val().trim().replace(/\r\n/gi, '');//.replace('\n', '').replace('\r','').replace(' ','');

        switch (event.keyCode) {
            case 13:
                if (!event.shiftKey && inputText){
                    socket.emit('my msg', {
                        msg: inputText
                    });
                    $(this).val('');

                    return false;
                }
                break;
            case 8:
            case 46:
        }
    });

    var textParser = function(text) {

        // replace emoticons
        // text = injectEmoticons(text);

        // replace img
        var sinaImgReg = /(http:\/\/ww[0-9]{1}.sinaimg.cn\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+.[a-z]{3})/g,
            doubanImgReg = /(http:\/\/img[0-9]{1}.douban.com\/view\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/public\/[a-zA-Z0-9]+.[a-z]{3})/g,
            instagramImgReg = /(http:\/\/distilleryimage[0-9]{1,2}.ak.instagram.com\/[a-zA-Z0-9_]+.jpg)/g,
            linkReg = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

        // replace link and image
        text = text.replace(linkReg, function(e){
            var result;
            if(sinaImgReg.test(e) || instagramImgReg.test(e)){
                result = '<div class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div>';
            } else {
                result = '<a href="' + e + '" target="_blank">'+ e +'</a>';
            }
            return result;
        })

        //replace @ twitter
        text = text.replace(/(@)([a-zA-Z0-9_]+)/g, "<a href=\"http://twitter.com/$2\" target=\"_blank\">$1$2</a>");

        text = text.replace(/(\n)/g, '<hr>');

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
        if(/.*[\u4e00-\u9fa5]+.*$/.test(text)){
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

        if (windowStatus == "visible") {
            focusInput();
        }
    }

    function updateTitle() {
        // On chrome, we have to add a timer for updating the title after the focus event
        // else the title will not update
        
        // console.log('updateTitle!!')

        window.setTimeout(function () {
            $('title').html(ich.title_template({
                count: afkDeliveredMessages,
            }, true));
        },100);
    }



//===============
    
    $('#Tips i').popup({
        easing:'',
        debug:false
    })

    // open intro
    $('#Tips li').click(function(){
        var elementId = $(this).attr('id');

        if(elementId === 'about'){
            $('body').append(ich.about_content_template());
        } else if(elementId === 'how2play'){
            $('body').append(ich.how2play_content_template());
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
        $(".chat-input textarea").focus();
    }

    //masonry history
    function masonryHistory(wrap){
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
        $('.chat-list .loading').hide();
    }

    function hideNull(){
        $('.chat .nullbox').hide();
    }

    function showProgress($e){
        $e.find('p').append(ich.progress());
    }

});

