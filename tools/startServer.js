/*
 * Starts up the blog middleware in an Express app.
 * The blog will be mounted at '/'
 */

var nconf = require('nconf');
var http = require('http');
var express = require('express');

// The blog
var blog = require('../dist/express-blog-middleware').default;
var app = express();
app.use('/', blog({ postsDirectory: 'posts' }));

// Prefer command line args to environment variables
nconf
    .argv()
    .env()

    // Defaults
    .defaults({
        PORT: 3000,
        HOST: 'localhost'
    });

var port = nconf.get('PORT');
http.createServer(app).listen(port);
