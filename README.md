[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
# homebridge-amazondash-mac

A 2021 Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge) that doesn't require Dash button modification, Dash button setup (through Amazon or other means) nor the Dash button connecting to a local network.

By December 31, 2019, Amazon removed the capability to set up a Dash button for connection to a network. Also at that time, all Dash buttons that were connected to a network received an over-the-air update that disabled the button—a process Amazon refers to as "deregistration."

This plugin:
* Requires an addtional wifi device, e.g. USB wifi
* uses `tcpdump`'s ability to report on MAC addresses visible to the wifi device
* converts the Dash button's *(failed) attempt* to connect to a local network on Dash button press as a Homekit button single-press
* does not require [modifying](https://blog.christophermullins.com/2019/12/20/rescue-your-amazon-dash-buttons/) the Dash button

This project is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng), which is a fork of KhaosT's [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
This is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng) with
* Removed requirement to run Homebridge with root privileges
* Switch to `tcpdump` from `airodump-ng` 
* Support for the Homebridge Plugin Settings GUI
* Expect and support a Dash button that is not connected to the local network
* Revised specification as single-press (not long-press, double-press) events
* Multiple buttons can appear and act as one button through aliasing
* Firmware revision, serial number, model number support
* Multiple logging debug levels 
* User ability to remove a stale button during setup experimentation
* Installation and usage documentation
* Code maintenance, bug fixes

## Installation

1. **Administrator privileges are required for these steps**
1. Set up a wifi device with monitor mode capability
2. Test `tcpdump` and install if needed
3. Give the `homebridge` user permission to also `sudo tcpdump` without a password
4. Run `sudo tcpdump` standalone with the wifi device to test usage and visibility of Dash activity
5. Install this plugin: `npm install -g homebridge-amazondash-mac`
7. Update the Homebridge Amazondash MAC plugin's config.json via the plugin's settings
8. Use `debug` levels during installation experimentation

## Example config.json created by settings

	{
   	"platform": "AmazonDash-MAC",
   	"name": "AmazonDash-MAC",
   	"interface": "wlx9cefd5fa2fdf",
   	"debug": 2,
   	"buttons": [
   		{
   		"name": "Doorbell",
   		"MAC": "AA:BB:CC:DD:EE:FF",
   		"serial": "G030QC0400868230",
   		"firmware": "50018520_US",
		"model": "JK29LP"
   		},
   		{
   		"name": "Button One",
   		"MAC": "AABBCCDDEEFF",
   		"serial": "G030MQ0370960400",
   		"firmware": "40018220_US",
		"model": "JK29LP",
  		"alias": [
                "aabbccddeeff"
   		]
   		},
   		{
   		"name": "Button Two",
   		"MAC": "aa:bb:cc:dd:ee:ff",
		"serial": "G030DN0400063350",
		"firmware": "50018520_US",
		"model": "JK29LP"
   		}
   		]
   	}

### Interface
`Interface` refers to the monitoring wifi interface for `tcpdump` to listen on. Once the wifi monitoring interface is properly set up, this identifier is reported by the `iwconfig` or `tcpdump -D` command.
### Debug
* `Silent` (`0`) No reporting.
* `Default Runtime Messages` (`1`) Reports when a button is triggered. This debug level is recommended for day-to-day working installations. 
* `Testing Messages` (`2`) Reports removal, creation or configuration of accessories at initialization. This level is useful when testing a configuration and as a debug level after using the special `Clear Accessories` debug level.
* `MAC Address Streaming` (`3`) Reports all visible MAC addresses as they are parsed live. This debug is *very* verbose but helpful for initial installation and testing.
* `Clear Accessories` (`10`) A special debug level that removes all previously added accessories. This is useful when experimenting during initial configuration when "phantom" accessories may be displayed or accessory characteristics are not being updated due to caching of previous versions of those accessories during configuration experimentation. To use, set `debug` to 10 and restart Homebridge. Reset `debug` to the (non-10) desired debug level (2 is recommended) and restart Homebridge. This second restart will recreate the accessories fresh from the config.json file. Note any Homekit actions previously configured for the button accessories may not be retained and may need to be reconfigured for each.

