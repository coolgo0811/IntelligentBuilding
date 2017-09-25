'use strict';

var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');

var setting = require('./setting');
var mqttServices = require('./mqtt-services');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/alarm', function (req, res) {
  try {
    console.log(req.body);
    mqttServices.alarmNotify(req.body);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.post('/equip/status', function (req, res) {
  try {
    console.log(req.body);
    mqttServices.equipStatusChange(req.body);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
