var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var cors = require('cors');
var querystring = require('querystring');
var request = require('request'); // "Request" library
require('dotenv').config();
var port = process.env.PORT || 2222;
var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI
var bodyParser = require('body-parser');

app.get('/', function (req, res) {
    res.render('index.ejs'); // spits out the html and respond
  });

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

// Use the session middleware
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))


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
    res.cookie(stateKey, state);

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

app.get('/playlists', (req, res)=>{
    console.log('is this the right token?', req.session.accessToken)

    var options = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: { 'Authorization': 'Bearer ' + req.session.accessToken },
        json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function (error, response, body) {
        res.send(body);

        let playlistNames = []
        for(let i = 0; i < body.items.length; i++){
            playlistNames.push(body.items[i].name)
        }
        console.log(playlistNames)
    });
})



app.listen(port);
console.log('The magic happens on port ' + port);
