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
			"key": "com.palm.webos.nightmoves-" + alarmName,
			"at": alarmTime,
			"wakeup": true,
			"uri": "palm://com.palm.applicationManager/open",
			"params": {
				"id": "com.palm.webos.nightmoves",
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
			"key": "com.palm.webos.nightmoves-" + alarmName,
			"in": alarmTime,
			"wakeup": true,
			"uri": "palm://com.palm.applicationManager/open",
			"params": {
				"id": "com.palm.webos.nightmoves",
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
		parameters: {"key": "com.palm.webos.nightmoves-" + alarmName},
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

//Set the System Volume to a given level
SystemService.prototype.SetSystemVolume = function (newVolume)
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
SystemService.prototype.SetRingtoneVolume = function (newVolume)
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
SystemService.prototype.SetSystemBrightness = function (newBrightness)
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