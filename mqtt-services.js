'use strict';

var util = require('util');
var ip = require('ip');
var moment = require('moment');

var MQTTClient = require('./mqtt-client');
var topics = require('./topics');
var setting = require('./setting');

var mqttClient = new MQTTClient();

/* EqMdle: "10.144.18.10",
EqType: "2",
EqID: "0008001001201",
EqAttrType: "DO",
EqAttr: "00000000",
IsAlerted: true,
Alarm:{},
EqStatus: 0" */

var equipList = [];

function _subscribe (topic, options) {
  mqttClient.subscribe(topic, options, (err) => {
    if (err) {
      return console.error(err);
    }
    console.log('[mqtt] subscribe [%s] success !', topic);
  });
}

function _keepAlive () {
  mqttClient.publish(topics.keepAlive, { Atime: moment().format('YYYY-MM-DD HH:mm:ss') },
    { qos: 0, retain: false }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('keep alive success !');
      }
    });

  setTimeout(_keepAlive, 1000 * 60);
}

function reconnectMQTTBroker (body) {
  try {
    var conf = {
      host: body.MQTunnel.split(':')[0],
      port: body.MQTunnel.split(':')[1]
    };
    mqttClient.close();
    mqttClient.connect(conf);
  } catch (ex) {
    console.error('[reconnectMQTTBroker] ' + ex);
  }
}

function alarmNotify (body) {
  try {
    var equipInfo = body.EquipInfo;
    var alarmInfo = body.AlarmInfo;

    var equip = equipList.find(e => e.EqMdle === equipInfo.EqMdle && e.EqType === equipInfo.EqType &&
      e.EqID === equipInfo.EqID && e.EqAttrType === equipInfo.EqAttrType && e.EqAttr === equipInfo.EqAttr);
    if (!equip) {
      equipList.push({
        EqMdle: equipInfo.EqMdle,
        EqType: equipInfo.EqType,
        EqID: equipInfo.EqID,
        EqAttrType: equipInfo.EqAttrType,
        EqAttr: equipInfo.EqAttr,
        IsAlerted: (alarmInfo.AlarmType !== 'E'),
        Alarm: alarmInfo,
        EqStatus: ''
      });
    } else {
      equip.IsAlerted = (alarmInfo.AlarmType !== 'E');
      equip.Alarm = alarmInfo;
    }

    var topic = util.format(topics.alarmReport, equipInfo.EqMdle, equipInfo.EqType, equipInfo.EqID,
      equipInfo.EqAttrType, equipInfo.EqAttr);
    console.log(util.format('publish to [%s] topic, msg = %s', topic, JSON.stringify(alarmInfo)));
    mqttClient.publish(topic, alarmInfo, { qos: 0, retain: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('alarm report send success !');
      }
    });
  } catch (ex) {
    console.error('[alarmNotify] ' + ex);
  }
}

function equipStatusChange (body) {
  try {
    var equipInfo = body.EquipInfo;
    var statusInfo = body.StatusInfo;
    var equip = equipList.find(e => e.EqMdle === equipInfo.EqMdle && e.EqType === equipInfo.EqType &&
      e.EqID === equipInfo.EqID && e.EqAttrType === equipInfo.EqAttrType && e.EqAttr === equipInfo.EqAttr);

    if (!equip) {
      equipList.push({
        EqMdle: equipInfo.EqMdle,
        EqType: equipInfo.EqType,
        EqID: equipInfo.EqID,
        EqAttrType: equipInfo.EqAttrType,
        EqAttr: equipInfo.EqAttr,
        IsAlerted: false,
        Alarm: {},
        EqStatus: statusInfo.EqStatus
      });
    } else {
      equip.EqStatus = statusInfo.EqStatus;
    }
    var topic = util.format(topics.equipStatusReport, equipInfo.EqMdle, equipInfo.EqType, equipInfo.EqID,
      equipInfo.EqAttrType, equipInfo.EqAttr);
    console.log(util.format('publish to [%s] topic, msg = %s', topic, JSON.stringify(statusInfo)));
    mqttClient.publish(topic, statusInfo, { qos: 0, retain: true }, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('equip status report send success !');
      }
    });
  } catch (ex) {
    console.error('[equipStatusChange] ' + ex);
  }
}

