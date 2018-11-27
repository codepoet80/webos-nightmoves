/*
SystemService Model
 Version 0.2a
 Created: 2018
 Author: Jonathan Wise
 License: MIT
 Description: A generic (and therefore re-usable) model for accessing webOS system features more easily
*/

var SystemService = function() { 

};

//Create a named System Alarm using an absolute time
SystemService.prototype.SetSystemAlarmAbsolute = function(alarmName, alarmTime)
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
				"id": "com.jonandnic.webos.stopwatch",
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
SystemService.prototype.SetSystemAlarmRelative = function(alarmName, alarmTime)
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
				"id": "com.jonandnic.webos.stopwatch",
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
SystemService.prototype.ClearSystemAlarm = function(alarmName)
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

SystemService.prototype.PlaySound = function(soundName)
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

SystemService.prototype.Vibrate = function(vibePeriod, vibeDuration)
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

SystemService.prototype.AllowDisplaySleep = function ()
{
	var stageController = Mojo.Controller.getAppController().getActiveStageController();
	
	//Tell the System it doesn't have to stay awake any more
	Mojo.Log.info("allowing display sleep");

	stageController.setWindowProperties({
		blockScreenTimeout: false
	});
}

SystemService.prototype.PreventDisplaySleep = function ()
{
	var stageController = Mojo.Controller.getAppController().getActiveStageController();
	
	//Ask the System to stay awake while timer is running
	Mojo.Log.info("preventing display sleep");

	stageController.setWindowProperties({
		blockScreenTimeout: true
	});
}
