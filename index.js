// https://github.com/shanemcw/homebridge-amazondash-mac
//   forked from jourdant/homebridge-amazondash-ng
//    forked from KhaosT/homebridge-amazondash

var spawn = require('child_process').spawn;
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory      = homebridge.platformAccessory;
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen        = homebridge.hap.uuid;
  homebridge.registerPlatform("homebridge-amazondash-mac", "AmazonDash-MAC", DashPlatform, true); // dynamic
}

function DashPlatform(log, config, api) {
  var self = this;
  self.log          = log;
  self.config       = config                   || { "platform": "AmazonDash-MAC" };
  self.buttons      = self.config.buttons      || [];
  self.timeout      = self.config.timeout      || 9000; // rate limit greater than connection attempt time in ms
  self.debug        = self.config.debug        || 1; // 0-3, 10
  self.manufacturer = self.config.manufacturer || "Amazon";
  self.alias        = {}; // additional MACs can masquerade as accessory MAC via this alias map
  self.accessories  = {};
  self.wifidump     = null;
  if (api) {
    self.api = api;
    self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

DashPlatform.prototype.configureAccessory = function(accessory) {
  var self = this;
  if (self.debug >= 2) { self.log(`${accessory.context.mac} configured as ${accessory.displayName}`); }
  if (!accessory.context.mac) {
    self.log(`\x1b[31m[ERROR]\x1b[0m configureAccessory called for malformed accessory (e.g. "MAC") missing`);
    return;
    }
  accessory.reachable = true;
  accessory.context.lastTriggered = null;
  accessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer,     self.manufacturer)
    .setCharacteristic(Characteristic.Model,            accessory.context.model)
    .setCharacteristic(Characteristic.FirmwareRevision, accessory.context.firmware)
    .setCharacteristic(Characteristic.SerialNumber,     accessory.context.serial);
  // single press is 0; double is 1, long press is 2)
  accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 1, validValues: [0, 1]});
  self.accessories[accessory.context.mac] = accessory;
  self.alias[accessory.context.mac] = accessory.context.mac; // self-referential
  // optional aliasing
  if (accessory.context.alias) {  
    for (let m of accessory.context.alias) {
      m = m.toUpperCase().replace(/([\dA-F]{2}\B)/g, "$1:");
      self.alias[m] = accessory.context.mac;
      if (self.debug >= 2) { self.log(`${accessory.displayName} at ${accessory.context.mac} also responding to ${m}`); }
      }
    }
}

DashPlatform.prototype.didFinishLaunching = function() {
  var self = this;
  if (!self.config.interface) {
    self.log(`\x1b[31m[ERROR]\x1b[0m required plugin settings (e.g. "interface") are not yet specified`);
    return;
    }
  if (self.debug == 10) {
    self.log(`\x1b[33m[DEBUG 10]\x1b[0m removing all cached accessories and recreating from current settings`);
    self.log(`\x1b[33m[DEBUG 10]\x1b[0m change debug level to other than 10 and restart homebridge`);
    for (let a of Object.values(self.accessories)) { self.removeAccessory(a); }
    self.debug = 2;
    }
  for (let b of self.buttons) {
    if (!b.MAC) {
      self.log(`\x1b[31m[ERROR]\x1b[0m required button settings (e.g. "MAC") are not yet specified`);
      return;
      }
    b.MAC = b.MAC.toUpperCase().replace(/([\dA-F]{2}\B)/g, "$1:");
    if (!self.accessories[b.MAC]) { self.addAccessory(b); }
    }
  if (Object.keys(self.accessories).length > 0) {
    self.wifidump = spawn('sudo', ['tcpdump', '-i', self.config.interface, '--immediate-mode', '--monitor-mode', '-t', '-S', '-q', '-N', '-l', '-e', 'broadcast']);
    self.wifidump.stdout.on('data', function(data) { self.handleOutput(self, data);  });
    self.wifidump.stderr.on('data', function(data) { self.handleError(self, data);   });
    self.wifidump.on('exit',  (code) => { self.log(` tcpdump exited, code ${code}`); });
    self.wifidump.on('close', (code) => { self.log(` tcpdump closed, code ${code}`); });
    self.wifidump.on('error', (err)  => { self.log(` tcpdump error ${err}`);         });
  }
}

