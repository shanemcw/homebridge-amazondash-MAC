# homebridge-amazondash-ng

Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge)

This project is a fork of [KhaosT's](https://github.com/KhaosT) [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
There are a number of ways to trigger events based on the button press from an Amazon Dash button. This code is based off KhaosT's code mentioned above. 

This module doesn't listen for ARP packets. Instead, we use airodump-ng to search for Wi-Fi frames rather. This reduces the latency between the actual button press and the action you want to perform. IE, no need to wait for the button to connect to the Wi-Fi network before triggering an event. 

## Installation

1. Follow the [instruction](https://github.com/hortinstein/node-dash-button) to setup node-dash-button and figure out the MAC Address of the Dash Button.
2. Install this plugin using: npm install -g homebridge-amazondash
3. Update configuration file or use Homebridge's configuration service on iOS device to setup plugin.
4. Run Homebridge with elevated privileges.

### Config.json Example

	{
      "platform": "AmazonDash",
      "interface": "mon0",
      "channel": 7,
      "buttons": [
        {
          "name": "Dash Blue",
          "mac": "74:c2:46:0a:f9:3f"
        },
        {
          "name": "Dash Orange",
          "mac": "10:ae:60:4d:6a:0b"
        }
      ]
    }



### Monitor mode
```
iw dev wlan0 del
iw phy phy0 interface add mon0 type monitor
```