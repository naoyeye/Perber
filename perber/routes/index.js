/* 
* @Author: hanjiyun
* @Date:   2013-11-03 04:47:51
* @Email:  jiyun@han.im
* @Last modified by:   hanjiyun
* @Last Modified time: 2014-02-28 14:52:21
*/


/*
* Module dependencies
*/

var utils = require('../utils'),
    fs = require('fs'),
    qiniu = require('qiniu');

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
    var mysql = app.get('mysqlClient');
    var imagesBucket = app.get('imagesBucket');
  
    /*
    * Homepage
    */

    app.get('/', function(req, res, next) {
        res.render('room', { bucket_name: config.qiniuConfig.bucket_name });
    });




    // upload image
    app.post('/upload', function(req, res, next) {
        // // console.log('======================')
        // // console.log('req:==', req.files.PerberImage.name)
        var key = new Date().getTime(),
            data = req.files.PerberImage;

        // console.log('key', key)
        // var image = imagesBucket.image(key);

        // var puttingStream = imagesBucket.createPutStream(key);
        // var readingStream = fs.createReadStream(data.path);
        // var fileSize = req.headers['content-length'];
        // var uploadedSize = 0;

        // console.log('fileSize = ', fileSize)

        // readingStream.pipe(puttingStream).on('data', function(chunk) {

        //     console.log('chunk.length', chunk.length);

        //     uploadedSize += chunk.length;
        //     console.log('uploadedSize = ', uploadedSize)
        //     uploadProgress = (uploadedSize/fileSize) * 100;
        //     console.log('uploadProgress = ', Math.round(uploadProgress) + "%")
        //     // res.write(Math.round(uploadProgress) + "%" + " uploaded\n" );
        //     // var bufferStore = puttingStream.write(chunk);
        //     // if(bufferStore == false) req.pause();

        //     res.json({ progress : uploadProgress })

        // })

        // readingStream.pipe(puttingStream)
        // // .on('error', function(err) {
        // //     console.error(err);
        // //     res.json(err)
        // // })
        // .on('drain', function() {
        //     req.resume();
        // })
        // .on('end', function() {
        //     // 上传成功
        //     // console.dir('reply', reply)
        //     // res.json(reply)
        //     // res.write('Upload done!');
        //     // res.end();
        // });

        // imagesBucket.putFile(
        //     key, // new file name
        //     data.path // file path
        // ).then(
        //     function(reply){
        //         // 上传成功
        //         // console.dir(reply);
        //         res.json(reply)
        //         // imageProcess();
        //     },
        //     function(err){
        //         // console.log(err);
        //         res.json(err)
        //     }
        // )

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

        var imgKey = [key];

        // 先去数据库里查询此图片key是不是存在, 防止恶意批量删除
        mysql.query( 'SELECT * FROM Images WHERE imgKey = ?', imgKey, function selectCb(error, results, fields) {
            if (error) {  
                console.log('GetData Error: ' + error.message);
                mysql.end();
                return;
            }

            // console.log('results:', results);

            if(results.length > 0) return;

            imagesBucket.key(key).remove(
                function(err) {
                    if (err) {
                        res.json({status:'err', message: err})
                    } else {
                        res.json({status:'success'})
                    }
                }
            );
        });

    });


    app.post('/sign', function(req, res, next){
        // console.log(req.body)
        var bucketname = config.qiniuConfig.bucket_name;
        var putPolicy = new qiniu.rs.PutPolicy(bucketname);
        var token = putPolicy.token();
        res.json({token : token})
        // console.log('sign!!!!!!!!')
    })


}
