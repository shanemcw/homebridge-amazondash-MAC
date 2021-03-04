# homebridge-amazondash-mac

Amazon Dash plugin for [Homebridge](https://github.com/nfarina/homebridge)

This project is a fork of [jourdant's](https://github.com/jourdant/homebridge-amazondash-ng), which is a fork of [KhaosT's](https://github.com/KhaosT) [homebridge-amazondash](https://github.com/KhaosT/homebridge-amazondash).

## Purpose
There are a number of ways to trigger events based on the button press from an Amazon Dash button. This code is based off KhaosT's code with a subtle difference. 

_This module DOESN'T listen for ARP network packets._ **This module DOES use airodump-ng to listen for Wi-Fi frames.** 

The latency is reduced between the actual button press and the action you want to perform. IE, we only need the button to power on instead of waiting for it to connect to the network before triggering an event. 

## Installation

1. Install airodump-ng
2. Set up monitor mode network interface
3. Install this plugin using: `npm install -g homebridge-amazondash-mac`
4. Update homebridge config.json
5. Run Homebridge with elevated privileges

## Config.json Example

	{
    "platform": "AmazonDash-NG",
    "name": "AmazonDash-NG",
    "interface": "wlx9cefd5fa2fdf",
    "channel": 3,
    "debug": 2,
    "buttons": [
        {
            "name": "Doorbell",
            "mac": "FF:AA:FF:AA:00:00",
            "serial": "G030QC0400868230",
            "firmware": "50018520_US"
        },
        {
            "name": "Scene One",
            "mac": "FF:FF:00:00:00:00",
            "serial": "G030MQ0370960407",
            "firmware": "50018520_US",
            "alias": [
                "AA:00:00:FF:FF:FF"
            ]
        },
        {
            "name": "Scene Two",
            "mac": "AA:FF:00:00:FF:FF",
            "serial": "G030DN0400063351",
            "firmware": "50018520_US"
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
