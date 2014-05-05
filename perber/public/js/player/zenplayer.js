/*global $, console*/
'use strict';

var zenPlayer = function(jPlayerSelector, media, options) {
    var self = this;

    var defaults = {
            // solution: 'flash, html', // For testing Flash with CSS3
            supplied: 'm4a, oga',
            // Android 2.3 corrupts media element if preload:'none' is used.
            // preload: 'none', // No point preloading metadata since no times are displayed. It helps keep the buffer state correct too.
            cssSelectorAncestor: '#jquery_jplayer_0',
            cssSelector: {
                play: '.play',
                pause: '.pause'
            }
        };

    var cssSelector = {
        audio: 'audio',
        bufferHolder: '.circle',
        // buffer1: '.cp-buffer-1',
        buffer: '.buffer',
        progressHolder: '.drag',
        progress: '.progress',
        circleControl: '.drag',
        button: '.button'
    };

    this.player = $(jPlayerSelector);
    // this.clickControl = this.player.find('.drag');
    // this.button = this.player.find('button');
    this.media = $.extend({}, media);
    this.options = $.extend(true, {}, defaults, options); // Deep copy

    this.audio = {};
    this.status = 'stop';
    this.dragging = false;

    this.eventNamespace = '.CirclePlayer'; // So the events can easily be removed in destroy.

    this.jq = {};
    $.each(cssSelector, function(entity, cssSel) {
        self.jq[entity] = $(self.options.cssSelectorAncestor + ' ' + cssSel);
    });

    this._initSolution();
    this._initPlayer();
};

