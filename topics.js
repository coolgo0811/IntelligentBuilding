'use strict';

var util = require('util');

var setting = require('./setting');

var MQID = setting.MQID;
var MQTunnel = setting.SSMQTunnel.PrimeLG;
var SSID = setting.SSMQTunnel.SSID;
var LGSSID = setting.LGSSID;

// publish
var register = util.format('%s/A00_Register/%s/%s', MQID, MQTunnel, SSID);
var keepAlive = util.format('%s/A01_keepAlive/%s/%s', MQID, MQTunnel, SSID);
var checkAliveReply = util.format('%s/A02_CheckAliveReply/%s/%s', MQID, MQTunnel, SSID);
var alarmReport = util.format('%s/A10_AlarmReport/%s/%s/%s/%s/%s/%s/%s', MQID, MQTunnel, SSID);
var equipStatusReport = util.format('%s/A41_EquipStatusReport/%s/%s/%s/%s/%s/%s/%s', MQID, MQTunnel, SSID);
var isAlertedReply = util.format('%s/A10b_IsAlertedReply/%s/%s/%s/%s/%s/%s/%s', MQID, MQTunnel, SSID);
var alertedReportReply = util.format('%s/A10a_AlertedReportReply/%s/%s/%s/%s/%s/%s/%s', MQID, MQTunnel, SSID);
var equipStatusReply = util.format('%s/A41a_EquipStatusReply/%s/%s/%s/%s/%s/%s/%s', MQID, MQTunnel, SSID);
// subscribe
var checkAlive = util.format('%s/A02_CheckAliveRequest/%s', MQID, MQTunnel);
var isAlerted = util.format('%s/A10b_IsAlertedRequest/%s/%s/#', MQID, MQTunnel, LGSSID);
var alertedRequest = util.format('%s/A10a_AlertedReportRequest/%s/%s/#', MQID, MQTunnel, LGSSID);
var equipStatusRequest = util.format('%s/A41a_EquipStatusRequest/%s/%s/#', MQID, MQTunnel, LGSSID);

module.exports = {
  register: register,
  keepAlive: keepAlive,
  checkAliveReply: checkAliveReply,
  alarmReport: alarmReport,
  equipStatusReport: equipStatusReport,
  isAlertedReply: isAlertedReply,
  alertedReportReply: alertedReportReply,
  equipStatusReply: equipStatusReply,
  checkAlive: checkAlive,
  isAlerted: isAlerted,
  alertedRequest: alertedRequest,
  equipStatusRequest: equipStatusRequest
};
