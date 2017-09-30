'use strict';

var express = require('express');
var bodyParser = require('body-parser');

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
    let equipInfo = req.body.EquipInfo;
    let alarmInfo = req.body.AlarmInfo;
    if (!equipInfo || !alarmInfo) {
      return res.sendStatus(400);
    }
    if (Array.isArray(equipInfo) && Array.isArray(alarmInfo) &&
      equipInfo.length === alarmInfo.length) {
      for (let i = 0; i < equipInfo.length; i++) {
        mqttServices.alarmNotify({EquipInfo: equipInfo[i], AlarmInfo: alarmInfo[i]});
      }
    } else if (typeof (equipInfo) === 'object' && typeof (alarmInfo) === 'object') {
      mqttServices.alarmNotify(req.body);
    } else {
      return res.sendStatus(400);
    }

    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

app.post('/equip/status', (req, res) => {
  try {
    console.log(req.body);
    let equipInfo = req.body.EquipInfo;
    let statusInfo = req.body.StatusInfo;
    if (!equipInfo || !statusInfo) {
      return res.sendStatus(400);
    }
    if (Array.isArray(equipInfo) && Array.isArray(statusInfo) &&
      equipInfo.length === statusInfo.length) {
      for (let i = 0; i < equipInfo.length; i++) {
        mqttServices.equipStatusChange({EquipInfo: equipInfo[i], StatusInfo: statusInfo[i]});
      }
    } else if (typeof (equipInfo) === 'object' && typeof (statusInfo) === 'object') {
      mqttServices.equipStatusChange(req.body);
    } else {
      return res.sendStatus(400);
    }
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
