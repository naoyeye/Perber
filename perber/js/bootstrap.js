//for application bootstrap

App = new Backbone.Marionette.Application();

// add some Regions
App.addRegions({
    drawRegion: Perber.Region.Draw,
    mainRegion: Perber.Region.Main,
    overlayRegion: "#overlay",
    loadingRegion: "#loadingWave",
    modalRegion:Workor.Region.Modal,
});

$(function(){
    App.start();
});
