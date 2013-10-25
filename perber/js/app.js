//for application bootstrap

App = new Backbone.Marionette.Application();

// add some Regions
App.addRegions({
    // drawRegion: Perber.Region.Draw,
    mainRegion: Perber.Region.Main,
    headerRegion: Perber.Region.Header,
    toolbarRegion:'#toolbar',
    sidebarRegion:'#sidebar',
    // overlayRegion: "#overlay",
    // loadingRegion: "#loadingWave",
    modalRegion:Perber.Region.Modal,
});

App.addInitializer(function(){
    // show main and speak pannel
    App.mainRegion.show(
        new Perber.View.Speakpanel()
    )


    App.headerRegion.show(
        new Perber.View.Navbar()
    )

    App.toolbarRegion.show(
        new Perber.View.Toolbar()
    )
    App.sidebarRegion.show(
        new Perber.View.Sidebar()
    )
});

$(function(){
    App.start();
});

