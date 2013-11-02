//for application bootstrap

App = new Backbone.Marionette.Application();

// add some Regions
App.addRegions({
    // drawRegion: Perber.Region.Draw,
    mainRegion: '#main',
    headerRegion: '#header',
    toolbarRegion:'#toolbar',
    sidebarRegion:'#sidebar',
    // videosRegion: "#videos",
    // overlayRegion: "#overlay",
    // loadingRegion: "#loadingWave",
    // modalRegion:Perber.Region.Modal,
});

App.addInitializer(function(){
    Perber.user = new Perber.Model.Me(Perber.config.user);
    
    Perber.user.start();
    Perber.users = new Perber.Collection.Users();

    Perber.activity = new Perber.Collection.ActivitysItems();

    // show main and speak pannel
    App.mainRegion.show(
        // new Perber.View.Speakpanel()
        new Perber.View.Activity({
            // new Perber.View.PerberItem()
            collection: Perber.activity,
            user : Perber.user
        })
    );

    App.headerRegion.show(
        new Perber.View.Navbar()
    );

    // App.toolbarRegion.show(
    //     new Perber.View.Toolbar(),
    // );

    App.sidebarRegion.show(
        new Perber.View.Sidebar()
    );


});

$(function(){
    App.start();
});