var conf = {
  host: setting.SSMQTunnel.MQPIPPT.split(':')[0],
  port: setting.SSMQTunnel.MQPIPPT.split(':')[1]
};
mqttClient.connect(conf);
mqttClient.events.on('connect', () => {
  console.log('[mqtt] Connect success !');

  try {
    _subscribe(topics.checkAlive, { qos: 0, retain: false });
    _subscribe(topics.isAlerted, { qos: 0, retain: false });
    _subscribe(topics.alertedRequest, { qos: 0, retain: false });
    _subscribe(topics.equipStatusRequest, { qos: 0, retain: false });

    // register
    mqttClient.publish(topics.register, {
      Atime: moment().format('YYYY-MM-DD HH:mm:ss'),
      SysIP: ip.address()
    },
      { qos: 0, retain: true }, (err) => {
        if (err) {
          return console.error(err);
        }
        console.log('register success !');

        if (equipList) {
          for (var i = 0; i < equipList.length; i++) {
            var equip = equipList[i];
            var statusTopic = util.format(topics.equipStatusReport, equip.EqMdle, equip.EqType,
              equip.EqID, equip.EqAttrType, equip.EqAttr);
            var msg = {
              Atime: moment().format('YYYY-MM-DD HH:mm:ss'),
              EqStatus: equip.EqStatus
            };
            console.log(util.format('publish to [%s] topic, msg = %s', statusTopic, JSON.stringify(msg)));
            mqttClient.publish(statusTopic, msg, { qos: 0, retain: true }, (err) => {
              if (err) {
                console.error(err);
              } else {
                console.log('equip status report send success !');
              }
            });

            if (equip.IsAlerted) {
              var alarmTopic = util.format(topics.alarmReport, equip.EqMdle, equip.EqType, equip.EqID,
                equip.EqAttrType, equip.EqAttr);
              equip.Alarm.Atime = moment().format('YYYY-MM-DD HH:mm:ss');
              console.log(util.format('publish to [%s] topic, msg = %s', alarmTopic, JSON.stringify(equip.Alarm)));
              mqttClient.publish(alarmTopic, equip.Alarm, { qos: 0, retain: true }, (err) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log('alarm report send success !');
                }
              });
            }
          }
        }
      }
    );
    // keep alive
    _keepAlive();
  } catch (ex) {
    console.error(ex);
  }
});
mqttClient.events.on('close', () => {
  console.log('[mqtt] connection close...');
});
mqttClient.events.on('offline', () => {
  console.log('[mqtt] Connect offline !');
});
mqttClient.events.on('error', (error) => {
  console.error('[mqtt] something is wrong ! ' + error);
});
mqttClient.events.on('reconnect', () => {
  console.log('[mqtt] try to reconnect...');
});

