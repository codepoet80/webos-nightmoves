/*
System Model
 Version 0.3b
 Created: 2018
 Author: Jonathan Wise
 License: MIT
 Description: A generic (and therefore re-usable) model for accessing webOS system features more easily
*/

var SystemModel = function() { 

};

//Create a named System Alarm using relative time ("in")
SystemModel.prototype.SetSystemAlarmRelative = function(alarmName, alarmTime)
{
	var success = true;
    Mojo.Log.info("Setting relative alarm time: " + alarmTime);
    this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "set",
		parameters: {
			"key": Mojo.Controller.appInfo.id + "-" + alarmName,
			"in": alarmTime,
			"wakeup": true,
			"uri": "palm://com.palm.applicationManager/open",
			"params": {
				"id": Mojo.Controller.appInfo.id,
				"params": {"action": alarmName}
			}
		},
		onSuccess: function(response) {
			Mojo.Log.info("Alarm Set Success", JSON.stringify(response));
			success = true;
		},
		onFailure: function(response) {
			Mojo.Log.error("Alarm Set Failure",
				JSON.stringify(response), response.errorText);
			success = false;
		}
	});
	return success;
}

//Create a named System Alarm using absolute time ("at")
SystemModel.prototype.SetSystemAlarmAbsolute = function(alarmName, alarmTime)
{
	var success = true;
    Mojo.Log.info("Setting absolute alarm time: " + alarmTime);
    this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "set",
		parameters: {
			"key": Mojo.Controller.appInfo.id + "-" + alarmName,
			"at": alarmTime,
			"wakeup": true,
			"uri": "palm://com.palm.applicationManager/open",
			"params": {
				"id": Mojo.Controller.appInfo.id,
				"params": {"action": alarmName}
			}
		},
		onSuccess: function(response) {
			Mojo.Log.info("Alarm Set Success", JSON.stringify(response));
			success = true;
		},
		onFailure: function(response) {
			Mojo.Log.error("Alarm Set Failure",
				JSON.stringify(response), response.errorText);
			success = false;
		}
	});
	return success;
}

//Remove a named System alarm
SystemModel.prototype.ClearSystemAlarm = function(alarmName)
{
	var success = true;
    Mojo.Log.info("Clearing alarm: " + alarmName);
    this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "clear",
		parameters: {"key": Mojo.Controller.appInfo.id + "-" + alarmName},
		onSuccess: function(response) {
			Mojo.Log.info("Alarm Clear Success", JSON.stringify(response));
			success = true;
		},
		onFailure: function(response) {
			Mojo.Log.error("Alarm Clear Failure",
				JSON.stringify(response), response.errorText);
			success = false;
		}
	});
	return success;
}

//Play a pre-defined system sound
SystemModel.prototype.PlaySound = function(soundName)
{
	var success = true;
	Mojo.Log.info("Playing sound: " + soundName);
	this.soundRequest = new Mojo.Service.Request("palm://com.palm.audio/systemsounds", {
		method: "playFeedback",
		parameters: {
			name: soundName
		},
		onSuccess:function() { success = true; },
		onFailure:function() { success = false; }
	});
	return success;
}

//Vibrate the device -- TODO: Doesn't work
SystemModel.prototype.Vibrate = function(vibrate)
{
	var success = true;
	Mojo.Log.info("Vibrating device.");
	if (!Number(vibrate))
	{
		if (vibrate == true)
			vibeMax = 1;
		else
			vibeMax = 0;
	}	
	else
		vibeMax = Number(vibrate);
	if (vibeMax > 0)
		vibeInterval = setInterval(doVibrate, 500);

	return success;
}

//Allow the display to sleep
SystemModel.prototype.AllowDisplaySleep = function ()
{
	var stageController = Mojo.Controller.getAppController().getActiveStageController();
	
	//Tell the System it doesn't have to stay awake any more
	Mojo.Log.info("allowing display sleep");

	stageController.setWindowProperties({
		blockScreenTimeout: false
	});
}

//Prevent the display from sleeping
SystemModel.prototype.PreventDisplaySleep = function ()
{
	var stageController = Mojo.Controller.getAppController().getActiveStageController();
	
	//Ask the System to stay awake while timer is running
	Mojo.Log.info("preventing display sleep");

	stageController.setWindowProperties({
		blockScreenTimeout: true
	});
}

//Set the System Volume to a given level
SystemModel.prototype.SetSystemVolume = function (newVolume)
{
    this.service_identifier = 'palm://com.palm.audio/system';
    var request = new Mojo.Service.Request(this.service_identifier, {
        method: 'setVolume',
        parameters: {volume: newVolume },
        onSuccess: function(response) { Mojo.Log.info("System volume set to " + newVolume ); },
        onFailure: function(response) { Mojo.Log.error("System volume not set!", JSON.stringify(response)); }		
    });
    return request;
}

//Set the Ringtone Volume to a given level
SystemModel.prototype.SetRingtoneVolume = function (newVolume)
{
    this.service_identifier = 'palm://com.palm.audio/ringtone';
    var request = new Mojo.Service.Request(this.service_identifier, {
        method: 'setVolume',
        parameters: {volume: newVolume },
        onSuccess: function(response) { Mojo.Log.info("Ringtone volume set to " + newVolume); },
        onFailure: function(response) { Mojo.Log.error("Ringtone volume not set!", JSON.stringify(response)); }		
    });
    return request;
}

//Set the System Brightness to a given level
SystemModel.prototype.SetSystemBrightness = function (newBrightness)
{
    this.service_identifier = 'palm://com.palm.display/control';
    var request = new Mojo.Service.Request(this.service_identifier, {
        method: 'setProperty',
        parameters:{maximumBrightness: newBrightness},
        onSuccess: function(response) { Mojo.Log.info("Screen brightness set! to " + newBrightness); },
        onFailure: function(response) { Mojo.Log.error("Screen brightess not set!", JSON.stringify(response)); }
    });
    return request;
}

//Show a notification window in its own small stage
SystemModel.prototype.ShowNotificationStage = function(stageName, sceneName, heightToUse, sound, vibrate) 
{
	Mojo.Log.info("Showing notification stage.");
	//Determine what sound to use
	//TODO: accept a file name as input
	var soundToUse = "assets/silent.mp3";
	if (sound != false && sound != "" && sound != null)
		soundToUse = "/media/internal/ringtones/Rain Dance.mp3"
	if (vibrate != null)
		this.Vibrate(vibrate);

	var stageCallBack = function(stageController) {
		stageController.pushScene({name: stageName, sceneTemplate: sceneName});
	}
	Mojo.Controller.getAppController().createStageWithCallback({
		name: stageName, 
		lightweight: true,
		height: heightToUse, 
		sound: soundToUse,
		clickableWhenLocked: true
	}, stageCallBack, 'popupalert');
}

//Helper Functions
var vibeInterval;
var vibeCount = 0;
var vibeMax = 5;
doVibrate = function()
{
	vibeCount++;
	Mojo.Controller.getAppController().playSoundNotification("vibrate");	//Work-around because vibrate function (see below) doesn't work
	if (vibeCount >= vibeMax)
	{
		clearInterval(vibeInterval);
		vibeCount = 0;
	}

	//The below should work, but doesn't
	/*this.vibeRequest = new Mojo.Service.Request("palm://com.palm.vibrate/vibrate", {
		period: vibePeriod,
		duration: vibeDuration,
		onSuccess:function() { success = true; },
		onFailure:function() { success = false; }
	});*/
}