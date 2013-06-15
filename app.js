
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , pg = require("pg");

var app = module.exports = express.createServer();

// Configuration
//  process.env.DATABASE_URL = "postgresql://localhost:5432/olznode";
// export DATABASE_URL "postgresql://localhost:5432/olznode"


app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
 
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  app.set('boom', 'dev');
});

// Routes

app.get('/', routes.index);

app.get('/api/actions', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
       if(err) {
            res.send(JSON.stringify(err));
        } else {
            client.query('SELECT * FROM actions', function(err, result) {
              res.send(JSON.stringify(result.rows));
            });
        }
      });  
});

app.listen(process.env.PORT || 3000)
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
