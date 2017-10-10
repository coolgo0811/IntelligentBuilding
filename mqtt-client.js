'use strict';

var mqtt = require('mqtt');
var EventEmitter = require('events');

var connStatus = {
  None: 0,
  Connected: 1,
  Closed: 2,
  Offline: 3,
  Connecting: 4
};

class MQTTClient {
  constructor () {
    this.conf = null;
    this.clientId = 'app_' + Math.random().toString(16).substr(2, 8);
    this.client = null;
    this.events = new EventEmitter();
    this.connectStatus = connStatus.None;
  }

  connect (conf) {
    this.conf = conf;
    this.connectStatus = connStatus.Connecting;

    var tcpOptions = {
      port: this.conf.port || 1883,
      clean: true,
      keepalive: 60,
      clientId: this.conf.clientId || this.clientId,
      username: this.conf.username,
      password: this.conf.password,
      reconnectPeriod: 1000 * 3
    };

    this.client = mqtt.connect('mqtt://' + this.conf.host, tcpOptions);

    this.client.on('connect', () => {
      this.connectStatus = connStatus.Connected;
      this.events.emit('connect');
    });

    this.client.on('close', () => {
      this.connectStatus = connStatus.Closed;
      this.events.emit('close');
    });

    this.client.on('offline', () => {
      this.connectStatus = connStatus.Offline;
      this.events.emit('offline');
    });

    this.client.on('error', (error) => {
      this.events.emit('error', error);
    });

    this.client.on('reconnect', () => {
      this.connectStatus = connStatus.ReConnecting;
      this.events.emit('reconnect');
    });

    this.client.on('message', (topic, message) => {
      var buff = topic.split('/');
      if (buff.length < 2) {
        return;
      }
      var msg = JSON.parse(message.toString());
      switch (buff[1]) {
        case 'A02_CheckAliveRequest':
          console.log('[A02_CheckAliveRequest]:');
          this.events.emit('checkAlive', topic, msg);
          break;
        case 'A10b_IsAlertedRequest':
          console.log('[A10b_IsAlertedRequest]');
          this.events.emit('isAlerted', topic, msg);
          break;
        case 'A10a_AlertedReportRequest':
          console.log('[A10a_AlertedReportRequest]');
          this.events.emit('alertedReportRequest', topic, msg);
          break;
        case 'A41a_EquipStatusRequest':
          console.log('[A41a_EquipStatusRequest]');
          this.events.emit('equipStatusRequest', topic, msg);
          break;
      }
    });
  }

  close () {
    try {
      if (this.client) {
        this.client.end(true);
        this.client = null;
      }
    } catch (ex) {
    }
  }

  publish (topic, message, options, callback) {
    try {
      var msg = null;
      if (typeof message === 'string') {
        msg = message;
      } else {
        msg = JSON.stringify(message);
      }
      this.client.publish(topic, msg, options, callback);
    } catch (ex) {
      callback(ex);
    }
  }

  subscribe (topic, options, callback) {
    try {
      this.client.subscribe(topic, options, callback);
    } catch (ex) {
      callback(ex.message);
    }
  }

  unsubscribe (topic, callback) {
    try {
      this.client.unsubscribe(topic, callback);
    } catch (ex) {
      callback(ex.message);
    }
  }
}

/*
conf = {
	host: "172.18.3.157/WaMQTT/",
	port:80,
	clientId:"",
	username:"xxx",
	password:"xxx",
	reconnectPeriod: 1000,
	protocol: 1, 2 or 3 // mqtt, ws, wss
};
*/

module.exports = MQTTClient;