// business logics
mqttClient.events.on('checkAlive', (topic, message) => {
  try {
    var Atime = message.Atime;
    mqttClient.publish(topics.checkAliveReply, { Atime: Atime },
    { qos: 0, retain: false }, (err) => {
      if (err) {
        return console.error(err);
      }
      console.log('checkAliveReply send success !');
    }
  );
  } catch (ex) {
    console.error('[checkAlive] ' + ex);
  }
});
mqttClient.events.on('isAlerted', (topic, message) => {
  try {
    var buff = topic.split('/');
    if (buff.length !== 9) {
      return console.error('[alertedReportRequest] topic format error !');
    }
    var LGSSID = buff[3];
    var EqMdle = buff[4];
    var EqType = buff[5];
    var EqID = buff[6];
    var EqAttrType = buff[7];
    var EqAttr = buff[8];
    var Atime = message.Atime;

    var equip = equipList.find(e => e.EqMdle === EqMdle && e.EqType === EqType &&
      e.EqID === EqID && e.EqAttrType === EqAttrType && e.EqAttr === EqAttr);

    var reply = {
      Atime: Atime,
      IsAlerted: false,
      AlarmID: ''
    };
    if (equip) {
      reply.IsAlerted = equip.IsAlerted;
      reply.AlarmID = equip.Alarm.AlarmID;
    }
    var replyTopic = util.format(topics.isAlertedReply, EqMdle, EqType, EqID, EqAttrType, EqAttr);
    console.log(util.format('publish to [%s] topic, msg = %s', replyTopic, JSON.stringify(reply)));
    mqttClient.publish(replyTopic, reply, { qos: 0, retain: false },
        (err) => {
          if (err) {
            return console.error(err);
          }
          console.log('isAlertedReply success !');
        }
      );
  } catch (ex) {
    console.error('[isAlerted] ' + ex);
  }
});
mqttClient.events.on('alertedReportRequest', (topic, message) => {
  try {
    var buff = topic.split('/');
    if (buff.length !== 9) {
      return console.error('[alertedReportRequest] topic format error !');
    }
    var LGSSID = buff[3];
    var EqMdle = buff[4];
    var EqType = buff[5];
    var EqID = buff[6];
    var EqAttrType = buff[7];
    var EqAttr = buff[8];
    var Atime = message.Atime;

    var equip = equipList.find(e => e.EqMdle === EqMdle && e.EqType === EqType &&
      e.EqID === EqID && e.EqAttrType === EqAttrType && e.EqAttr === EqAttr);

    var A10Rst = '0';
    if (equip) {
      equip.Alarm.Atime = moment().format('YYYY-MM-DD HH:mm:ss');
      var sendTopic = util.format(topics.alarmReport, EqMdle, EqType, EqID, EqAttrType, EqAttr);
      console.log(util.format('publish to [%s] topic, msg = %s', sendTopic, JSON.stringify(equip.Alarm)));
      mqttClient.publish(sendTopic, equip.Alarm, { qos: 0, retain: true }, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('alarm report send success !');
        }
      });
    } else {
      A10Rst = '1';
    }

    var replyTopic = util.format(topics.alertedReportReply, EqMdle, EqType, EqID, EqAttrType, EqAttr);
    var msg = { Atime: Atime, A10Rst: A10Rst };
    console.log(util.format('publish to [%s] topic, msg = %s', replyTopic, JSON.stringify(msg)));
    mqttClient.publish(replyTopic, msg, { qos: 0, retain: false },
      (err) => {
        if (err) {
          return console.error(err);
        }
        console.log('alertedReportReply success !');
      }
    );
  } catch (ex) {
    console.error('[alertedReportRequest] ' + ex);
  }
});
mqttClient.events.on('equipStatusRequest', (topic, message) => {
  try {
    var buff = topic.split('/');
    if (buff.length !== 9) {
      return console.error('[equipStatusRequest] topic format error !');
    }

    var LGSSID = buff[3];
    var EqMdle = buff[4];
    var EqType = buff[5];
    var EqID = buff[6];
    var EqAttrType = buff[7];
    var EqAttr = buff[8];
    var Atime = message.Atime;

    var equip = equipList.find(e => e.EqMdle === EqMdle && e.EqType === EqType &&
      e.EqID === EqID && e.EqAttrType === EqAttrType && e.EqAttr === EqAttr);

    var A41Rst = '0';
    if (equip) {
      var sendTopic = util.format(topics.equipStatusReport, EqMdle, EqType, EqID, EqAttrType, EqAttr);
      var sendMsg = {
        Atime: moment().format('YYYY-MM-DD HH:mm:ss'),
        EqStatus: equip.EqStatus
      };
      console.log(util.format('publish to [%s] topic, msg = %s', sendTopic, JSON.stringify(sendMsg)));
      mqttClient.publish(sendTopic, sendMsg, { qos: 0, retain: true }, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('equip status report send success !');
        }
      });
    } else {
      A41Rst = '1';
    }

    var replyTopic = util.format(topics.equipStatusReply, EqMdle, EqType, EqID, EqAttrType, EqAttr);
    var replyMsg = { Atime: Atime, A41Rst: A41Rst };
    console.log(util.format('publish to [%s] topic, msg = %s', replyTopic, JSON.stringify(replyMsg)));
    mqttClient.publish(replyTopic, replyMsg, { qos: 0, retain: false },
      (err) => {
        if (err) {
          return console.error(err);
        }
        console.log('equipStatusReply success !');
      }
    );
  } catch (ex) {
    console.error('[equipStatusRequest] ' + ex);
  }
});
module.exports = {
  alarmNotify: alarmNotify,
  equipStatusChange: equipStatusChange,
  reconnectMQTTBroker: reconnectMQTTBroker
};