DashPlatform.prototype.handleOutput = function(self, data) {
  if (self.accessories && Object.keys(self.accessories).length > 0) {
    let lines = ('' + data).match(/[^\r\n]+/g);
    if (!lines) { return; }
    for (let line of lines) {
      // grab all MAC addresses, use first per line; alias to primary MAC
      var matches = line.toUpperCase().match(/(?:[\dA-Fa-f]{2}\:){5}(?:[\dA-Fa-f]{2})/g);
      if (matches && (matches.length > 0)) {
        if (self.debug >= 3) { self.log(`\x1b[33m[DEBUG 3]\x1b[0m MAC ${matches[0]}`); } // very verbose
        // additional MACs can masquerade as the accessory MAC
        var accessory = self.accessories[self.alias[matches[0]]];
        // rate limit triggers less than connection attempt time
        if (accessory && (accessory.context.lastTriggered == null || Math.abs((new Date()) - accessory.context.lastTriggered) > self.timeout)) {
          if (self.debug >= 2) { self.log(`triggering ${accessory.displayName} from ${matches[0]}`); }
          self.dashEventWithAccessory(self, accessory);
          }
      }
    }
  }
}

DashPlatform.prototype.handleError = function(self, data) {
    let lines = ('' + data).match(/[^\r\n]+/g);
    if (!lines) { return; }
    for (let line of lines) {     
      if (/suppressed/.test(line)) { continue; }
      if (/packets/.test(line))    { continue; }
      if (/sudo/.test(line)) {
        let o = require('os');
        let u = o.userInfo().username || "unknown";
        let h = o.hostname            || "unknown";
        self.log(`\x1b[31m[ERROR]\x1b[0m additional steps are required to allow user ${u} to run tcpdump via sudo on ${h}`);
        self.log(`\x1b[31m[ERROR]\x1b[0m see installation documentation for how to do this`);
        continue;
        }
      if (/listening/.test(line)) { 
        let n = line.match(/on ([^\s,]+)/);
        if (n[1]) {
          if (self.debug >= 1) { self.log(`now listening on ${n[1]}`); }
          continue;
          }
        }
      self.log(line); 
      }
}
    
DashPlatform.prototype.dashEventWithAccessory = function(self, accessory) {
  let b = 0; let s = 'single'; // 0 = single, 1 = double, 2 = long press events
  if (accessory.context.lastTriggered && Math.abs(new Date() - accessory.context.lastTriggered) < (self.timeout + 16000)) { b = 1; s = 'double'; } 
  accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setValue(b); // 
  if (self.debug >= 1) { self.log(`${accessory.displayName} ${s} press`); }
  accessory.context.lastTriggered = new Date();
}

DashPlatform.prototype.addAccessory = function(button) {
  var self = this;
  if (!button.MAC) {
    self.log(`\x1b[31m[ERROR]\x1b[0m required button settings (e.g. "MAC") are not yet specified`);
    return;
    }
  var uuid = UUIDGen.generate(button.MAC);
  var newAccessory = new Accessory(button.name, uuid, 15); // 15 = PROGRAMMABLE_SWITCH_TCTYPE
  newAccessory.reachable = true;
  newAccessory.context.lastTriggered = null;
  newAccessory.context.mac = button.MAC;
  if (button.alias && (button.alias.length > 0)) {
    newAccessory.context.alias = button.alias;
    }
  newAccessory.context.serial   = button.serial   || 'unspecified';
  newAccessory.context.firmware = button.firmware || 'unspecified';
  newAccessory.context.model    = button.model    || 'unspecified';
  newAccessory.addService(Service.StatelessProgrammableSwitch, button.name);
  newAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer,     self.manufacturer)
    .setCharacteristic(Characteristic.Model,            newAccessory.context.model)
    .setCharacteristic(Characteristic.FirmwareRevision, newAccessory.context.firmware)
    .setCharacteristic(Characteristic.SerialNumber,     newAccessory.context.serial);
  newAccessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 1, validValues: [0, 1]});
  self.accessories[newAccessory.context.mac] = newAccessory;
  self.alias[newAccessory.context.mac] = newAccessory.context.mac; // self-referential
  if (self.debug >= 2) { self.log(`${button.MAC} added as ${button.name}`); }
  // optional aliasing
  if (newAccessory.context.alias) {
    for (let m of newAccessory.context.alias) {
      m = m.toUpperCase().replace(/([\dA-F]{2}\B)/g, "$1:");
      self.alias[m] = newAccessory.context.mac;
      if (self.debug >= 2) { this.log(`${button.name} also responding to ${m}`); }
      }
    }
  self.api.registerPlatformAccessories("homebridge-amazondash-mac", "AmazonDash-MAC", [newAccessory]);
}

DashPlatform.prototype.removeAccessory = function(accessory) {
  var self = this;
  if (!accessory.context.mac) {
    self.log(`\x1b[31m[ERROR]\x1b[0m removeAccessory called for malformed accessory (e.g. "MAC" missing)`);
    return;
    }
  if (accessory) {
    self.api.unregisterPlatformAccessories("homebridge-amazondash-mac", "AmazonDash-MAC", [accessory]);
    delete self.accessories[accessory.context.mac];
    if (self.debug >= 2) { self.log(`removed ${accessory.displayName}`); }
  }
}

DashPlatform.prototype.configurationRequestHandler = function(context, request, callback) { }
