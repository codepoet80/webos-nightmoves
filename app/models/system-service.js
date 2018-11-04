var SystemService = Class.create({ 
	initialize: function() { 
	}
});

SystemService.SetSystemAlarmAbsolute = function(alarmName, alarmTime)
{
    Mojo.Log.info("setting absolute alarm time: " + alarmTime);
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
			Mojo.Log.info("Alarm Set Success", JSON.stringify(response));
			//News.wakeupTaskId = Object.toJSON(response.taskId);
		},
		onFailure: function(response) {
			Mojo.Log.info("Alarm Set Failure",
				JSON.stringify(response), response.errorText);
		}
	});
}

SystemService.SetSystemAlarmRelative = function(alarmName, alarmTime)
{
    Mojo.Log.info("setting relative alarm time: " + alarmTime);

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
			Mojo.Log.info("Alarm Set Success", JSON.stringify(response));
		},
		onFailure: function(response) {
			Mojo.Log.info("Alarm Set Failure",
				JSON.stringify(response), response.errorText);
		}
	});
}

SystemService.ClearSystemAlarm = function(alarmName)
{
    Mojo.Log.info("Clearing alarm: " + alarmName);
    this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "clear",
		parameters: {"key": "com.palm.webos.nightmoves-" + alarmName},
		onSuccess: function(response) {
			Mojo.Log.info("Alarm Clear Success", JSON.stringify(response));
		},
		onFailure: function(response) {
			Mojo.Log.info("Alarm Clear Failure",
				JSON.stringify(response), response.errorText);
		}
	});
}

SystemService.SetSystemVolume = function (newVolume)
{
    this.service_identifier = 'palm://com.palm.audio/system';
    var request = new Mojo.Service.Request(this.service_identifier, {
        method: 'setVolume',
        parameters: {volume: newVolume },
        onSuccess: function(response) { Mojo.Log.error("volume set!" ); },
        onFailure: function(response) { Mojo.Log.error("volume not set!", JSON.stringify(response)); }		
    });
    return request;
}

SystemService.SetSystemBrightness = function (newBrightness)
{
    this.service_identifier = 'palm://com.palm.display/control';
    var request = new Mojo.Service.Request(this.service_identifier, {
        method: 'setProperty',
        parameters:{maximumBrightness: newBrightness},
        onSuccess: function(response) { Mojo.Log.error("brightness set!" ); },
        onFailure: function(response) { Mojo.Log.error("brightess not set!", JSON.stringify(response)); }
    });
    return request;
}