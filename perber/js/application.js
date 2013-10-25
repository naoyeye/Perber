Api = function(e) {
    return e.data = JSON.stringify(e.data), e.type != "GET" ? e.contentType = "application/json" : e.processData = !1, $.ajax(e)
},

Perber = {
    Model:{},
    View:{},
    Collection:{},
    Region:{},
    config:{}
};

// Model
Perber.Model.User = Backbone.Model.extend({
    defaults: {
        name: "Anonymous",
        conversation: null,
        still: null,
    },
})

Perber.Model.Me = Perber.Model.User.extend({
    defaults:{
        me:true,
        conversation:null,
        still:null,
        stream:null,
        busy:false,
        muted:false
    },
})

// View==========================

// Navbar
Perber.View.Navbar = Backbone.Marionette.ItemView.extend({
    template: '#template-navbar',
    id : 'navbarWrapper',
})

// Header
Perber.Region.Header = Backbone.Marionette.Region.extend({
    el: '#header',
})



// Sidebar
Perber.View.Sidebar = Backbone.Marionette.ItemView.extend({
    template: '#template-sidebar',
    id : 'sidebarWrapper',
    onRender:function(){
        this.$el.find('.sidebar').sidebar('attach events', '.toggle');
    }
})

// Speakpanel
Perber.View.Speakpanel = Backbone.Marionette.ItemView.extend({
    template: '#template-speakpanel',
    id : 'speakpanel'
})

Perber.View.Speakform = Backbone.Marionette.ItemView.extend({
    template: '#template-speakform',
})

// Toolbar
Perber.View.Toolbar = Backbone.Marionette.ItemView.extend({
    template : "#template-toolbar",
    tagName : "ul",
    slideSpeed:500,
    events:{
        "click  .leave":"leaveConversation",
        "click  .mute":"toggleMute",
        "click  .unmute":"toggleMute"
    },
    shortcuts:{
        esc:"leaveConversation"
    },
    initialize:function(){
        _.bindAll(this,"render");
    },
    onRender:function(){
        // $(".tipsy").remove(), 
        // this.$("a").tipsy({
        //     fade: !0,
        //     gravity: "w"
        // })
    },
    leaveConversation:function(e){
        this.slideOut(),
        this.model.leaveConversation({
            error:this.slideIn
        })
    },
    toggleMute:function(){
        this.model.get("muted") ? this.model.unmuteAudio() : this.model.muteAudio()
    },
    updateVisible:function(e,t){
        t ? this.slideIn() : this.slideOut()
    },
    slideIn:function(){
        this.$el.animate({
            top:10,
            opacity:1
        },this.slideSpeed);
    },
    slideOut:function(){
        var e = -($('#main_menus').height() + 100);
        this.$el.animate({
            top: e + "px",
            opacity:0
        },this.slideSpeed);
    }
});

// 主界面 - 窗口渲染 
Perber.Region.Main = Backbone.Marionette.Region.extend({
    el: '#main',
});
