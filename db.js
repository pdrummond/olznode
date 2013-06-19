
var pg = require("pg");


var client = new pg.Client(process.env.DATABASE_URL);
client.connect();

client.query("CREATE TABLE IF NOT EXISTS users(id serial primary key, userid text, username text, password text);").on('end', function() {
    console.log("Created users table");
});

client.query("CREATE TABLE IF NOT EXISTS actions(id serial primary key, title text, status integer);").on('end', function() {
    console.log("Created actions table");
}); 

var query = client.query("INSERT INTO users(username, password) values('pdrummond', 'pdrummond');").on('end', function() {
    console.log("Created user pdrummond");
    client.end();
});

