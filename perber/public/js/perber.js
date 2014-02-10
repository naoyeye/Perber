/* 
* @Author: hanjiyun
* @Date:   2013-11-02 18:53:14
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-02-07 11:41:36
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

                    var time = new Date(historyLine.creation_ts),
                        chatBoxData = {
                            id: historyLine.id,
                            msg: historyLine.message,
                            lang : lang,
                            retained : historyLine.retained,
                            time: time.format("yyyy-MM-dd hh:mm:ss")
                        };
                    chat.append(parseChatBox(ich.chat_box(chatBoxData)));
                });

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
new msg
*/
    socket.on('new msg', function(data) {
        // 时间
        var time = new Date();
        data.time = time;

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
                        //len = chunks.length;
                    // console.log(chunks)

                    // for(var i = 0; i<len; i++) {
                        socket.emit('my msg', {
                            msg: chunks
                        });
                    // }
                    
                    // socket.emit('my msg', {
                    //     msg: inputText
                    // });

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
            perberImageReg = /(http:\/\/perber.qiniudn.com\/[a-zA-Z0-9]+)/g,
            // doubanImgReg = /(http:\/\/img[0-9]{1}.douban.com\/view\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/public\/[a-zA-Z0-9]+.[a-z]{3})/g,
            instagramImgReg = /(http:\/\/distilleryimage[0-9]{1,2}.ak.instagram.com\/[a-zA-Z0-9_]+.jpg)/g,
            linkReg = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

        // replace link and image
        text = text.replace(linkReg, function(e){
            var result;
            // sina + instagram
            if(sinaImgReg.test(e) || instagramImgReg.test(e)){
                result = '<div class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div>';
            // qiniu image
            } else if(perberImageReg.test(e)){
                // 从qiniu的url中匹配中key, 删除时会用到
                var keyReg = /([0-9]{13})/g,
                    key;
                e.replace(keyReg, function(s,value) {
                    key = value;
                });
                result = '<div data-key="'+ key +'" class="imgbox"><div style="background-image:url('+ e +');background-size: cover;"></div></div>';
            }
            // link
            else {
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
        $e.find('p').append(ich.progress());
    }

    function showUploadProgress(){
        $('.chat-input').append(ich.upload_progress());
    }

    function hideUploadProgress(){
        $('.chat-input .progress').remove();
    }

    function showPreview(img){
        $('.chat-input').append(ich.image_preview(img));
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


// =============filedrop==============

    $('.chat-input').filedrop({
        fallback_id: 'upload_button',
        withCredentials: true,
        // data: {
        //     param1: 'value1',           // send POST variables
        //     param2: function(){
        //         return calculated_data; // calculate data at time of upload
        //     },
        // },
        // headers: {          // Send additional request headers
        //     'header': 'value'
        // },
        paramname:'PerberImage',
        allowedfiletypes: ['image/jpeg','image/png','image/gif','image/bmp'],
        allowedfileextensions: ['.jpg','.jpeg','.png','.gif'],
        maxfiles: 1,
        maxfilesize: 2, //最大2M
        url: '/upload',

        error: function(err, file) {
            switch(err) {
                case 'BrowserNotSupported':
                    alert('browser does not support HTML5 drag and drop')
                    break;
                case 'TooManyFiles':
                    // user uploaded more than 'maxfiles'
                    alert('添加一张就可以了');
                    break;
                case 'FileTooLarge':
                    // program encountered a file whose size is greater than 'maxfilesize'
                    // FileTooLarge also has access to the file which was too large
                    // use file.name to reference the filename of the culprit file
                    alert(file.name+' 太大了，请上传不超过2M的');
                    break;
                case 'FileTypeNotAllowed':
                    // The file type is not in the specified list 'allowedfiletypes'
                    break;
                case 'FileExtensionNotAllowed':
                    // The file extension is not in the specified list 'allowedfileextensions'
                    break;
                default:
                    break;
            }
        },

        dragOver: function() {
            // user dragging files over #dropzone
            $(this).addClass('dragOver');
            // focusInput();
        },
        dragLeave: function() {
            // user dragging files out of #dropzone
            $(this).removeClass('dragOver');
        },
        
        docOver: function(){

        },

        docLeave: function() {
            // user dragging files out of the browser document window
        },
        drop: function() {
            // user drops file
            $(this).removeClass('dragOver');
        },
        uploadStarted: function(i, file, len){
            // a file began uploading
            // i = index => 0, 1, 2, 3, 4 etc
            // file is the actual file of the index
            // len = total files user dropped
            // console.log('upload started')
            showUploadProgress();
        },
        uploadFinished: function(i, file, response, time) {
            // response is the data you got back from server in JSON format.
            // console.log(response)

            // if(response.err){
            //     console.log('上传出错', response.err)
            // }
            if(response.key){
                // console.log('上传完成,key=', response.key)
                // 隐藏进度条
                hideUploadProgress();
                // 显示图片预览
                var img = {
                    key: response.key,
                    path : 'http://perber.qiniudn.com/' + response.key + '?imageView/1/w/200/h/200'
                };
                showPreview(img);
                // $('.chat-input textarea').val();
            }
            if( response.progress ){
                console.log('progress' , progress)
            }
            console.log('response = ', response)
        },
        progressUpdated: function(i, file, progress) {
            // this function is used for large files and updates intermittently
            // progress is the integer value of file being uploaded percentage to completion
            // console.log('progress updated')
            // console.log('progressUpdated progress', progress)

            // todo
            // console.log('progress = ', progress)
            // $('.chat-input .progress .bar').width(progress+"%");
        },
        globalProgressUpdated: function(progress) {
            // progress for all the files uploaded on the current instance (percentage)
            // ex: $('#progress div').width(progress+"%");
            // console.log('globalProgressUpdated progress', progress)
        },
        speedUpdated: function(i, file, speed) {
            // speed in kb/s
            console.log('speed = ', speed)
        },
        rename: function(name) {
            // name in string format
            // must return alternate name as string
        },

        beforeEach: function(file){
            if(!file.type.match(/^image\//)){
                alert('Only images are allowed!');
                return false;
            }
        },

        beforeSend: function(file, i, done) {
            // file is a file object
            // i is the file index
            // call done() to start the upload

            // 判断是不是已经上传了图片并且未发布
            if($('#imagePreview').size() > 0 ){
                notice('error', '别着急，一个一个来', 2000)
            } else {
                done();
            }
        },
        afterAll: function() {
            // console.log('afterAll')
            // runs after all files have been uploaded or otherwise dealt with
        }
    });


    // delete image
    $('.chat-input').on('click', '#previewControl .delete', function(){
        var $e = $(this),
            key = $e.data('id');
        // console.log(key);

        $.ajax({ 
            url: '/delete',
            type: 'POST',
            cache: false,
            data: { key: key},
            dataType : "json",
            success: function(data){
               $('#imagePreview').remove();
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
            socket.emit('my msg', {
                msg: 'http://perber.qiniudn.com/' + key + '?imageView/1/w/500/h/500',
                imgKey: key // 把图片key保存到数据库
            });
            $('#imagePreview').remove();
    });

})

