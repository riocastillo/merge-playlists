var express = require('express');
var app = express();
var port = process.env.PORT || 2221;
// var bodyParser = require('body-parser');
require('dotenv').config(); 
// var configDB = require('./config/database.js');
// var db

  app.listen(port);
  console.log('The magic happens on port ' + port);
  