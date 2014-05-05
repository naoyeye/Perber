/*global $, console*/
'use strict';

/*
 *
 * ZEN - HTML5-CSS3 Audio Player
 * by @simurai (simurai.com)
 *
 * Most of this code by: @maboa (happyworm.com)
 * and: @quinnirill (niiden.com/jussi/)
 *
 */



$(document).ready(function () {

    var status = 'stop';
    var dragging = false;

    // init
    var player = $('.zenPlayer .player');

    player.jPlayer({
        ready: function () {
            $(this).jPlayer('setMedia', {
                // m4a: '/media/2012/07/30/song.m4a',
                // mp3: 'player/media/aria.mp3'
                mp3: 'http://share.han.im/audio/The_Return_Of_Starlight.mp3'
                //oga: 'media/2012/07/30/song.ogg'
            });
        },
        swfPath: '/static/public/swf',
        supplied: 'mp3'
    });

    // preload, update, end
    player.bind( $.jPlayer.event.progress, function () {
        console.log('progress');
        var audio = $('.zenPlayer audio').get(0);
        var pc = 0;

        if ((audio.buffered !== undefined) && (audio.buffered.length !== 0)) {
            pc = parseInt(((audio.buffered.end(0) / audio.duration) * 100), 10);
            displayBuffered(pc);
            //console.log(pc);
            if(pc >= 99) {
                //console.log('loaded');
                $('.zenPlayer .buffer').addClass('loaded');
            }
        }
    });

    //player.bind($.jPlayer.event.loadeddata, function(event) {    
        //$('.zenPlayer .buffer').addClass('loaded');    
    //});

    player.bind($.jPlayer.event.timeupdate, function(event) {
        console.log('timeupdate');
        var pc = event.jPlayer.status.currentPercentAbsolute;
        if (!dragging) {
            displayProgress(pc);
        }
    });
    
    player.bind($.jPlayer.event.ended, function() {
        $('.zenPlayer .circle').removeClass( 'rotate' );
        $('.zenPlayer').removeClass( 'play' );
        $('.zenPlayer .progress').css({rotate: '0deg'});
        status = 'stop';
    });

    // play/pause
    $('.zenPlayer .button').bind('mousedown', function() {
        // not sure if this can be done in a simpler way.
        // when you click on the edge of the play button, but button scales down and doesn't drigger the click,
        // so mouseleave is added to still catch it.
        $(this).bind('mouseleave', function() {
            $(this).unbind('mouseleave');
            onClick();
        });
    });

    $('.zenPlayer .button').bind('mouseup', function() {
        $(this).unbind('mouseleave');
        onClick();
    });

    function onClick() {
        if(status != 'play') {
            status = 'play';
            $('.zenPlayer').addClass( 'play' );
            player.jPlayer('play');
        } else {
            $('.zenPlayer .circle').removeClass( 'rotate' );
            $('.zenPlayer').removeClass( 'play' );
            status = 'pause';
            player.jPlayer('pause');
        }
    }

    // draggin
    var clickControl = $('.zenPlayer .drag');

    clickControl.grab({
        onstart: function(){
            dragging = true;
            $('.zenPlayer .button').css( 'pointer-events', 'none' );
        }, onmove: function(event){
            var pc = getArcPc(event.position.x, event.position.y);
            player.jPlayer('playHead', pc).jPlayer('play');
            displayProgress(pc);
        }, onfinish: function(event){
            dragging = false;
            var pc = getArcPc(event.position.x, event.position.y);
            player.jPlayer('playHead', pc).jPlayer('play');
            $('.zenPlayer .button').css( 'pointer-events', 'auto' );
        }
    });

    // functions
    function displayProgress(pc) {
        console.log('displayProgress');
        var degs = pc * 3.6+'deg';
        $('.zenPlayer .progress').css({rotate: degs});
    }

    function displayBuffered(pc) {
        console.log('displayBuffered');
        var degs = pc * 3.6+'deg';
        $('.zenPlayer .buffer').css({rotate: degs});
    }

    function getArcPc(pageX, pageY) {
        var self    = clickControl,
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
    }
});