## Getting a Dash Button MAC Address, Serial Number, Firmware Version, Model Number
### Model Number
The model number is printed on the back of the Dash button.
### MAC Address, Serial Number, Firmware Version
An Amazon Dash button creates a wifi access point and can provide its information via an internally-generated web page.
* Long press on the Dash button until the light flashes blue
* Join the network `Amazon ConfigureMe` newly created by that Dash button
* Open the URL `http://192.168.0.1` on the device connected to `Amazon ConfigureMe`
* MAC address, serial number, firmware version (and battery level) are reported

### Alias
`alias` is an optional configuration for situations where a button is meant to act just as another. For example, you may have a need for more than one doorbell button for multiple doors. Another example is a button to trigger a "Goodnight" scene—however you want one on each nightstand on each side of the bed.

To use this capability, configure one of the buttons as typical—this is the button that will be visible in Homekit. In the `alias` portion of its configuration, add the MAC addresses of other buttons to "alias for" or "masquerade as" that button. When buttons with those MAC addresses are pushed, it will appear to Homekit as if the visible button was pushed.

The buttons corresponding to the MAC addresses in the `alias` list are not intended to be visible as separate accessories in Homekit—do not add the buttons corresponding to the MAC addresses in the `alias` list as separate button accessories.

## Wifi Device and Monitor Mode

It is required that wifi device (such as a USB wifi dongle) can be configured and run in monitor mode. An example USB wifi device known to work in some contexts for these purposes is the **Panda 300Mbps Wireless 802.11n USB Adapter (PAU05)**.

### Example Wifi Device Configuration

This is example-only. There are several and different ways to do this.

* Confirming the wifi device is working, visible and to get the `interface` name:
```
sudo iw dev
```
* Test the wifi device can be put in monitor mode (`wlan0` is for example only) (method one):
```
sudo ip link set wlan0 down
sudo iw wlan0 set monitor none
sudo ip link set wlan0 up
```
* Test the wifi device can be put in monitor mode (`wlan0` is for example only) (method two):
```
sudo ifconfig wlan0 down
sudo iwconfig wlan0 mode monitor
sudo ifconfig wlan0 up
```
* Confirm monitor mode and wifi monitoring interface name (confim "Mode:Monitor"):
```
iwconfig
```

## `tcpdump`

This plugin uses `tcpdump`'s ability to report on MAC addresses visible to the wifi device and converts the Dash button's exposure of its MAC address on button press as a Homekit button single-press.

* [Ubuntu Man Page for tcpdump](http://manpages.ubuntu.com/manpages/trusty/man8/tcpdump.8.html)

### Testing `tcpdump`

* Test `tcpdump` stand-alone with the wifi monitoring interface name (`wlan0` is for example only):
```
sudo tcpdump -i wlan0 --monitor-mode 
```
### Installing `tcpdump`

* if the above test failed becuase `tcpdump` is not installed, install `tcpdump`:
```
sudo apt-get install tcpdump
```
### Permitting the `homebridge` User to run `tcpdump` via `sudo` without a password 

If `tcpdump` is not (yet) permitted to run by the `homebridge` user via `sudo` without a password prompt, you will see this log entry on restarting Homebridge:
```
[AmazonDash-MAC] sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
[AmazonDash-MAC] ERROR: tcpdump exited, code 1
[AmazonDash-MAC] ERROR: tcpdump closed, code 1
```
* Add `/usr/sbin/tcpdump` at the end of the `homebridge` entry in the `sudoers` file via the `visudo` command to edit that file:
```
sudo visudo
```
`visudo` is required and is a text-only editor (e.g. `vi` or `GNU nano`) with editor-specific command keystrokes.
* Add `, /usr/sbin/tcpdump` to the end of the `homebridge` entry:
```
homebridge    ALL=(ALL) NOPASSWD:SETENV: /usr/sbin/shutdown, /usr/bin/npm, /usr/local/bin/npm, /usr/sbin/tcpdump
```
* Save the file and exit with that text editor's method
	* `vi` or `vim` sequence 
		* esc key
		* :wq
		* enter key
	* `GNU nano` sequence
		* control-x

## Ideas
* Mount an Amazon Dash button as a doorbell and have a HomePod play a song that is a doorbell sound effect, or a song with lyrics about someone being at at door.
* Keep the product brand sticker on several Amazon Dash buttons and use them to start different playlists. For example you can create playlists you name "Charmin" and "Tide" that are played when you push the Amazon Dash buttons for those products. 
