# homebridge-amazondash-mac

Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge) that doesn't require Dash button setup nor the Dash button connecting to your network.

This plugin uses airodump-ng's ability to report on visible MAC addresses and converts the Dash button's exposure of its MAC address on button press as a Homekit button single-press.

This project is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng), which is a fork of KhaosT's [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
This is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng) with
* Code maintenance, bug fixes
* Revised specification as single-press (not long-press, double-press) events
* Expect and support a Dash button that is not connected to the network
* Multiple buttons can appear and act as one button through aliasing
* Firmware revision, serial number, model number support
* Multiple logging debug levels 
* User ability to remove a stale button during setup experimentation
* Installation and usage documentation
* Support for the Homebridge Plugin Settings GUI

## Installation

1. Administrator privileges are required
1. Set up a wifi device to persist in monitor mode
2. Install airodump-ng
3. Run airodump-ng standalone to test usage and visibility of Dash activity
4. Install this plugin using: `npm install -g homebridge-amazondash-mac`
5.  **Run Homebridge with elevated privileges**
6. Update the Homebridge Amazondash MAC plugin's config.json via the plugin's settings
8. Use `debug` levels during installation experimentation

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
   		"MAC": "FF:AA:FF:AA:00:00",
   		"serial": "G030QC0400868230",
   		"firmware": "50018520_US",
		"model": "JK29LP"
   		},
   		{
   		"name": "Button One",
   		"MAC": "FF:FF:00:00:00:00",
   		"serial": "G030MQ0370960400",
   		"firmware": "50018520_US",
		"model": "JK29LP",
  		"alias": [
                "AA:00:00:FF:FF:FF"
   		]
   		},
   		{
   		"name": "Button Two",
   		"MAC": "AA:FF:00:00:FF:FF",
		"serial": "G030DN0400063350",
		"firmware": "50018520_US",
		"model": "JK29LP"
   		}
   		]
   	}

### Interface
`Interface` refers to the monitoring wifi interface for airodump-ng to listen on. Once the wifi monitoring interface is properly set up, this identifier is reported by the `iwconfig` command.
### Channel
`Channel` refers to a single channel for airodump-ng to listen on. As the Dash button is not connected to the network (i.e. not using a channel), choose a channel *not* or *least* visible in the vicinity to reduce airodump-ng's overhead.
### Debug
* `0` No reporting.
* `1` *Default.* Reports airodump-ng at initialization, and other than that only when a button is triggered. This debug level is recommended for day-to-day working installations. 
* `2` Reports removal, creation or configuration of accessories at initialization. This level is useful when testing a configuration and as a debug level after using the special "10" debug level.
* `3` Reports all visible MAC addresses as they are parsed live by airodump-ng. This debug is *very* verbose but helpful for initial installation and testing.
* `10` A special debug level that removes all previously added accessories. This is useful when experimenting during initial configuration when "phantom" accessories may be displayed or accessory characteristics are not being updated due to caching of previous versions of those accessories during configuration experimentation. To use, set `debug` to 10 and restart Homebridge. Reset `debug` to the (non-10) desired debug level (2 is recommended) and restart Homebridge. This second restart will recreate the accessories fresh from the config.json file. Note any Homekit actions previously configured for the button accessories may not be retained and may need to be reconfigured for each.

## Getting a Dash Button MAC Address, Serial Number, Firmware Version, Model Number
### Model Number
The model number is printed on the back of the Dash button
### MAC Address, Serial Number, Firmware Version
An Amazon Dash button creates a wifi access point and can provide its information via an internally-generated web page.
* Long press on the Dash button until the light flashes blue
* Join the network `Amazon ConfigureMe` newly created by that Dash button
* Open the URL `http://192.168.0.1` on the device connected to `Amazon ConfigureMe`
* These values and battery level are reported

Use uppercase for the `MAC` MAC addresses in the config.json file, e.g. `AA`, not `aa`.

### Alias
`alias` is an optional configuration for situations where a button is meant to act just as another. For example, you may have a need for more than one doorbell button for multiple doors. Another example is a button to trigger a "Goodnight" scene—however you want one on each nightstand on each side of the bed.

To use this capability, configure one of the buttons as typical—this is the button that will be visible in Homekit. In the `alias` portion of its configuration, add the MAC addresses of other buttons to "alias for" or "masquerade as" that button. When buttons with those MAC addresses are pushed, it will appear to Homekit as if the visible button was pushed.

The buttons corresponding to the MAC addresses in the `alias` list are not intended to be visible as separate accessories in Homekit—do not add the buttons corresponding to the MAC addresses in the `alias` list as separate button accessories.

## Wifi Device and Monitor Mode
It is required that wifi device (such as a USB wifi dongle) can be configured and run in monitor mode. An example USB wifi device known to work in some contexts for these purposes is the **Panda 300Mbps Wireless 802.11n USB Adapter (PAU05)**.

### Example Wifi Device Configuration

This is example-only. There are several and different ways to do this.

Confirming the wifi device is working, visible and to get the `Interface` name
```
sudo iw dev
```
Set the wifi device to monitor mode (`wlan0` is for example only) (method one)
```
sudo ip link set wlan0 down
sudo iw wlan0 set monitor none
sudo ip link set wlan0 up
```
Set the wifi device to monitor mode (`wlan0` is for example only) (method two)
```
sudo ifconfig wlan0 down
sudo iwconfig wlan0 mode monitor
sudo ifconfig wlan0 up
```
Confirm monitor mode and wifi monitoring interface name (confim "Mode:Monitor")
```
iwconfig
```
Test airodump stand-alone with the wifi monitoring interface name (`wlan0` is for example only)
```
airodump-ng wlan0
```
## About airodump-ng
airodump-ng was created for packet capturing of raw 802.11 frames as a component of the aircrack-ng suite of tools supporting WiFi network security assessment. This plugin uses airodump-ng's ability to report on visible MAC addresses and converts the Dash button's exposure of its MAC address on button press as a Homekit button single-press.

* [Ubuntu Man Page for airodump-ng](http://manpages.ubuntu.com/manpages/xenial/man8/airodump-ng.8.html)
* [aircrack-ng.org](https://www.aircrack-ng.org/doku.php?id=airodump-ng)

### Installing airodump-ng (example)
```
sudo apt-get install aircrack-ng
```
