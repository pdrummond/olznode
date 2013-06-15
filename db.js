
var pg = require("pg");


var client = new pg.Client(process.env.DATABASE_URL);
client.connect();

client.query("CREATE TABLE IF NOT EXISTS actions(id serial primary key, title text, status integer)");

client.end();

