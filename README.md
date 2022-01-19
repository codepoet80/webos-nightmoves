# webos-nightmoves
![nightmoves-icon](https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/icon.png "Night Moves Icon")
Night Moves is a utility along the lines of f.lux or or Night Panel on other OSes -- save that it doesn't actually change color temperature, since there's no API for that in webOS. What it does instead is changes the screen brightness and volume (both System and Ringtone) on a schedule that you set.

You can use it to dim the screen and lower the volume at bed time, and increase them again in the morning.

It currently works perfectly on the Pre3, probably works on Pre2, and works great on the TouchPad. Previous limitations about disabling the lockscreen are now mostly eliminated. More discussion here: https://forums.webosnation.com/hp-touchpad/332277-there-any-night-modes-webos-like-f-lux.html

<img src="https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/screenshot.png" height="400" alt="Night Moves Screenshot">

## What is This?

This is an app for the defunct mobile webOS platform, made by Palm and later acquired by HP. It runs on devices like the Palm Pre or Pixi, or the HP
Pre3 or TouchPad. 

webOS technology was acquired by LG and repurposed for TVs and IoT devices, but they made significant changes and this app will not run on those platforms.

Releases of this app, and many other new and restored apps, can be found in the [webOS Archive App Museum](http://appcatalog.webosarchive.com).

## Why?

Aside from being a fan of the platform, the author thinks consumers have lost out now that the smart phone ecosystem has devolved into a duopoly.
Apple and Google take turns copying each other, and consumers line up to buy basically the same new phone every year. The era when webOS, Blackberry and 
Windows Phone were serious competitors was marked by creativity in form factor and software development, which has been lost. This app represents a (futile)
attempt to keep webOS mobile devices useful for as long as possible.

The website [http://www.webosarchive.com](http://www.webosarchive.com) recovers, archives and maintains material related to development, and hosts services
that restore functionality to webOS devices. A small but active [community](http://www.webosarchive.com/discord) of users take advantage of these services to keep their retro devices alive.

## How?

Mobile webOS was truly a web-derived platform. Based on Linux, and able to run properly compiled Linux binaries, developers could get raw resources access (including GPU) through a PDK (Plug-in Development Kit) but most apps were written in some flavor of Javascript, interacting with a WebKit-based browser. The toolkits were heavily optimized for the devices, and web-based apps usually felt pretty close to native. Services could be written using NodeJS and talk to each other through API calls structured to look like web service calls. App front-ends were usually written in either the Mojo (pre-tablet) or Enyo (tablet and newer phones) Javascript frameworks. Enyo apps can often be run with only minor modification in any WebKit based browser (eg: Safari or Chrome).

You can learn more about these frameworks at the restored [SDK](http://sdk.webosarchive.com).

webOS devices can be found cheaply on eBay, and while the phones will cease to be useful as phones when the 3G shutdown is through, both the phones and the Touchpad can be used around the home for a variety of [fun and useful things](http://www.webosarchive.com/docs/thingstotry/).

If you have a device, instructions for activating, getting online and getting apps installed can be found in the [webOS Archive Docs section](http://www.webosarchive.com/docs/activate/).
