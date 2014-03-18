/* 
* @Author: hanjiyun
* @Date:   2014-03-15 20:16:27
* @Last Modified by:   hanjiyun
* @Last Modified time: 2014-03-15 20:18:01
*/


$(function() {
    function getSize() {
        t.w = $(window).width(),
        t.h = $(window).height()
    }

    $(window).bind("load", function() {
        window.scrollTo(0, 1)
    })

    var e = 0,
        t = {};

    getSize();

    $(window).resize(function() {
        getSize();
    })
    var r = {
        e: $("#pupils")
    };
    r.x = parseInt(r.e.css("left")),
    r.y = parseInt(r.e.css("top"));

    $(document).mousemove(function(e) {
        var n = {
            x: e.pageX / t.w * 2 - 1,
            y: e.pageY / t.h * 2 - 1
        };
        r.moveX = parseInt(n.x * 6 + r.x),
        r.moveY = parseInt(n.y * 4 + r.y),
        r.e.css({
            left: r.moveX,
            top: r.moveY
        })
    });
});
