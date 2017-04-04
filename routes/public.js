const express = require('express');
const config = require('../config/config');
const jwt = require('jwt-simple');
const passport = require('passport');
require('../config/passport')(passport);
const User = require('../models/user');
const responseFactory = require("../util/responseFactory");
const recaptcha = require('express-recaptcha');

function PublicRouter(app) {
    let router = express.Router()

    router.get('/', function(req, res) {
        return responseFactory.sendRenderedResponse("public/index", req, res);
    })

    router.get('/signin', function(req, res) {
        if (req.user) return res.redirect("/");
        return responseFactory.sendRenderedResponse("public/signin", req, res);
    })

    router.post('/signin', function(req, res, next) {
        if (req.user) return res.redirect("/");
        if (!req.body.username || !req.body.password) return responseFactory.sendRenderedResponse("public/signin", req, res, { error: { message: "A username and password are required." }, username: req.body.username });
        passport.authenticate('local', function(err, user, info) {
            if (!user) return responseFactory.sendRenderedResponse("public/signin", req, res, { error: info.error || { message: "An unknown error occurred." }, username: req.body.username });
            req.login(user, function(err) {
                if (err) return responseFactory.sendRenderedResponse("public/signin", req, res, { error: { message: "An unknown error occurred." }, username: req.body.username });
                return res.redirect("/?signedin=1");
            });
        })(req, res, next);
    })

    router.get('/signup', function(req, res) {
        if (req.user) return res.redirect("/");
        return responseFactory.sendRenderedResponse("public/signup", req, res, { captcha: recaptcha.render() });
    })

    router.post('/signup', function(req, res, next) {
        if (req.user) return res.redirect("/");
        if (!req.body.username || !req.body.password || !req.body.passwordverify) return responseFactory.sendRenderedResponse("public/signup", req, res, { captcha: recaptcha.render(), error: { message: "Please fill out all the fields." }, username: req.body.username });
        if (req.body.password != req.body.passwordverify) return responseFactory.sendRenderedResponse("public/signup", req, res, { captcha: recaptcha.render(), error: { message: "The passwords you entered did not match." }, username: req.body.username });
        User.register(req.body.username, req.body.password, function(user, error) {
            if(!user) return responseFactory.sendRenderedResponse("public/signup", req, res, { captcha: recaptcha.render(), error: error || {message: "An unknown error occurred."}, username: req.body.username });
            req.login(user, function(err) {
                if (err) return responseFactory.sendRenderedResponse("public/signup", req, res, { captcha: recaptcha.render(), error: { message: "An unknown error occurred." }, username: req.body.username });
                return res.redirect("/?signedup=1");
            });
        });
    })

    router.get('/signout', function(req, res) {
        req.logout();
        res.redirect("/?signedout=1");
    })

    return router;
}

PublicRouter.prototype = Object.create(PublicRouter.prototype);

module.exports = PublicRouter;