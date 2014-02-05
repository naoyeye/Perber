/* 
* @Author: hanjiyun
* @Date:   2013-11-03 04:47:51
* @Email:  jiyun@han.im
* @Last modified by:   hanjiyun
* @Last Modified time: 2014-02-06 00:45:37
*/


/*
* Module dependencies
*/

var utils = require('../utils'),
    fs = require('fs');

/**
 * Expose routes
 */

module.exports = Routes;

/**
 * Defines routes for application
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Routes (app) {
    var config = app.get('config');
    var client = app.get('redisClient');
    var imagesBucket = app.get('imagesBucket');
  
    /*
    * Homepage
    */

    app.get('/', function(req, res, next) {
        res.render('room');
    });

    // uoload image
    app.post('/upload', function(req, res, next) {
        // // console.log('======================')
        // // console.log('req:==', req.files.PerberImage.name)
        var key = new Date().getTime(),
            data = req.files.PerberImage;

        // console.log('key', key)
        // var image = imagesBucket.image(key);

        // var puttingStream = imagesBucket.createPutStream(key);
        // var readingStream = fs.createReadStream(data.path);

        // readingStream.pipe(puttingStream)
        // .on('error', function(err) {
        //     console.error(err);
        //     res.json(err)
        // })
        // .on('progress', function(progress) {
        //     console.log('progress', progress);
        // })
        // .on('end', function(reply) {
        //     // 上传成功
        //     console.log('reply', reply)
        //     res.json(reply)
        // });

        imagesBucket.putFile(
            key, // new file name
            data.path // file path
        ).then(
            function(reply){
                // 上传成功
                // console.dir(reply);
                res.json(reply)
                // imageProcess();
            },
            function(err){
                // console.log(err);
                res.json(err)
            }
        )

        // imageProcess = function(){
        //     image.imageView({
        //             mode    : 1,
        //             width   : 600,
        //             height  : 600,
        //             quality : 100,
        //             format  : 'jpg'
        //         },
        //         function(err, imageData) {
        //             if (err) {
        //                 return console.error(err);
        //             }
        //             // imageData 为处理过后的图像数据
        //             res.json({status: 'success', img: imageData})
        //         }
        //     );
        // }
    });
    
    // delete image
    app.post('/delete', function(req, res, next){
        var key = req.body.key;
        imagesBucket.key(key).remove(
            function(err) {
                if (err) {
                    res.json(err)
                } else {
                    res.json({status:'success'})
                }
            }
        );
    });


}
