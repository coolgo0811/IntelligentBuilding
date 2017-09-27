'use strict';

var util = require('util');
var express = require('express');
var bodyParser = require('body-parser');

var setting = require('./setting');
var mqttServices = require('./mqtt-services');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

app.post('/alarm', (req, res) => {
  try {
    console.log(req.body);
    mqttServices.alarmNotify(req.body);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.post('/equip/status', (req, res) => {
  try {
    console.log(req.body);
    mqttServices.equipStatusChange(req.body);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.post('/reconnect', (req, res) => {
  try {
    console.log(req.body);
    mqttServices.reconnectMQTTBroker(req.body);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log('app listening on port 3000!');
});
