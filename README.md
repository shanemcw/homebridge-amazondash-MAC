# homebridge-amazondash-mac

Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge) that doesn't require Dash button setup nor the Dash button connecting to your network.

This project is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng), which is a fork of KhaosT's [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
This is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng) with
* Code maintenance, bug fixes
* Revised specification of single-press, long-press, double-press events
* Expect and support a Dash button that is not connected to the network
* Multiple buttons can appear and act as one button through aliasing
* Firmware revision, serial number display
* Multiple logging debug levels 
* User ability to remove a stale button during setup experimentation

## Installation

1. Install airodump-ng
2. Set up a network interface in monitor mode
3. Install this plugin using: `npm install -g homebridge-amazondash-mac`
4. Update Homebridge config.json 
5. Run Homebridge with elevated privileges
6. Use *debug* levels during installation experimentation

## Example config.json

	{
   	"platform": "AmazonDash-MAC",
   	"name": "AmazonDash-MAC",
   	"interface": "wlx9cefd5fa2fdf",
   	"channel": 3,
   	"debug": 2,
   	"buttons": [
   		{
   		"name": "Doorbell",
   		"mac": "FF:AA:FF:AA:00:00",
   		"serial": "G030QC0400868230",
   		"firmware": "50018520_US",
		"model": "JK29LP"
   		},
   		{
   		"name": "Button One",
   		"mac": "FF:FF:00:00:00:00",
   		"serial": "G030MQ0370960400",
   		"firmware": "50018520_US",
		"model": "JK29LP",
  		"alias": [
                "AA:00:00:FF:FF:FF"
   		]
   		},
   		{
   		"name": "Button Two",
   		"mac": "AA:FF:00:00:FF:FF",
		"serial": "G030DN0400063350",
		"firmware": "50018520_US",
		"model": "JK29LP"
   		}
   		]
   	}

### Interface
**Interface** refers to the monitor interface for airodump-ng to listen on.
### Channel
**Channel** refers to a single channel for airodump-ng to listen on. As the Dash button is not connected to the network (i.e. not using a channel), choose a channel *not* or *least* used in the vicinity.
### Debug
* **0** No reporting.
* **1** *Default.* Reports airodump-ng at initialization, and other than that when a button is triggered. This debug level is recommended for day-to-day working installations. 
* **2** Reports removal, creation or configuration of accessories at initialization. This level is useful when testing a configuration and as a debug level after using the special "10" debug level.
* **3** Reports all visible MAC addresses as they are parsed live by airodump-ng. This debug is *very* verbose but helpful in inital installation and testing.
* **10** A special debug level that removes all previously added accessories. This is useful when experimenting during inital configuration when "phantom" accessories may be displayed due to caching of previous versions of those accessories during configuration experimentation. To use, set `debug` to 10 and restart Homebridge. Reset `debug` to the (non-10) desired debug level (2 is recommended) and restart Homebridge. This second restart will recreate the accessories fresh from the config.json file. Note any actions previously configured for the button accessories will not be retained and will need to be reconfigured for each.

## Getting a Dash Button MAC Address, Serial Number, Firmware Version, Model Number
### Model Number
The model number is printed on the back of the Dash button
### MAC Address, Serial Number, Firmware Version
* Long press on the Dash button until the light flashes blue
* Join the network `Amazon ConfigureMe` created by that Dash button
* Open the URL `http://192.168.0.1` on the device connected to `Amazon ConfigureMe`
* These values and battery level are reported

Use uppercase for the `mac` MAC addresses in the config.json file, e.g. `AA`, not `aa`.

## Wifi Device and Monitor Mode
A wifi device (such as a USB wifi dongle) that can be configured and run in monitor mode is required. An example USB wifi device known to work in some contexts for these purposes is the **Panda 300Mbps Wireless 802.11n USB Adapter (PAU05)**.
```
…
```

## About airodump-ng
…
