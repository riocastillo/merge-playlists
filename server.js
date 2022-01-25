var express = require('express');
var app = express();
var session = require('express-session')
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request'); // "Request" library
require('dotenv').config();
var port = process.env.PORT || 2222;
var client_id = process.env.CLIENT_ID
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

// Use the session middleware
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }))


// var configDB = require('./config/database.js');
// var db

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';


app.get('/login', function (req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state); // setting a cookie to a random value

    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    console.log('state:', state, 'stored state:', storedState)
    console.log(req.cookies, 'cookies')
    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                req.session.accessToken = access_token;


                // we can also pass the token to the browser to make requests from there
                res.redirect('/playlists');
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});


app.get('/playlists', (req, res) => {
    console.log(req.session, 'session')
    // next steps: use spotify docs to load playlist so they can select some

    var options = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: { 'Authorization': 'Bearer ' + req.session.accessToken },
        json: true
    };

    // use the access token to access the Spotify Web API
    // this is the callback from our url
    request.get(options, function (error, response, body) {
        res.send(body);
        // with the ids we can target exact playlists and we need the playlist id for the put requests to update the merged playlists
        console.log(body.items[0].id)
        console.log(body.items[0].href)
    });
})

app.listen(port);
console.log('The magic happens on port ' + port);
