/*jshint esversion: 6 */
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const multer  = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads')});

const session = require('express-session');
app.use(session({
    secret: 'the secret is changed',
    resave: false,
    saveUninitialized: true,
}));

const cookie = require('cookie');

const Datastore = require('nedb');
let users = new Datastore({ filename: path.join(__dirname,'db', 'users.db'), autoload: true, timestampData : true});
let images = new Datastore({ filename: path.join(__dirname,'db', 'images.db'), autoload: true, timestampData : true});
let comments = new Datastore({ filename: path.join(__dirname,'db', 'comments.db'), autoload: true, timestampData : true});

let isAuthenticated = function(req, res, next) {
    if (!req.session.username) return res.status(401).end("Access denied.");
    return next();
};

app.use(function (req, res, next){
    console.log("HTTP request", req.session.username, req.method, req.url, req.body);
    next();
});

// ******** User API ********
// TODO Register a new user
app.post('/signup/', function(req, res, next){
    // extract credentials from http request
    if (!('username' in req.body) || !('password' in req.body)) return res.status(400).end('Request body is missing arguments.');
    if (req.body.username == '' || req.body.password == '') return res.status(400).end('Username and password cannot be empty.');
    let username = req.body.username;
    let password = req.body.password;
    // check if user already exists
    users.findOne({_id:username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end('Username already exists.');
        // generate salt for user and password hash
        bcrypt.genSalt(10, function(err, salt){
            if (err) return res.status(500).end(err);
            bcrypt.hash(password, salt, function(err, hash){
                if (err) return res.status(500).end(err);
                // insert user into database
                users.insert({_id: username, hash: hash}, function(err, user){
                    if (err) return res.status(500).end(err);
                    return res.json('Account successfully created.');
                });
            });
        });
    });
});

// TODO Log in as an existing user (create session)
app.post('/signin/', function(req, res, next){
    // extract credentials from http request
    if (!('username' in req.body) || !('password' in req.body)) return res.status(400).end('Request body is missing arguments.');
    let username = req.body.username;
    let password = req.body.password;
    // retrieve user with username
    users.findOne({_id:username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end('Access denied.'); //user DNE
        // compare hash
        bcrypt.compare(password, user.hash, function(err, valid){
            if (err) return res.status(500).end(err);
            if (!valid) return res.status(401).end('Access denied'); //incorrect credentials
            // start a session
            req.session.username = username;
            res = refreshCookie(req, res);
            return res.json('User ' + username + ' has been signed in.');
        });
    });
});

// TODO Retrive page of usernames
app.get('/api/users/', function(req, res, next){
    let page = req.query.page;
    let callback = function(err, all) {
        if (err) return res.status(500).end(err);
        let users = [];
        all.forEach(function(user){
            users.push({_id:user._id, createdAt:user.createdAt});
        });
        res = refreshCookie(req, res);
        return res.json(users);
    };

    if (!page) { // if no query paramater given, get all users
        users.find({}).sort({createdAt:-1}).exec(callback);
    } else {
        users.find({}).sort({createdAt:-1}).skip(page*10).limit(10).exec(callback);
    }
});

// TODO Log out of the app (delete session)
app.delete('/signout/', function(req, res, next){
    res = refreshCookie(req, res);
    req.session.destroy();
    return res.json('User has been signed out.');
});


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

// Add a new image to the authenticated user's gallery
app.post('/api/images/', isAuthenticated, upload.single('picture'), function(req, res, next){
    // Check that correct data was given (title, author, file)
    if (!(req.body.title && req.file)) res.status(400).end('Request body is missing arguments.');
    else {
        // Store image in uploads and its data in database
        let data = req.body;
        data.author = req.session.username;
        data.path = req.file.path;
        data.mimetype = req.file.mimetype;
        images.insert(new Image(data), function (err, image) {
            if (err) return res.status(500).end(err);
            return res.json(image);
        });
    }
});

