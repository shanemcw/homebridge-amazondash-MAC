var spawn = require('child_process').spawn;
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-amazondash-ng", "AmazonDash-NG", DashPlatform, true);
}

function DashPlatform(log, config, api) {
  var self = this;

  self.log = log;
  self.config = config || { "platform": "AmazonDash-NG" };
  self.buttons = self.config.buttons || [];
  self.timeout = self.config.timeout || 15000;

  self.accessories = {}; // MAC -> Accessory
  self.airodump = null;
  
  if (api) {
    self.api = api;
    self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

DashPlatform.prototype.configureAccessory = function(accessory) {
  var self = this;

  accessory.reachable = true;
  accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setValue(0);

  var accessoryMAC = accessory.context.mac;
  self.accessories[accessoryMAC] = accessory;
}

DashPlatform.prototype.didFinishLaunching = function() {
  var self = this;

  for (var i in self.buttons) {
    var button = self.buttons[i];
    if (!self.accessories[button.mac]) {
      self.addAccessory(button.mac, button.name);
    }
  }

  
  var registeredMACs = Object.keys(self.accessories);
  if (registeredMACs.length > 0) {
    self.log("Starting airodump with if:" + self.config.interface + " on channel: " + self.config.channel);
    
    self.airodump = spawn('airodump-ng', [self.config.interface, '--channel', self.config.channel, '--berlin', 1]);
    self.airodump.stdout.on('data', function(data) {self.handleOutput(self, data); });
	  self.airodump.stderr.on('data', function(data) {self.handleOutput(self, data); });
		self.airodump.on('close', function(code) { self.log('Process ended. Code: ' + code); });
      
    self.log("airodump started.");
  }
}

DashPlatform.prototype.handleOutput = function(self, data) {
  //no point processing the output if there are no buttons...
  if (self.accessories && Object.keys(self.accessories).length > 0) {
    //split lines
    var lines = ('' + data).match(/[^\r\n]+/g);
    for (line in lines) {
      //clean out the linux control chars
      line = lines[line].replace(/[\x00-\x1F\x7F-\x9F]/g, '').toLowerCase();
      
      //filter out mac addresses, only take the first occurence per line
      var matches = /((?:[\dA-Fa-f]{2}\:){5}(?:[\dA-Fa-f]{2}))/.exec(line); // << includes all mac addresses
      if (matches != null && matches.length > 0) {
        //self.log("STDOUT: '" + matches[1] + "'"); //for debugging
        
        var accessory = self.accessories[matches[1]];
        //rate limit the triggers to happen every 15 seconds
        if (accessory && (accessory.lastTriggered == null || Math.abs((new Date()) - accessory.lastTriggered) > self.timeout)) { 
          self.log("Triggering " + matches[1]); 
          accessory.lastTriggered = new Date();
          self.dashEventWithAccessory(self, accessory); }
      }
    }
  }
}

DashPlatform.prototype.dashEventWithAccessory = function(self, accessory) {
  var targetChar = accessory
    .getService(Service.StatelessProgrammableSwitch)
    .getCharacteristic(Characteristic.ProgrammableSwitchEvent);

  targetChar.setValue(1);
  setTimeout(function() { targetChar.setValue(0); }, self.timeout);
}

DashPlatform.prototype.addAccessory = function(mac, name) {
  var self = this;
  var uuid = UUIDGen.generate(mac);

  var newAccessory = new Accessory(name, uuid, 15);
  newAccessory.reachable = true;
  newAccessory.context.mac = mac;
  newAccessory.addService(Service.StatelessProgrammableSwitch, name);
  newAccessory
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "Amazon")
    .setCharacteristic(Characteristic.Model, "JK76PL")
    .setCharacteristic(Characteristic.SerialNumber, mac);

  this.accessories[mac] = newAccessory;
  this.api.registerPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [newAccessory]);
}

DashPlatform.prototype.removeAccessory = function(accessory) {
  if (accessory) {
    var mac = accessory.context.mac;
    this.api.unregisterPlatformAccessories("homebridge-amazondash-ng", "AmazonDash-NG", [accessory]);
    delete this.accessories[mac];
  }
}


//removed the ARP configuration method. config.json will need to be filled in manually.
//TODO: add a method to discover the MAC of a specific button and re-implement this function.
DashPlatform.prototype.configurationRequestHandler = function(context, request, callback) { }
