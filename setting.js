'use strict';

var fs = require('fs');
var xml2json = require('xml2json');

var setting = null;

var data = fs.readFileSync('./setting.xml');
var json = xml2json.toJson(data);
setting = JSON.parse(json);

module.exports = setting.MQTTSetting;
