# webos-nightmoves
![nightmoves-icon](https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/icon.png "Night Moves Icon")
Night Moves is a utility along the lines of f.lux or or Night Panel on other OSes -- save that it doesn't actually change color temperature, since there's no API for that in webOS. What it does instead is changes the screen brightness and volume (both System and Ringtone) on a schedule that you set.

You can use it to dim the screen and lower the volume at bed time, and increase them again in the morning.

It currently works perfectly on the Pre3, probably works on Pre2, and works great on the TouchPad. Previous limitations about disabling the lockscreen are now mostly eliminated. More discussion here: https://forums.webosnation.com/hp-touchpad/332277-there-any-night-modes-webos-like-f-lux.html

<img src="https://raw.githubusercontent.com/codepoet80/webos-nightmoves/master/screenshot.png" height="400" alt="Night Moves Screenshot">

## change-log
- 0.0.1 - Experimental first release
- 0.1.5 - Added feature to disable data and notifications at night, and re-enable them in the morning.
- 1.0.0 - Timers are now absolute UTC time in most cases. Improved Touchpad re-launch scenario handling.
- 1.0.1 - All launch scenarios supported on Pre and TouchPad (lockscreen also works in most scenarios.)
- 1.0.2 - Fix a bug where Pre couldn't clean-up app. Add option for weekend delay on morning timer.