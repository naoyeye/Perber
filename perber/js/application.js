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
