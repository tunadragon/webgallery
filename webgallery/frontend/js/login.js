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

        api.onUserUpdate(function(username){
            if (username) window.location.href = '/';
        });

        // button to show login form
        document.getElementById('goto-login-btn').addEventListener('click', function(e){
            showLoginForm();
        });

        // button to show sign up form
        document.getElementById('goto-signup-btn').addEventListener('click', function(e){
            showLoginForm(false);
        });

        // Submitting Log in form`
        document.getElementById('login-form').addEventListener('submit', function(e){
            e.preventDefault();
            let username = document.getElementById('input-login-username').value;
            let password = document.getElementById('input-login-password').value;
            api.signin(username, password);
            document.getElementById('login-form').reset();
        });

        // Submitting Sign up form
        document.getElementById('signup-form').addEventListener('submit', function(e){
            e.preventDefault();
            let username = document.getElementById('input-signup-username').value;
            let password = document.getElementById('input-signup-password').value;
            api.signup(username, password);
            document.getElementById('signup-form').reset();
            showLoginForm();
        });

        // only show login form by default
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('signup-container').style.display = 'none';

        function showLoginForm(login=true){
            document.getElementById('login-container').style.display = login ? 'block': 'none';
            document.getElementById('signup-container').style.display = login ? 'none': 'block';
        }
    };
})();
