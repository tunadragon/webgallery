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

    // add an image to the gallery
    module.addImage = function(title, author, file){
        let data = {title: title, author: author, picture: file};
        sendFiles('POST', '/api/images/', data, function(err, res){
            if (err) return notifyErrorListeners(err);
            notifyImageHandlers();
        });
    };

    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId){
        send('DELETE', '/api/images/'+imageId, null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            notifyImageHandlers();
        });
    };

    // add a comment to an image
    module.addComment = function(imageId, author, content){
        let data = {author: author, content: content};
        send('POST', '/api/images/'+imageId+'/comments/', data, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getCommentPage(imageId, null, null);
        });
    };

    // delete a comment from an image
    module.deleteComment = function(commentId){
        send('DELETE', '/api/comments/'+commentId, null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            module.getCommentPage(res.imageId, null, null);
        });
    };

    let getImages = function(callback){
        send('GET', '/api/images/', null, callback);
    };

    let imageHandlers = [];
    function notifyImageHandlers() {
        getImages(function(err, res){
            if (err) return notifyErrorHandlers(err);
            imageHandlers.forEach(function(handler){
                handler(res);
            });
        });
    }
    // call handler when an image is added or deleted from the gallery
    module.onImageUpdate = function(handler){
        imageHandlers.push(handler);
        getImages(function(err, res){
            if (err) return notifyErrorHandlers(err);
            handler(res);
        });
    };

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

    // send a specific comment page through notifying comment listeners
    module.getCommentPage = function(imageId, page) {
        let query = (page==null) ? '' : '?page='+page;
        send('GET', 'api/images/'+imageId+'/comments'+query , null, function(err, res){
            if (err) return notifyErrorHandlers(err);
            return notifyCommentHandlers(imageId, res, page);
        });
    };

    // refresh every 2 seconds
    (function refresh(){
        setTimeout(function(e){
            notifyImageHandlers();
            refresh();
        }, 2000);
    }());

    return module;
})();
