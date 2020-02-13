/*jshint esversion: 6 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const multer  = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads')});

const Datastore = require('nedb');
let images = new Datastore({ filename: path.join(__dirname,'db', 'images.db'), autoload: true, timestampData : true});
let comments = new Datastore({ filename: path.join(__dirname,'db', 'comments.db'), autoload: true, timestampData : true});


// ******** Image API ********
let Image = (function() {
    return function image(image){
        // _id is auto-generated
        this.title = image.title.toString();
        this.author = image.author.toString();
        this.path = image.path;
        this.mimetype = image.mimetype;
    };
})();

// Add a new image to the gallery
app.post('/api/images/', upload.single('picture'), function(req, res, next){
    // Check that correct data was given (title, author, file)
    if (!(req.body.title && req.body.author && req.file)) res.status(400).json({message: 'Request body is missing arguments.'});
    else {
        // Store image in uploads and its data in database
        let data = req.body;
        data.path = req.file.path;
        data.mimetype = req.file.mimetype;
        images.insert(new Image(data), function (err, image) {
            if (err) return res.status(500).json({message: err});
            return res.json(image);
        });
    }
});

// Get a specific image and its metadata given its image id
app.get('/api/images/:imageId/', function(req, res, next){
    images.findOne({_id: req.params.imageId}, function(err, image){
        if (err) return res.status(500).json({message: err});
        if (!image) return res.status(404).json({message: 'Image does not exist.'});
        return res.json(image);
    });
});

// Get a specific image as a picture given its image id
app.get('/api/images/:imageId/picture', function(req, res, next){
    images.findOne({_id: req.params.imageId}, function(err, image){
        if (err) return res.status(500).json({message: err});
        if (!image) return res.status(404).json({message: 'Image does not exist.'});
        res.setHeader('Content-Type', image.mimetype);
        return res.sendFile(image.path);
    });
});

// Get all images in the webgallery (sort by least recent to most recent)
app.get('/api/images/', function(req, res, next){
    images.find({}).sort({createdAt:1}).exec(function(err, all){
        if (err) return res.status(500).json({message: err});
        return res.json(all);
    });
});

// Delete a specific image given its image id
app.delete('/api/images/:imageId/', function(req, res, next){
    // Delete image from database
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).json({message: err});
        if (!image) return res.status(404).json({message: 'Image does not exist.'});
        images.remove({_id: imageId}, {}, function(err, num){
            if (err) return res.status(500).json({message: err});
            // Delete image file from uploads folder
            fs.unlink(image.path, function(err) {
                if (err) return res.status(500).json({message: 'Could not delete image file.'});
                return res.json(image);
            });
        });
    });
    // Delete all comments for the image as well
    comments.remove({imageId: imageId}, {multi: true});
});


// ******** Comment API ********
let Comment = (function() {
    return function comment(comment){
        // _id is auto-generated
        this.imageId = comment.imageId;
        this.author = comment.author.toString();
        this.content = comment.content.toString();
    };
})();

// Add a comment to a given image
app.post('/api/images/:imageId/comments/', function(req, res, next){
    // Check that given image exists
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).json({message: err});
        else if (!image) return res.status(404).json({message: 'Image does not exist.'});
        // Check that correct data was given (author, content)
        else if (!(req.body.author && req.body.content)) return res.status(400).json({message: 'Request body is missing arguments.'});
        else { // Store comment in database
            let data = req.body;
            data.imageId = imageId;
            comments.insert(new Comment(data), function (err, comment) {
                if (err) return res.status(500).json({message: err});
                return res.json(comment);
            });
        }
    });
});

// Get a page of comments for a given image
// GET /api/images/:imageId/comments/[?page=0]
app.get('/api/images/:imageId/comments/', function(req, res, next){
    // check if given image id exists
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).json({message: err});
        else if (!image) return res.status(404).json({message: 'Image does not exist.'});
        else {
            let page = req.query.page;
            let callback = function(err, pageComments){
                if (err) return res.status(500).json({message: err});
                return res.json(pageComments);
            };
            if (!page) { // if no query paramater given, get all comments of the image
                comments.find({imageId: imageId}).sort({createdAt:-1}).exec(callback);
            } else {
                // get all comments for given image,
                // sort by date created in descending order (most recent to least recent),
                // skip by page*10,
                // limit 10 comments per page
                comments.find({imageId: imageId}).sort({createdAt:-1}).skip(page*10).limit(10).exec(callback);
            }
        }
    });
});

// Delete a specific comment given its comment id
app.delete('/api/comments/:commentId/', function(req, res, next){
    // Delete comment from database
    let commentId = req.params.commentId;
    comments.findOne({_id: commentId}, function(err, comment){
        if (err) return res.status(500).json({message: err});
        if (!comment) return res.status(404).json({message: 'Comment does not exist.'});
        comments.remove({_id: commentId}, {}, function(err, num){
            res.json(comment);
        });
    });
});

app.use(express.static('static'));

const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
