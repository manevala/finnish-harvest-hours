const express = require('express');
const request = require('superagent');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');

const app = express()

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    // console.log('user: ', user);
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(
    'oauth2',
    new OAuth2Strategy({
            authorizationURL: 'https://wunderdog.harvestapp.com/oauth2/authorize',
            tokenURL: 'https://wunderdog.harvestapp.com/oauth2/token',
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: 'https://saldot.herokuapp.com/auth/callback'
        },
        function(accessToken, refreshToken, profile, done) {
            request
                .get('https://wunderdog.harvestapp.com/account/who_am_i')
                .type('json')
                .accept('json')
                .query({
                    access_token: accessToken
                })
                .end((err, res) => {
                    const harvestUser = res.body.user;
                    const user = {
                        id: harvestUser.id,
                        firstName: harvestUser.first_name,
                        lastName: harvestUser.last_name
                    }
                    done(null, user);
                });
            // User.findOrCreate(..., function(err, user) {
            //     done(err, user);
            // });
        }
    ));

app.get('/login', passport.authenticate('oauth2'));

app.get(
    '/auth/callback',
    passport.authenticate('oauth2', {
        failureRedirect: '/error'
    }),
    function(req, res) {
        res.end(`${req.user.firstName} ${req.user.lastName} logged in.`);
    });

app.use('/', express.static(__dirname + '/dist'));

const port = process.env.PORT || 8080;
app.listen(port);
console.log('Server listening in port: ' + port);