[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/green)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) [![Donate](https://badgen.net/badge/donate/paypal/yellow)](https://paypal.me/shanemcw) [![npm](https://badgen.net/npm/dt/homebridge-amazondash-mac?color=green)](https://www.npmjs.com/package/homebridge-amazondash-mac)

# A Modern Amazon Dash Button Plugin for Homebridge
A modern (post-2019) [Homebridge-verified](https://github.com/homebridge/homebridge/wiki/verified-Plugins) Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge) that doesn't require Dash button modification, Dash button setup (through Amazon or other means) nor the Dash button connecting to a local network.

Through [Homebridge](https://github.com/nfarina/homebridge), this plugin (and with an additional USB WiFi device typically) Amazon Dash buttons can be used as Homekit buttons.

This project is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng), which is a fork of KhaosT's [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## About Amazon Dash Buttons
An Amazon Dash button is a discontinued proprietary device for ordering consumer goods over the Internet.

An Amazon Dash button:

* has a rounded, elongated shape with an concave button on one end
* is white, with a removable product brand sticker
* is being resold online often as "button pushed once"
* includes its own removable clip for hanging and adhesive pads for mounting
* includes an (almost) non-replaceable battery powering an estimated 1,000 clicks
* can create a WiFi access point reporting device information via HTML
* has Bluetooth and a microphone
* is further described [here](https://www.digikey.com/en/maker/blogs/amazon-dash-button-tear-down)

By December 31, 2019, Amazon removed the capability to set up a Dash button for connection to a network. Also at that time, all Dash buttons that were connected to a network received an over-the-air update that disabled the button—a process Amazon refers to as "deregistration."

## Summary and Purpose
This plugin:

* requires a second WiFi device (e.g. USB WiFi) if the Homebridge computer uses its native WiFi as its connection to the local network or that native WiFi device does not support *monitor mode* or is not stable in *monitor mode*
* monitoring is done via `tcpdump` in a separate, non-blocking process 
* uses `tcpdump`'s ability to report on MAC addresses visible to the WiFi device in *monitor mode*
* converts the Dash button's *failed attempt* to connect to a local network on Dash button press as a HomeKit button single-press
* may not work with a Dash button that was "deregistered" via the over-the-air firmware update

This plugin is a fork of jourdant's [homebridge-amazondash-ng](https://github.com/jourdant/homebridge-amazondash-ng) with:

* Removal of the requirement to run Homebridge with root privileges
* Switch to `tcpdump` from `airodump-ng` 
* Support for the Homebridge Plugin Settings GUI
* Support of and expectation that a Dash button cannot be configured nor connect to the local network
* Support for distinct *Single Press* and *Double Press* events
* Multiple buttons can appear and act as one button through aliasing
* Support for firmware revision, serial number, model number
* Multiple logging debug levels 
* User ability to remove a stale button during setup experimentation
* Installation and usage documentation
* Code maintenance, bug fixes

## Ideas
* Mount an Amazon Dash button as a doorbell and have a HomePod (or more than one) play a [doorbell sound effect](https://music.apple.com/us/album/door-bells-sound-effects/944475720), or a song about someone being at the door.
	* *Ring My Bell* by Anita Ward
	* *Someone's Knocking at the Door* by Paul McCartney
	* If you'd like only part of a song played:
		* In Apple's *Music*, listen the the song and write down the start and end times of the part of the song to play. Go to *Get Info* on the song and select the `Options` tab. On that screen you can set the start time and end time to play. You can also increase the song's default volume. In Apple's *Home* app, you can set to play the song on "repeat."
* Keep the product brand sticker on several Amazon Dash buttons and use them to start different playlists. For example create playlists "Mucinex" and "Kraft Mac & Cheese" that are played when you push the Amazon Dash buttons labeled as those products.
* If a button is configured to play a playlist, configure the *Double Press* action for that button to pause playing.
* Buy me a beer: look for the `Donate` link and send me $2 for a [PBR beer](https://pabstblueribbon.com).
* Do you have a pretty cool idea? Share your experience in [this repository's GitHub discussion](https://github.com/shanemcw/homebridge-amazondash-mac/discussions/3).

### Single-Press and Double-Press Events
* To execute a *Double Press,* press the button a second time within 15 seconds *after the lights go dark* from this first press.
* If action(s) are specified for a *Single Press,* they will be immediately executed at that first press, even if a subsequent second press executes a *Double Press* event and actions.
* In this context, *Double Press* is more accurately described as "second press" and is best suited for canceling, stopping or pausing the preceding *Single Press* actions, or executing additional but optional actions to those already executed by the *Single Press.* 

## Installation Summary
1. **Administrator privileges are required for these steps**
1. Set up a WiFi device with monitor mode capability
2. Test `tcpdump` is present on your system and install if needed
3. Run `sudo tcpdump --monitor-mode` standalone with the WiFi device (i.e. `-i` and the WiFi interface name) to test usage and visibility of Dash activity
4. Give the `homebridge` user permission to also `sudo tcpdump` without a password
6. Install this plugin: `npm install -g homebridge-amazondash-mac`
7. Update the *Homebridge Amazondash MAC* plugin's config.json via the plugin's settings
8. Use `debug` levels during installation experimentation

## Settings

### Example config.json created by settings
```json
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
```

### Interface
`Interface` refers to the monitoring WiFi interface for `tcpdump` to listen on. Once the WiFi monitoring interface is properly set up, this identifier is reported by the `iwconfig` or `tcpdump -D` command.

### Debug
* `Silent` (`0`) No reporting.
* `Default Runtime Messages` (`1`) Reports when a button is triggered. This debug level is recommended for day-to-day working installations. 
* `Testing Messages` (`2`) Reports removal, creation or configuration of accessories at initialization. This debug level is useful when testing a configuration and a debug level after using the special `Clear Accessories` debug level.
* `MAC Address Discovery` (`3`) Reports visible MAC addresses only at initial discovery. This debug level is helpful for configuration and testing.
* `MAC Address Streaming` (`4`) Reports all visible MAC addresses as they are parsed live. This debug level is *very* verbose.
* `Clear Accessories` (`10`) A special debug level that removes all previously added accessories. This is useful when experimenting during initial configuration when "phantom" accessories may be displayed or accessory characteristics are not being updated due to caching of previous versions of those accessories during configuration experimentation. To use, set `debug` to 10 and restart Homebridge. Reset `debug` to the (non-10) desired debug level (2 is recommended) and restart Homebridge. This second restart will recreate the accessories fresh from the config.json file. Note any Homekit actions previously configured for the button accessories may not be retained and may need to be reconfigured for each.

## Getting a Dash Button MAC Address, Serial Number, Firmware Version, Model Number

### Model Number
The model number is printed on the back of the Dash button.

### MAC Address, Serial Number, Firmware Version
An Amazon Dash button can create a WiFi access point and can provide its information via an internally-generated web page.

![Amazon Dash Information Page](https://github.com/shanemcw/homebridge-amazondash-mac/blob/master/media/AmazonDash-MAC-1.png)

* Long press on the Dash button until the light flashes blue
* Join the network `Amazon ConfigureMe` newly created by that Dash button
* Open the URL `http://192.168.0.1` on the device connected to `Amazon ConfigureMe`
* MAC address, serial number, firmware version (and battery level) are displayed
* The reported information can be copy-pasted as-is individually into the plugin settings fields. To do so, keep the page display (e.g. in a browser tab) and switch over to the local network to access the plugin settings form (e.g. in a second browser tab).

### Is Yours Different?

You may see a different Dash-generated web page such as below.

![Alternate Amazon Dash Information Page](https://github.com/shanemcw/homebridge-amazondash-mac/blob/master/media/AmazonDash-MAC-2.png)

A Dash button showing a page of this type may or may not work with this plugin. Please try to enter your WiFi credentials and use this plugin in `MAC Address Discovery` debug mode to test if the button's MAC is visible, and that button's MAC address (if it is). If you are (or are not) able to use this technique for buttons showing a page of this type, please share your experiences in [this plugin's GitHub discussion](https://github.com/shanemcw/homebridge-amazondash-mac/discussions/5).

### Alias
`alias` is an optional configuration for situations where a button is meant to act just as another. For example, you may have a need for more than one doorbell button for multiple doors. Another example is a button to trigger a "Goodnight" scene—however you want one on each nightstand on each side of the bed.

To use this capability, configure one of the buttons as typical—this is the button that will be visible in Homekit. In the `alias` portion of its configuration, add the MAC addresses of other buttons to "alias for" or "masquerade as" that button. When buttons with those MAC addresses are pushed, it will appear to Homekit as if the visible button was pushed.

The buttons corresponding to the MAC addresses in the `alias` list are not intended to be visible as separate accessories in Homekit—do not add the buttons corresponding to the MAC addresses in the `alias` list as separate button accessories.

## WiFi Device and Monitor Mode
A WiFi device capable of *monitor mode* is needed for `tcpdump` to see Amazon Dash button activity. If your Homebridge computer's connection to the local network is via WiFi, you'll need a second WiFi device (such as a USB WiFi adapter) capable of *monitor mode*.

A USB WiFi adapter is about $10-$20 with free shipping online. If you would like some insight about compatible WiFi adapters or you have tried a USB WiFi adapter with this plugin, learn more from or share your experience with the community (good or bad) in [this repository's discussion](https://github.com/shanemcw/homebridge-amazondash-mac/discussions/1). For example, a USB WiFi device known to work in some contexts for these purposes is the **Panda 300Mbps Wireless 802.11n USB Adapter (PAU05)**.

### Example WiFi Device Configuration
This is example-only. There are several and different ways to do this.

* Confirming the WiFi device is working, visible and to get the `interface` name:
```
sudo iw dev
```
* Test the WiFi device can be put in monitor mode (`wlan0` is for example only) (method one):
```
sudo ip link set wlan0 down
sudo iw wlan0 set monitor none
sudo ip link set wlan0 up
```
* Test the WiFi device can be put in monitor mode (`wlan0` is for example only) (method two):
```
sudo ifconfig wlan0 down
sudo iwconfig wlan0 mode monitor
sudo ifconfig wlan0 up
```
* Confirm monitor mode and WiFi monitoring interface name (confirm "Mode:Monitor"):
```
iwconfig
```

## `tcpdump`
This plugin uses `tcpdump`'s ability to report on MAC addresses visible to the WiFi device (in *monitor mode*) and converts the Dash button's exposure of its MAC address on button press as a Homekit button single-press. `tcpdump` can only see Amazon Dash buttons when connected to a WiFi device in *monitor mode.*

* [Ubuntu Man Page for tcpdump](http://manpages.ubuntu.com/manpages/trusty/man8/tcpdump.8.html)

### Testing `tcpdump`
* Test `tcpdump` stand-alone with the WiFi monitoring interface name (`wlan0` is for example only):
```
sudo tcpdump -i wlan0 --monitor-mode 
```

### Installing `tcpdump`
* if the above test failed because `tcpdump` is not installed, install `tcpdump`:
```
sudo apt-get install tcpdump
```
### Permitting the `homebridge` User to run `tcpdump` via `sudo` without a password 
If `tcpdump` is not (yet) permitted to run by the `homebridge` user via `sudo` without a password prompt, you will see this log entry on restarting Homebridge:
```
[AmazonDash-MAC] ERROR: additional steps are required to allow user (user name) to run tcpdump via sudo on (host name)
[AmazonDash-MAC] ERROR: see installation documentation for next steps
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
* Save the file and exit with that text editor's method. Accept any default file names during the save and exit step.
	* `vi` or `vim` sequence 
		* esc key
		* :wq
		* enter key
	* `GNU nano` sequence
		* control-x