// Get a specific image and its metadata given its image id (user must be authenticated)
app.get('/api/images/:imageId/', isAuthenticated, function(req, res, next){
    images.findOne({_id: req.params.imageId}, function(err, image){
        if (err) return res.status(500).end(err);
        if (!image) return res.status(404).end('Image does not exist.');
        return res.json(image);
    });
});

// Get a specific image as a picture given its image id (user must be authenticated)
app.get('/api/images/:imageId/picture', isAuthenticated, function(req, res, next){
    images.findOne({_id: req.params.imageId}, function(err, image){
        if (err) return res.status(500).end(err);
        if (!image) return res.status(404).end('Image does not exist.');
        res.setHeader('Content-Type', image.mimetype);
        return res.sendFile(image.path);
    });
});

// TODO Get a specific user's gallery (user must be authenticated)
app.get('/api/users/:username/images/', isAuthenticated, function(req, res, next){
    // filter images by author username
    images.find({author: req.params.username}).sort({createdAt:1}).exec(function(err, all){
        if (err) return res.status(500).end(err);
        return res.json(all);
    });
});

// Delete a specific image given its image id (authenticated user must be the author)
app.delete('/api/images/:imageId/', isAuthenticated, function(req, res, next){
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).end(err);
        if (!image) return res.status(404).end('Image does not exist.');
        // TODO Check if current session user is the author of the image
        if (req.session.username == image.author) {
            // Delete image from database
            images.remove({_id: imageId}, {}, function(err, num){
                if (err) return res.status(500).end(err);
                // Delete image file from uploads folder
                fs.unlink(image.path, function(err) {
                    if (err) return res.status(500).end('Could not delete image file.');
                    return res.json(image);
                });
            });
            // Delete all comments for the image as well
            comments.remove({imageId: imageId}, {multi: true});
        } else {
            return res.status(401).end("Access denied.");
        }
    });
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

// Add a comment to a given image (user must be authenticated)
app.post('/api/images/:imageId/comments/', isAuthenticated, function(req, res, next){
    // Check that given image exists
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).end(err);
        else if (!image) return res.status(404).end('Image does not exist.');
        // Check that correct data was given (author, content)
        else if (!req.body.content) return res.status(400).end('Request body is missing arguments.');
        else { // Store comment in database
            let data = req.body;
            data.author = req.session.username;
            data.imageId = imageId;
            comments.insert(new Comment(data), function (err, comment) {
                if (err) return res.status(500).end(err);
                return res.json(comment);
            });
        }
    });
});

// Get a page of comments for a given image
// GET /api/images/:imageId/comments/[?page=0]
app.get('/api/images/:imageId/comments/', isAuthenticated, function(req, res, next){
    // check if given image id exists
    let imageId = req.params.imageId;
    images.findOne({_id: imageId}, function(err, image){
        if (err) return res.status(500).end(err);
        else if (!image) return res.status(404).end('Image does not exist.');
        else {
            let page = req.query.page;
            let callback = function(err, pageComments){
                if (err) return res.status(500).end(err);
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

// Delete a specific comment given its comment id (authenticated user must be the author)
app.delete('/api/comments/:commentId/', isAuthenticated, function(req, res, next){
    let commentId = req.params.commentId;
    comments.findOne({_id: commentId}, function(err, comment){
        if (err) return res.status(500).end(err);
        if (!comment) return res.status(404).end('Comment does not exist.');
        // TODO check if current session user matches the auther of the comment OR the owner of the gallery
        images.findOne({_id: comment.imageId}, function(err, currImage) {
            if (err) return res.status(500).end(err);
            if (req.session.username == comment.author || req.session.username == currImage.author) {
                // Delete comment from database
                comments.remove({_id: commentId}, {}, function(err, num){
                    if (err) return res.status(500).end(err);
                    return res.json(comment);
                });
            } else {
                return res.status(401).end("Access denied.");
            }
        });
    });
});

let refreshCookie = function(req, res){
    let u = req.session.username;
    if (!u) u = '';
    res.setHeader('Set-Cookie', cookie.serialize('username', u, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    }));
    return res;
};

app.use(express.static('frontend'));

const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