zenPlayer.prototype = {
    _createHtml: function() {
    },
    _initPlayer: function() {
        var self = this;
        this.player.jPlayer(this.options);

        this.player.bind($.jPlayer.event.ready + this.eventNamespace, function(event) {

            console.log('bind ready');

            if(event.jPlayer.html.used && event.jPlayer.html.audio.available) {
                self.audio = $(this).data('jPlayer').htmlElement.audio;
            }
            $(this).jPlayer('setMedia', self.media);
            self._initCircleControl();
        });

        // play
        this.player.bind($.jPlayer.event.play + this.eventNamespace, function(event) {
            self.jq.bufferHolder.addClass('rotate');
            self.player.parents('.zenPlayer').eq(0).addClass( 'play' );
            $(this).jPlayer('pauseOthers');
        });

        // pause
        this.player.bind($.jPlayer.event.pause + this.eventNamespace, function(event) {
            self.jq.bufferHolder.removeClass('rotate');
            self.player.parents('.zenPlayer').eq(0).removeClass( 'play' );
        });

        this.player.bind($.jPlayer.event.timeupdate + this.eventNamespace, function(event) {
            console.log('bind timeupdate');
            var percent = event.jPlayer.status.currentPercentAbsolute;
            if (!self.dragging) {
                self._displayProgress(percent);
            }
        });

        // This event fired as buffered time increments
        this.player.bind( $.jPlayer.event.progress, function () {
            // var audio = self.audio.get(0);
            var percent = 0;

            if((typeof self.audio.buffered === 'object') && (self.audio.buffered.length > 0)) {
                percent = parseInt(((self.audio.buffered.end(0) / self.audio.duration) * 100), 10);
                self._displayBuffered(percent);
                //console.log(percent);
                if(percent >= 99) {
                    //console.log('loaded');
                    self.jq.buffer.addClass('loaded');
                }
            }
        });

        this.player.bind($.jPlayer.event.ended + this.eventNamespace, function (event) {
            self._resetSolution();
        });

        // play/pause
        self.jq.button.bind('mousedown', function() {
            // not sure if this can be done in a simpler way.
            // when you click on the edge of the play button, but button scales down and doesn't drigger the click,
            // so mouseleave is added to still catch it.
            $(this).bind('mouseleave', function() {
                $(this).unbind('mouseleave');
                self._onClick();
            });
        });

        self.jq.button.bind('mouseup', function() {
            $(this).unbind('mouseleave');
            self._onClick();
        });
    },
    _onClick: function () {
        // // var self = this;
        // console.log('_onClick', this);
        // if(this.status !== 'play') {
        //     this.status = 'play';
        //     // $('.zenPlayer .circle').removeClass( 'rotate' );
        //     console.log('当前点击的时候 不是 play状态');
        //     $('.zenPlayer').removeClass('play');
        //     // $('.zenPlayer .play').show();
        //     // $('.zenPlayer .pause').hide();
        //     // $('.zenPlayer .progress').css({rotate: '0deg'});
        //     this.jq.bufferHolder.addClass('rotate');
        //     this.player.parents('.zenPlayer').eq(0).addClass( 'play' );
        //     this.player.jPlayer('play');
        // } else {
        //     console.log('当前点击的时候 是 play状态');
        //     this.jq.bufferHolder.removeClass('rotate');
        //     this.player.parents('.zenPlayer').eq(0).removeClass('play');
        //     this.status = 'pause';
        //     this.player.jPlayer('pause');
        // }
    },
    _initSolution: function() {
        // if (this.cssTransforms) {
        //     this.jq.progressHolder.show();
        //     this.jq.bufferHolder.show();
        // }
        // else {
        //     // this.jq.progressHolder.addClass(this.cssClass.gt50).show();
        //     // this.jq.progress1.addClass(this.cssClass.fallback);
        //     // this.jq.progress2.hide();
        //     this.jq.bufferHolder.hide();
        // }
        // this._resetSolution();
    },
    _resetSolution: function() {
        var self = this;
        self.jq.bufferHolder.removeClass( 'rotate' );
        this.player.parents('.zenPlayer').eq(0).removeClass( 'play' );
        self.jq.progress.css({rotate: '0deg'});
        self.status = 'stop';
    },
    _initCircleControl: function() {
        console.log('_initCircleControl');
        var self = this;
        self.jq.circleControl.grab({
            onstart: function(){
                self.dragging = true;
                self.jq.button.css( 'pointer-events', 'none' );
            }, onmove: function(event){
                var pc = self._getArcPercent(event.position.x, event.position.y);
                self.player.jPlayer('playHead', pc).jPlayer('play');
                self._displayProgress(pc);
            }, onfinish: function(event){
                this.dragging = false;
                var pc = self._getArcPercent(event.position.x, event.position.y);
                self.player.jPlayer('playHead', pc).jPlayer('play');
                self.jq.button.css( 'pointer-events', 'auto' );
            }
        });
    },
    _displayProgress: function (pc) {
        // console.log('_displayProgress');
        var degs = pc * 3.6 + 'deg';
        this.jq.progress.css({rotate: degs});
    },
    _displayBuffered: function (pc) {
        // console.log('_displayBuffered');
        var degs = pc * 3.6+'deg';
        this.jq.buffer.css({rotate: degs});
    },
    _timeupdate: function (percent) {
        // console.log('_timeupdate');
        var self = this;
        self.player.bind($.jPlayer.event.timeupdate, function (event) {
            var pc = event.jPlayer.status.currentPercentAbsolute;
            if (!self.dragging) {
                self._displayProgress(pc);
            }
        });
    },
    _progress: function(percent) {
        // var degs = percent * 3.6+'deg';

        // if (this.cssTransforms) {
        //     if (percent <= 50) {
        //         this.jq.bufferHolder.removeClass(this.cssClass.gt50);
        //         this.jq.buffer1.css({'transform': 'rotate(' + degs + ')'});
        //         this.jq.buffer2.hide();
        //     } else if (percent <= 100) {
        //         this.jq.bufferHolder.addClass(this.cssClass.gt50);
        //         this.jq.buffer1.css({'transform': 'rotate(180deg)'});
        //         this.jq.buffer2.show();
        //         this.jq.buffer2.css({'transform': 'rotate(' + degs + ')'});
        //     }
        // }
    },
    _getArcPercent: function(pageX, pageY) {
        var self    = this.jq.circleControl,
            offset  = self.offset(),
            x   = pageX - offset.left - self.width()/2,
            y   = pageY - offset.top - self.height()/2,
            a   = Math.atan2(y,x);
            
        if (a > -1 * Math.PI && a < -0.5*Math.PI) {
            a = 2*Math.PI+a;
        }

        // a is now value between -0.5PI and 1.5PI 
        // ready to be normalized and applied
        var pc = (a + Math.PI/2) / 2*Math.PI * 10;

        return pc;
    },
    setMedia: function (media) {
        this.media = $.extend({}, media);
        this.player.jPlayer('setMedia', this.media);
    },
    play: function (time) {
        this.player.jPlayer('play', time);
    },
    pause: function (time) {
        this.player.jPlayer('pause', time);
    },
    destroy: function () {
        this.player.unbind(this.eventNamespace);
        this.player.jPlayer('destroy');
    }
};
