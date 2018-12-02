# webos-nightmoves
![nightmoves-icon](https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/icon.png "Night Moves Icon")
Night Moves is a utility along the lines of f.lux or or Night Panel on other OSes -- save that it doesn't actually change color temperature, since there's no API for that in webOS. What it does instead is changes the screen brightness and volume (both System and Ringtone) on a schedule that you set.

You can use it to dim the screen and lower the volume at bed time, and increase them again in the morning.

As of this release it works perfectly on the Pre3, and fine on the TouchPad with an important caveat -- the TouchPad won't apply settings changes while the screen is locked. This means that the app only works if the TouchPad is charging (USB or Touchstone) or if you use a Tweak to disable the lockscreen.

<img src="https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/screenshot.png" height="400" alt="Night Moves Screenshot">