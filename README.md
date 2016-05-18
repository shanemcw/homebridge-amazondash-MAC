# homebridge-amazondash-ng

Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge)

This project is a fork of [KhaosT's](https://github.com/KhaosT) [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
There are a number of ways to trigger events based on the button press from an Amazon Dash button. This code is based off KhaosT's code with a subtle difference. 

_This module DOESN'T listen for ARP network packets._ **This module DOES use airodump-ng to listen for Wi-Fi frames.** 

The latency is reduced between the actual button press and the action you want to perform. IE, we only need the button to power on instead of waiting for it to connect to the network before triggering an event. 

## Installation

1. Install airodump-ng
2. Set up monitor mode network interface
3. Install this plugin using: `npm install -g homebridge-amazondash-ng`
4. Update homebridge config.json
5. Run Homebridge with elevated privileges

## Config.json Example

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

**Interface** refers to the monitor interface for airodump-ng to listen on.
**Channel** refers to the Wi-Fi channel that your button is using (the same channel as your network). Locking to a channel allows us to grab the first Wi-Fi frame within milliseconds of a button press.

## Monitor mode
I have this set up on a Raspberry Pi 2 (running raspbian) and use the following commands to place my USB Wi-Fi dongle in monitor mode:
```
iw dev wlan0 del
iw phy phy0 interface add mon0 type monitor
```

## Questions?
I'll do my best to answer them! I'll post a link here to my [blog](https://blog.jourdant.me) where I'll be writing this module up.