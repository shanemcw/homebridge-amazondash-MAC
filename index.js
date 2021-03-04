// forked from jourdant/homebridge-amazondash-ng
//    forked from KhaosT/homebridge-amazondash

// shane.mcwhorter@uxphd.co

var spawn = require('child_process').spawn;
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory      = homebridge.platformAccessory;
  Service        = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen =        homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-amazondash-ng", "AmazonDash-NG", DashPlatform, true); // dynamic
}

function DashPlatform(log, config, api) {
  var self = this;

  self.log     = log;
  self.config  = config              || { "platform": "AmazonDash-NG" };
  self.buttons = self.config.buttons || [];
  self.timeout = self.config.timeout || 10000; 
  self.debug   = self.config.debug   || 1; // 0-3, 10
  
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
  
  accessory.reachable = true;

  // only expose single press (single is 0; double is 1, long press is 2)
  accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 0, validValues: [0]});
  
  self.accessories[accessory.context.mac] = accessory;
  
  self.alias[accessory.context.mac] = accessory.context.mac;
  
  // additional aliases if any
  if (accessory.context.alias) {
    for (var i in accessory.context.alias) {
      if (self.debug >= 2) { self.log(accessory.displayName + " at " + accessory.context.mac + " also responding to " + accessory.context.alias[i]); }
      self.alias[accessory.context.alias[i]] = accessory.context.mac;
      }
    }
}

DashPlatform.prototype.didFinishLaunching = function() {
  var self = this;

  for (var i in self.buttons) {
    var button = self.buttons[i];
    if (!self.accessories[button.mac]) {
      self.addAccessory(button); 
      } else {
      // use debug of 10 and restart homebridge when changing accessory configurations in testing to remove previous 
      // set debug to not 10 and restart homebridge to add accessories fresh as configured
      if (self.debug == 10) { self.removeAccessory(self.accessories[button.mac]); }
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
      // grab all mac addresses, use first; alias to primary mac
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
    .setValue(0); // single press
}

DashPlatform.prototype.addAccessory = function(button) {
  if (this.debug >= 2) { this.log("addAccessory " + button.mac  + " as " + button.name); }
  
  var uuid = UUIDGen.generate(button.mac);

  var newAccessory = new Accessory(button.name, uuid, 15);
  
  newAccessory.reachable = true;
  
  newAccessory.context.mac = button.mac;
  
  if (button.alias) {
    newAccessory.context.alias = button.alias;
    }
    
  newAccessory.addService(Service.StatelessProgrammableSwitch, button.name);
    
  newAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "Amazon")
    .setCharacteristic(Characteristic.Model, "JK76PL")
    .setCharacteristic(Characteristic.FirmwareRevision, button.firmware)
    .setCharacteristic(Characteristic.SerialNumber, button.serial);

  newAccessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({minValue: 0, maxValue: 0, validValues: [0]});
    
  this.accessories[newAccessory.context.mac] = newAccessory;
  
  this.alias[newAccessory.context.mac] = newAccessory.context.mac; // primary accessory is its own alias
  
  if (newAccessory.context.alias) {
    // additional aliases if any
    for (var i in newAccessory.context.alias) {
      if (this.debug >= 2) { this.log(button.name + " also responding to " + newAccessory.context.alias[i]); }
      this.alias[newAccessory.context.alias[i]] = newAccessory.context.mac;  
      }
    }
  
  this.api.registerPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [newAccessory]);
}

DashPlatform.prototype.removeAccessory = function(accessory) { 
  if (this.debug >= 2) { this.log("removeAccessory " + accessory.displayName); }
  
  if (accessory) {
    this.api.unregisterPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [accessory]);
    delete this.accessories[accessory.context.mac];
  }
}

DashPlatform.prototype.configurationRequestHandler = function(context, request, callback) { }

