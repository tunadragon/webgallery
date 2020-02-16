/*jshint esversion: 6 */

let api = (function(){
    let module = {};

    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id
            - (String) title
            - (String) author
            - (Date) date

        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date

        user objects
            - (String) _id (username)
            - (String) createdAt

    ****************************** */

    function send(method, url, data, callback){
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    function sendFiles(method, url, data, callback) {
        let formdata = new FormData();
        Object.keys(data).forEach(function(key){
            let value = data[key];
            formdata.append(key, value);
        });
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    /**** USER ****/
    // Create a new user account
    module.signup = function(username, password) {
        let data = {username:username, password:password};
        send('POST', '/signup/', data, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getUsernamePage(null);
        });
    };
    // Sign in to user account
    module.signin = function(username, password) {
        let data = {username:username, password:password};
        send('POST', '/signin/', data, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getUsernamePage(null);
        });
    };
    // Sign out
    module.signout = function() {
        send('DELETE', '/signout/', null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getUsernamePage(null);
        });
    };
    // Get current authenticated user
    let getUsername = function(){
        return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    };
    // Send a specific page of usernames to frontend
    module.getUsernamePage = function(page) {
        let query = (page==null) ? '' : '?page='+page;
        send('GET', '/api/users'+query , null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            return notifyUserHandlers(getUsername(), res, page);
        });
    };
    // Notify user listeners (currUser, pageUsers, page)
    let userHandlers = [];
    function notifyUserHandlers(username, pageUsers, page){
        userHandlers.forEach(function(handler){
            handler(username, pageUsers, page);
        });
    }
    module.onUserUpdate = function(handler){
        userHandlers.push(handler);
        // handler(getUsername());
        module.getUsernamePage(null);
    };



    /**** IMAGE ****/
    // Add image to the currently authenticated user
    module.addImage = function(title, file) {
        let data = {title: title, picture: file};
        sendFiles('POST', '/api/images/', data, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getUserGallery(res.author);
        });
    };
    // Delete an image as the currently authenticated user
    module.deleteImage = function(imageId){
        send('DELETE', '/api/images/'+imageId, null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getUserGallery(res.author);
        });
    };
    // Send all images belonging to a specific users gallery to frontend
    module.getUserGallery = function(username){
        send('GET', '/api/users/'+username+'/images/', null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            return notifyImageHandlers(username, res);
        });
    };
    // Notify image listeners (username, images)
    let imageHandlers = [];
    function notifyImageHandlers(username, images) {
        imageHandlers.forEach(function(handler){
            handler(username, images);
        });
    }
    // call handler when an image is added or deleted from the gallery
    module.onImageUpdate = function(handler){
        imageHandlers.push(handler);
    };



    /**** COMMENT ****/
    // Add comment to an image as the currently authenticated user
    module.addComment = function(imageId, content){
        let data = {content: content};
        send('POST', '/api/images/'+imageId+'/comments/', data, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getCommentPage(imageId, null);
        });
    };
    // Delete a comment as the currently authenticated user
    module.deleteComment = function(commentId){
        send('DELETE', '/api/comments/'+commentId, null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getCommentPage(res.imageId, null);
        });
    };
    // Send a specific comment page to frontend
    module.getCommentPage = function(imageId, page) {
        let query = (page==null) ? '' : '?page='+page;
        send('GET', 'api/images/'+imageId+'/comments'+query , null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            return notifyCommentHandlers(imageId, res, page);
        });
    };
    // Notify comment listeners (imageId, comments, page)
    let commentHandlers = [];
    function notifyCommentHandlers(imageId, comments, page) {
        commentHandlers.forEach(function(handler){
            handler(imageId, comments, page);
        });
    }
    // call handler when a comment is added or deleted to an image
    module.onCommentUpdate = function(handler){
        commentHandlers.push(handler);
    };




    /**** ERROR ****/
    let errorHandlers = [];
    function notifyErrorHandlers(err){
        errorHandlers.forEach(function(handler){
            handler(err);
        });
    }
    // call handler when error occurs
    module.onError = function(handler){
        errorHandlers.push(handler);
    };

    return module;
})();
