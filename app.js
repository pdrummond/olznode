
 /**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , winston = require('winston')
  , pg = require("pg")
  , uuid = require('node-uuid')
  , bcrypt = require('bcrypt')
  , passport = require('passport')
  , BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
    function(username, password, done) {
        pg.connect(process.env.DATABASE_URL, function(err, client) {
            if(err) {
                return done(err);
            } else {
                client.query('SELECT username, password FROM users where username = $1', [username], function(err, result) {
                    if(!result || result.rows.length != 1 || result.rows[0].username !== username) {
                        return done(null, false, {message: 'Invalid username'});
                    } else {
                        if(!bcrypt.compareSync(password, result.rows[0].password)) {
                            return done(null, false, {message: 'Invalid password'});
                        } else {
                            return done(null, result.rows[0].username);
						}
                    }
                });
            }
        });
    }));

var app = module.exports = express.createServer();

// Configuration
//  process.env.DATABASE_URL = "postgresql://localhost:5432/olznode";
// export DATABASE_URL=postgresql://localhost:5432/olznode

function errorHandler(err, req, res, next) {
    res.send({ error: err });
}

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(clientErrorHandler);

});

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

app.configure('development', function(){
    app.use(express.errorHandler({dumpExceptions:true, showStack:true})); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});


// Routes

app.get('/', routes.index);

app.post('/register', function(req, res) {
	winston.log('debug', '/register');
    var requestData = req.body;
	winston.log('debug', 'username: %s', requestData.username);
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if(err) {
            handleError(res, 500, 'Error connecting to Openloopz Database', err);
        } else {
            if(!requestData || isEmpty(requestData.username) || isEmpty(requestData.password)) {
                handleError(res, 400, "Invalid request parameters");
            } else {
                var userId = uuid.v1();
                var hash = bcrypt.hashSync(requestData.password, 10);
                checkUserExists(requestData.username, client, function(err, userExists) {
                    if(err) {
                        handleError(res, 500, "Error checking if user exists", err);
                    } else if(userExists) {
                        handleError(res, 409, "User already exists", err);
                    } else {
                        client.query('INSERT INTO users(userId, username, password) values($1, $2, $3)', [userId, requestData.username, hash], function(err, result) {
                            if(err) {
                                handleError(res, 500, "Error adding user to database", err);
                            } else if(result.rowCount == 1) {
                                res.send({userId:userId, username:requestData.username});
								winston.log('info', 'User registered successfully: %s', requestData.username);
                            } else {
                                handleError(res, 500, "Unexpected Error", {reason: "Incorrect row count for new user insert: " + result.rowCount});
                            }
                        });
                    }
                });
            }
        }
    });
});

app.post('/auth', passport.authenticate('basic', {session: false}), function(req, res) {
    res.send(req.user);
});



function checkUserExists(username, client, next) {
    client.query('SELECT username FROM users WHERE username = $1', [username], function(err, result) {
        if(err) {
            next(err);
        } else {
            next(err, result.rows.length > 0);
        }
    });
}

function handleError(res, statusCode, msg, err) {
	var errMsg = err?(" : " + err.message):"";
	winston.log('error', msg + '%s', errMsg);
    res.send(statusCode, {error: msg, reason:errMsg});
}

function isEmpty(str) {
    return !str || str === "";
}

app.get('/api/actions', 
        passport.authenticate('basic', {session: false}),
        function(req, res) {
            pg.connect(process.env.DATABASE_URL, function(err, client, done) {
                if(err) {
                    res.send(JSON.stringify(err));
                } else {
                    client.query('SELECT * FROM actions', function(err, result) {
                        res.send(JSON.stringify(result.rows));
                    });
                }
            });  
        }
       );

app.listen(process.env.PORT || 3000)
winston.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
