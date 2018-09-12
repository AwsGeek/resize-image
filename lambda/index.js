var async = require('async');
var util = require('util');
var AWS = require('aws-sdk');
var gm = require('gm').subClass({ imageMagick: true });

var imageWidth = process.env.WIDTH
var imageHeight = process.env.HEIGHT
var outputBucket = process.env.BUCKET
var outputPrefix = process.env.PREFIX

var s3 = new AWS.S3();
 
exports.handler = function(event, context, callback) {

    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));

    var inputBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    var inputKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    async.waterfall([

        function downloadImage(next) {
            console.log('Downloading ' + inputBucket + '/' + inputKey);

            // Download the PDF locally for conversio
            s3.getObject({ Bucket: inputBucket,
                           Key: inputKey
                         }, function(err, response) {  
                if (err) {
                    next(err);   
                } else {
                    next(null, response.Body, response.ContentType);
                }
            });
        },

        function resizeImage(data, type, next) {

            // Resize the image to specified dimensions
            console.log('Resizing ' + inputBucket + '/' + inputKey);
            gm(data).size(function(err, size) {
                this.resize(imageWidth, imageHeight)
                .toBuffer(function(err, buffer) {
                    if (err) {
                         next(err);
                   } else {
                        next(null, buffer, type);
                   }
                });
            });
        },

        function uploadImage(data, type, next) {

            var inputBasename = inputKey.replace(/\\/g,'/').replace(/.*\//, '');  
            var outputKey = outputPrefix + '/' + inputBasename;

            console.log('Uploading ' + outputBucket + '/' + outputKey);
            // Upload the image to S3 and make publicly accessible
            s3.putObject({ Bucket: outputBucket,
                           Key: outputKey, 
                           Body: data,
                           ContentType: type
                         }, function(err, response) {
                if (err) {
                    next(err);
                } else {
                    next(null);
                }
            });
        }], 

        function (err) {
            if (err) {
                console.error(
                    'Unable to process ' + inputBucket + '/' + inputKey +
                    ' due to an error: ' + err
                );
            } else {
                console.log(
                    'Successfully processed ' + inputBucket + '/' + inputKey 
                );
            }
            callback(null, "message");
        }
    );
};
