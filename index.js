// https://github.com/shanemcw/homebridge-amazondash-MAC
//   forked from jourdant/homebridge-amazondash-ng
//    forked from KhaosT/homebridge-amazondash

var spawn = require('child_process').spawn;
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory      = homebridge.platformAccessory;
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen        = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-amazondash-ng", "AmazonDash-NG", DashPlatform, true); // dynamic
}

function DashPlatform(log, config, api) {
  var self = this;

  self.log          = log;
  self.config       = config                   || { "platform": "AmazonDash-NG" };
  self.buttons      = self.config.buttons      || [];
  self.timeout      = self.config.timeout      || 9000; 
  self.debug        = self.config.debug        || 1; // 0-3, 10
  self.manufacturer = self.config.manufacturer || "Amazon";
  
  self.alias = {}; // additional macs can masquerade as accessory mac via this alias map

  self.accessories = {};

  self.airodump = null;
  
  if (api) {
    self.api = api;
    self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

DashPlatform.prototype.configureAccessory = function(accessory) {
  var self = this;

  if (self.debug >= 2) { self.log("configureAccessory " + accessory.context.mac + " as " + accessory.displayName); }

  if (!accessory.context.mac) {
    self.log("ERROR: configureAccessory called for malformed accessory (e.g. \"mac\") missing");
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

  // expose single press only (single is 0; double is 1, long press is 2)
  accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 0, validValues: [0]});
  
  self.accessories[accessory.context.mac] = accessory;
  
  self.alias[accessory.context.mac] = accessory.context.mac;
  
  // optional aliasing
  if (accessory.context.alias) {
    for (var i in accessory.context.alias) {
      if (self.debug >= 2) { self.log(accessory.displayName + " at " + accessory.context.mac + " also responding to " + accessory.context.alias[i]); }
      self.alias[accessory.context.alias[i]] = accessory.context.mac;
      }
    }
}

DashPlatform.prototype.didFinishLaunching = function() {
  var self = this;

  if (self.debug == 10) {
    self.log("DEBUG LEVEL 10: removing all cached accessories and recreating from current settings");
    self.log("DEBUG LEVEL 10: change debug level to not 10 and restart homebridge");
    for (var m in self.accessories) { self.removeAccessory(self.accessories[m]); }
    self.debug = 2;
    }
 
  for (var i in self.buttons) {
    if (!self.buttons[i].MAC) {
      self.log("ERROR: required accessory settings (e.g. \"mac\") missing");
      return;
      }
    
    if (!self.accessories[self.buttons[i].MAC]) {
      self.addAccessory(self.buttons[i]); 
      }
  }

  if (Object.keys(self.accessories).length > 0) {
    if (self.debug >= 1) { self.log("airodump-ng starting on " + self.config.interface + " and channel " + self.config.channel); }
    
    self.airodump = spawn('airodump-ng', [self.config.interface, '--channel', self.config.channel, '--berlin', 1]);
    
    self.airodump.stdout.on('data', function(data) { self.handleOutput(self, data); });
    self.airodump.stderr.on('data', function(data) { self.handleOutput(self, data); });
    self.airodump.on('close', function(code) { self.log('airodump-ng ended, code ' + code); });
      
    if (self.debug >= 1) { self.log("airodump-ng started."); }
  }
}

DashPlatform.prototype.handleOutput = function(self, data) {
  if (self.accessories && Object.keys(self.accessories).length > 0) {
    var lines = ('' + data).match(/[^\r\n]+/g);
    for (line in lines) {
      // grab all mac addresses, use first per line; alias to primary mac
      var matches = /((?:[\dA-Fa-f]{2}\:){5}(?:[\dA-Fa-f]{2}))/.exec(lines[line]);
      if (matches != null && matches.length > 0) {
        if (self.debug >= 3) { self.log("parsed MAC " + matches[0]); }
        // additional macs can masquerade as the accessory mac
        var accessory = self.accessories[self.alias[matches[0]]]; 
        // also rate limit triggers
        if (accessory && (accessory.context.lastTriggered == null || Math.abs((new Date()) - accessory.context.lastTriggered) > self.timeout)) { 
          if (self.debug >= 1) { self.log("triggering " + accessory.displayName + " from " + matches[0]); }
          accessory.context.lastTriggered = new Date();
          self.dashEventWithAccessory(self, accessory);
          }
      }
    }
  }
}

DashPlatform.prototype.dashEventWithAccessory = function(self, accessory) {
    accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setValue(0); // 0 = single press event
}

DashPlatform.prototype.addAccessory = function(button) {   
  if (this.debug >= 2) { this.log("addAccessory " + button.MAC  + " as " + button.name); }
  
  if (!button.MAC) {
    self.log("ERROR: addAccessory called without required accessory settings (e.g. \"mac\" missing)");
    return;
    }
 
  var uuid = UUIDGen.generate(button.MAC);

  var newAccessory = new Accessory(button.name, uuid, 15);
  
  newAccessory.reachable = true;
  
  newAccessory.context.lastTriggered = null;
  
  newAccessory.context.mac = button.MAC;
  
  if (button.alias) {
    newAccessory.context.alias = button.alias;
    }
    
  newAccessory.context.serial   = button.serial   || 0;
  newAccessory.context.firmware = button.firmware || 0;
  newAccessory.context.model    = button.model    || 0;
 
  newAccessory.addService(Service.StatelessProgrammableSwitch, button.name);
    
  newAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer,     this.manufacturer)
    .setCharacteristic(Characteristic.Model,            newAccessory.context.model)
    .setCharacteristic(Characteristic.FirmwareRevision, newAccessory.context.firmware)
    .setCharacteristic(Characteristic.SerialNumber,     newAccessory.context.serial);

  newAccessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 0, validValues: [0]});
    
  this.accessories[newAccessory.context.mac] = newAccessory;
  
  this.alias[newAccessory.context.mac] = newAccessory.context.mac; // primary accessory is its own alias
  
  if (newAccessory.context.alias) {
    // additional aliases optional
    for (var i in newAccessory.context.alias) {
      if (this.debug >= 2) { this.log(button.name + " also responding to " + newAccessory.context.alias[i]); }
      this.alias[newAccessory.context.alias[i]] = newAccessory.context.mac;  
      }
    }
  
  this.api.registerPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [newAccessory]);
}

DashPlatform.prototype.removeAccessory = function(accessory) { 
  if (!accessory.context.mac) {
    self.log("ERROR: removeAccessory called for malformed accessory (e.g. \"mac\" missing)");
    return;
    }
    
  if (this.debug >= 2) { this.log("removeAccessory " + accessory.displayName); }
  
  if (accessory) {
    this.api.unregisterPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [accessory]);
    delete this.accessories[accessory.context.mac];
  }
}

DashPlatform.prototype.configurationRequestHandler = function(context, request, callback) { }

