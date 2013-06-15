#!/usr/bin/env node

var pg = require("pg");

var conString = "postgresql://localhost:5432/olznode";

var client = new pg.Client(conString);
client.connect();

client.query("CREATE TABLE IF NOT EXISTS actions(id serial primary key, title text, status integer)");

client.end();

