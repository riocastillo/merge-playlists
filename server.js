var express = require('express');
var app = express();
var axios = require('axios');
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

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.redirect('/login'); // spits out the html and respond
});

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

// Use the session middleware
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }))


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
    var scope = 'user-read-private user-read-email playlist-modify-private playlist-modify-public';
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

app.get('/playlists', (req, res) => {
    if (!req.session.accessToken) {
        res.redirect('/login')
    }
    var options = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: { 'Authorization': 'Bearer ' + req.session.accessToken },
        json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function (error, response, body) {
        let playlistURL = req.session.url
        let playlist = []
        for (let i = 0; i < body.items.length; i++) {
            playlist.push({ id: body.items[i].id, name: body.items[i].name, displayName: body.items[i].owner.display_name })
        }
        
        selected = req.session.selected
        if (selected) {
            // loop through the selected array 
            // we split it the playlist name 
            // loop through the playlist name array
            // grab the first index => make it uppercase
            // slice the remaining indexes => lowercase it
            // replace whats inside NameArr with formattedTitle
            // join the playlist name array
            for (let i = 0; i < selected.length; i++) {
                let name = selected[i].name
                let nameArr = name.split(" ")
                for (let j = 0; j < nameArr.length; j++) {
                    //each time we loop its going to be a different string
                    let formattedTitle = nameArr[j].charAt(0).toUpperCase() + nameArr[j].slice(1).toLowerCase()
                    nameArr[j] = formattedTitle
                }
                selected[i].name = nameArr.join(" ")
            }
        }

        res.render('index.ejs', {
            playlist,
            selected,
            playlistURL
        })
    });
})

app.post('/merged', async (req, res) => {
    let playlistUris = []
    let playlistId = ''
    let userId = ''
    let newPlaylistName = req.body.newPlaylistName

    const config = {
        headers: { Authorization: `Bearer ${req.session.accessToken}` }
    };

    if (!req.session.accessToken) {
        res.redirect('/login')
    }

    (async () => {
        for (let i = 0; i < req.body.selectedPlaylists.length; i++) {
            let playlistId = req.body.selectedPlaylists[i].id

            var bodyParameters = {
                json: true,
                limit: 50
            };

            try {
                const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, config)
                for (let i = 0; i < response.data.items.length; i++) {
                    playlistUris.push(response.data.items[i].track.uri)
                }
            }
            catch (error) {
                res.send(500, error)
                return
            }
        }
        playlistUris = [...new Set(playlistUris)]

        try {
            const userResults = await axios.get('https://api.spotify.com/v1/me', config)
            userId = userResults.data.id
        }
        catch (error) {
            res.send(500, error)
                return
        }

        var bodyParameters = {
            name: newPlaylistName
        };
        try {
            const playlistResponse = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, bodyParameters, config)
            playlistId = playlistResponse.data.id
            req.session.url = playlistResponse.data.external_urls.spotify
        }
        catch (error) {
            res.send(500, error)
                return
        }
        try {
            var bodyParameters = {
                uris: playlistUris
            }
            const playlistMutationResponse = await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, bodyParameters, config)
        }
        catch (error) {
            res.send(500, error)
                return
        }
        req.session.selected = req.body.selectedPlaylists

        res.redirect('/playlists')
    })();

})

app.listen(port);
console.log('The magic happens on port ' + port);
