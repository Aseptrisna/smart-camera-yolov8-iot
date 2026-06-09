'use strict';

const mqtt   = require('mqtt');
const config = require('../config');
const logger = require('../logger');

class ActuatorService {
  constructor() {
    this._client = null;
    this._ready  = false;
  }

  _getClient() {
    if (this._client) return this._client;

    const { host, port, username, password } = config.actuator;

    logger.info(`Connecting to MQTT broker: ${host}:${port}`);
    logger.info(`MQTT credentials → username="${username}"`);

    const client = mqtt.connect({
      host,
      port:            Number(port),
      username,
      password,
      protocol:        'mqtt',
      clientId:        `smart-camera-${Date.now()}`,
      clean:           true,
      protocolVersion: 4,
      reconnectPeriod: 0,
      connectTimeout:  10000,
      keepalive:       60,
    });

    client.on('connect', () => {
      this._ready = true;
      logger.info('MQTT broker connected (actuator)');
    });

    client.on('reconnect', () => {
      this._ready = false;
      logger.warn('MQTT broker reconnecting...');
    });

    client.on('error', (err) => {
      this._ready  = false;
      this._client = null;
      logger.error('MQTT broker error', { error: err.message });
    });

    client.on('close', () => {
      this._ready  = false;
      this._client = null;
    });

    this._client = client;
    return client;
  }

  /**
   * Publish control command.
   * Payload: `{guid}#{state}`  → e.g. "abc-123#1"
   */
  control(guid, action) {
    return new Promise((resolve, reject) => {
      if (!guid) return reject(new Error('GUID aktuator tidak boleh kosong'));

      const state   = action === 'on' ? 1 : 0;
      const payload = `${guid}#${state}`;
      const topic   = config.actuator.topic;

      const client = this._getClient();

      const doPublish = () => {
        client.publish(topic, payload, { qos: 1 }, (err) => {
          if (err) return reject(err);
          logger.info(`MQTT published → topic=${topic} payload=${payload}`);
          resolve({ topic, payload, guid, action, state });
        });
      };

      if (this._ready) return doPublish();

      const timer = setTimeout(() => {
        client.removeListener('connect', onConnect);
        client.removeListener('error',   onError);
        reject(new Error('MQTT broker timeout — tidak terhubung dalam 10s'));
      }, 10_000);

      const onConnect = () => {
        clearTimeout(timer);
        client.removeListener('error', onError);
        doPublish();
      };

      const onError = (err) => {
        clearTimeout(timer);
        client.removeListener('connect', onConnect);
        this._client = null;
        this._ready  = false;
        reject(new Error(`MQTT koneksi gagal: ${err.message}`));
      };

      client.once('connect', onConnect);
      client.once('error',   onError);
    });
  }
}

module.exports = new ActuatorService();
