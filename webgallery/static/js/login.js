/*jshint esversion: 6 */
(function(){
    "use strict";

    window.onload = function(){
        api.onError(function(err){
            // show error message in console
            console.error('[error]'+ err);
            // show error message through DOM
            document.getElementById('error-message').innerText = err;
            document.getElementById('error-container').style.display = 'block';
        });

        // button to dismiss error message
        document.getElementById('hide-error-btn').addEventListener('click', function(e){
            document.getElementById('error-container').style.display = 'none';
        });

        // button to show login form
        document.getElementById('goto-login-btn').addEventListener('click', function(e){
            document.getElementById('login-container').style.display = 'block';
            document.getElementById('signup-container').style.display = 'none';
        });

        // button to show sign up form
        document.getElementById('goto-signup-btn').addEventListener('click', function(e){
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('signup-container').style.display = 'block';
        });

        // only show login form by default
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('signup-container').style.display = 'none';
    };
})();
