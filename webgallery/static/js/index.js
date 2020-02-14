/*jshint esversion: 6 */
(function(){
    "use strict";

    window.onload = function(){
        let currImage = null;
        let currImageIndex = -1;
        let allImages = [];

        let currCommentPage = 0;
        let numComments = 0;

        api.onError(function(err){
            // show error message in console
            console.error('[error]'+ err);
            // show error message through DOM
            document.getElementById('error-message').innerText = err;
            document.getElementById('error-container').style.display = 'block';
        });

        // When an image is added or deleted from the gallery
        api.onImageUpdate(function(images){
            allImages = images;
            let imgDisplay = document.querySelector('#image-container');
            // if gallery is empty, hide image display
            if (images.length == 0) imgDisplay.style.display = 'none';
            else {
                if (currImageIndex == -1) currImageIndex = images.length-1; // if first image
                // check if index is out of bounds and fix it if so
                while(!images[currImageIndex] && currImageIndex >= -1){
                    currImageIndex -= 1;
                    currCommentPage = 0;
                }
                currImage = images[currImageIndex];
                reloadImage();
            }
        });

        // When a comment is added or deleted to an image
        api.onCommentUpdate(function(imageId, comments, page){
            if (imageId === currImage._id) {
                if (page == null) { // given all comments for current image
                    numComments = comments.length;
                    api.getCommentPage(currImage._id, currCommentPage);
                } else reloadComments(comments); // given specific page
            }
        });

        // Toggling (show/hide) add-image form
        document.querySelector('#toggle-add-image-btn').addEventListener('click', function(e){
            // https://stackoverflow.com/questions/19074171/how-to-toggle-a-divs-visibility-by-using-a-button-click
            let form = document.querySelector('#add-image-form');
            form.style.display = form.style.display == "none" ? "flex" : "none";
        });

        // Submitting Add-Image form
        document.getElementById('add-image-form').addEventListener('submit', function(e){
            e.preventDefault();
            let title = document.querySelector('#input-image-title').value;
            let author = document.querySelector('#input-image-author').value;
            let file = document.querySelector('#input-image-file').files[0];
            api.addImage(title, author, file);
            currImageIndex = allImages.length; // update current image to be new image
            document.getElementById('add-image-form').reset(); // clear form
        });

        // Deleting current image
        document.getElementById('delete-image-btn').addEventListener('click', function(e){
            api.deleteImage(currImage._id);
        });

        // Browsing through images
        document.querySelector('#prev-image-btn').addEventListener('click', function(e){
            changeCurrentImage(-1);
        });
        document.querySelector('#next-image-btn').addEventListener('click', function(e){
            changeCurrentImage(1);
        });

        // Submitting Add-comment form
        document.getElementById('add-comment-form').addEventListener('submit', function(e){
            e.preventDefault();
            let author = document.getElementById('input-comment-author').value;
            let text = document.getElementById('input-comment-text').value;
            api.addComment(currImage._id, author, text);
            document.getElementById('add-comment-form').reset(); // clear form
        });

        // Browsing comments
        document.querySelector('#older-comments-btn').addEventListener('click', function(e){
            changeCommentPage(1);
        });
        document.querySelector('#newer-comments-btn').addEventListener('click', function(e){
            changeCommentPage(-1);
        });

        // button to dismiss error message
        document.getElementById('hide-error-btn').addEventListener('click', function(e){
            document.getElementById('error-container').style.display = 'none';
        });

        // change current displayed image by given offset
        // (ie. +1 goes to next image, -1 goes to previous)
        // if there is not image at the offset, then change nothing
        function changeCurrentImage(offset) {
            let newImage = allImages[currImageIndex + offset];
            if (newImage != null) {
                // change page if possible and reset comment page to 0
                currImageIndex = currImageIndex + offset;
                currImage = allImages[currImageIndex];
                currCommentPage = 0;
                reloadImage();
            }
        }

        // change comment page for current image by given offset
        // if no comment page exists at offset, then do nothing
        function changeCommentPage(offset) {
            let maxPages = Math.ceil(numComments/10)-1;
            let newPage = currCommentPage + offset;
            if (0 <= newPage && newPage <= maxPages) {
                // change the current page
                currCommentPage = newPage;
                api.getCommentPage(currImage._id, newPage);
            }
        }

        // Display the image stored as the current image, along with its comments
        function reloadImage(){
            let imgDisplay = document.querySelector('#image-container');
            let title = currImage.title;
            let author = currImage.author;
            let date = currImage.createdAt;
            let src = '/api/images/'+currImage._id+'/picture/';
            // set and show new image
            document.querySelector('#image-title').innerText = title;
            document.querySelector('#image-author').innerText = author;
            document.querySelector('#image-date').innerText = new Date(date).toDateString();
            let imgElmt = document.createElement("img");
            imgElmt.src = src;
            imgElmt.alt = title;
            document.querySelector('#current-image').innerHTML = '';
            document.querySelector('#current-image').appendChild(imgElmt);
            // show/hide the prev/next-image buttons
            document.querySelector('#prev-image-btn').style.visibility = !allImages[currImageIndex-1] ? 'hidden' : '';
            document.querySelector('#next-image-btn').style.visibility = !allImages[currImageIndex+1] ? 'hidden' : '';

            api.getCommentPage(currImage._id, null);
            api.getCommentPage(currImage._id, currCommentPage); // load comments
            imgDisplay.style.display = 'flex';
        }

        // Display the current page of comments
        function reloadComments(comments){
            // remove all comments
            document.querySelector('#comment-list').innerHTML = '';
            // re-add all comments
            comments.forEach(function(comment){
                let id = comment._id;
                let author = comment.author;
                let date = comment.createdAt;
                let content = comment.content;
                let elmt = document.createElement('div');
                date = new Date(date).toDateString() +' '+ new Date(date).toLocaleTimeString();
                elmt.setAttribute('id', id);
                elmt.className = "comment";
                elmt.innerHTML=`
                    <div class="comment-content">
                        <div class="comment-header">
                            <p><span class="comment-author">${author}</span> &nbsp; <span class="comment-date">${date}</span></p>
                        </div>
                        <p class="comment-text">${content}</p>
                    </div>
                    <span class="icon delete-comment" title="delete-comment" tabindex="0"></span>
                `;
                // upvote, downvote, delete features
                elmt.querySelector('.delete-comment').addEventListener('click', function(e) {
                    api.deleteComment(id);
                });
                // add this element to the document
                document.querySelector('#comment-list').append(elmt);
            });
        }
    };
})();
