/*
System Model
 Version 0.2a
 Created: 2018
 Author: Jonathan Wise
 License: MIT
 Description: A generic (and therefore re-usable) model for accessing webOS system features more easily
*/

var SystemModel = function() { 

};

//Create a named System Alarm using an absolute time
SystemModel.prototype.SetSystemAlarmAbsolute = function(alarmName, alarmTime)
{
	var success = true;
    Mojo.Log.error("Setting absolute alarm time: " + alarmTime);
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
			Mojo.Log.error("Alarm Set Success", JSON.stringify(response));
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

//Create a named System Alarm using a relative time
SystemModel.prototype.SetSystemAlarmRelative = function(alarmName, alarmTime)
{
	var success = true;
    Mojo.Log.error("Setting relative alarm time: " + alarmTime);
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
			Mojo.Log.error("Alarm Set Success", JSON.stringify(response));
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
    Mojo.Log.error("Clearing alarm: " + alarmName);
    this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "clear",
		parameters: {"key": Mojo.Controller.appInfo.id + "-" + alarmName},
		onSuccess: function(response) {
			Mojo.Log.error("Alarm Clear Success", JSON.stringify(response));
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

SystemModel.prototype.PlaySound = function(soundName)
{
	var success = true;
	Mojo.Log.error("Playing sound: " + soundName);
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

SystemModel.prototype.Vibrate = function(vibePeriod, vibeDuration)
{
	var success = true;
	Mojo.Log.error("Vibrating device.");
	Mojo.Controller.getAppController().playSoundNotification("vibrate");
	//The below should work, but doesn't
	/*this.vibeRequest = new Mojo.Service.Request("palm://com.palm.vibrate/vibrate", {
		period: vibePeriod,
		duration: vibeDuration,
		onSuccess:function() { success = true; },
		onFailure:function() { success = false; }
	});*/
	return success;
}

SystemModel.prototype.AllowDisplaySleep = function ()
{
	var stageController = Mojo.Controller.getAppController().getActiveStageController();
	
	//Tell the System it doesn't have to stay awake any more
	Mojo.Log.info("allowing display sleep");

	stageController.setWindowProperties({
		blockScreenTimeout: false
	});
}

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
        onSuccess: function(response) { Mojo.Log.error("System volume set to " + newVolume ); },
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
        onSuccess: function(response) { Mojo.Log.error("Ringtone volume set to " + newVolume); },
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
        onSuccess: function(response) { Mojo.Log.error("Screen brightness set! to " + newBrightness); },
        onFailure: function(response) { Mojo.Log.error("Screen brightess not set!", JSON.stringify(response)); }
    });
    return request;
}