function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

var alreadyRunning = false;
StageAssistant.prototype.setup = function() 
{
	//Bind local members
	var stageController = Mojo.Controller.stageController;
	stageController.manageAlarm = this.manageAlarm;
	stageController.manageAllAlarms = this.manageAllAlarms;
	stageController.launchWithAlarm = this.launchWithAlarm;
	stageController.applySettingsFromAlarm = this.applySettingsFromAlarm;

	//Figure out how we were launched
	Mojo.Log.info("Nightmoves stage loaded.");
	this.controller.pushScene('main');
	if (appModel.AlarmLaunch)	//If its an alarm re-launch, handle the alarm and if there's no other window close
	{
		Mojo.Log.warn("Alarm stage launch at " + new Date() + ". Using alarm launch: " + appModel.AlarmLaunchName);
		this.launchWithAlarm(appModel.AlarmLaunchName);
	}
}

StageAssistant.prototype.launchWithAlarm = function(AlarmName)
{
	//var alarmTime = new Date();
	var alarmTime = new Date(Date.parse(appModel.AppSettingsCurrent[AlarmName + "Start"]));
	var today = new Date();
	alarmTime = adjustAlarmTimeToToday(alarmTime);

	/*var alarmDelta = Math.abs(today.getTime() - alarmTime.getTime());
	if (alarmDelta > 60000)
	{
		var midnightAlarm = alarmTime;
		midnightAlarm.setDate(midnightAlarm.getDate()+1);
		alarmDelta = Math.abs(today.getTime() - midnightAlarm.getTime());
		Mojo.Log.warn("alarm time " + midnightAlarm + " and " + today + " delta is " + alarmDelta);
	}
	else
	{
		Mojo.Log.warn("alarm time " + alarmTime + " and " + today + " delta is " + alarmDelta);
	}*/
	
	if (today.setMinutes(today.getMinutes()+1).getTime() >= alarmTime.getTime())
	{
		Mojo.Log.warn("This is the right time for this alarm!");
		var stageController = Mojo.Controller.stageController;
		if (stageController.getScenes().length > 0)	//Determine if we were already running or not
			alreadyRunning = true;
		else
			alreadyRunning = false;

		var stageController = Mojo.Controller.stageController;
		var touchpad = Mojo.Environment.DeviceInfo.platformVersionMajor>=3;
		if (touchpad)
		{
			//If this is a touchpad, opening a notification scene can force it to awake
			//	Then we need to close that scene after a delay
			systemModel.ShowNotificationStage("alarm", "main/alarm-scene", 140, false, false);
			setTimeout("doClose()", 2000);
		}
		this.applySettingsFromAlarm(AlarmName);
		if (!appModel.AppSettingsCurrent.Debug)
			this.manageAllAlarms(appModel.AppSettingsCurrent, AlarmName);
		else
			Mojo.Log.info("Not re-setting alarms, since we're in Debug mode");
		
		if (!alreadyRunning && !touchpad)
			stageController.window.close();
	}
	else
	{
		Mojo.Log.error("This is the wrong time for this alarm!");
	}
}

doClose = function()
{
    var stageController = Mojo.Controller.appController.getStageController("");
    Mojo.Log.info("Closing notification window at " + new Date() + " running is " + alreadyRunning);

	systemModel.AllowDisplaySleep();
	Mojo.Controller.appController.closeStage("alarm");
	if (!alreadyRunning)
	{
		Mojo.Log.info("Closing main window at " + new Date() + " running is " + alreadyRunning);
		stageController.window.close();
	}
}

//Do the actual night moves associated with this alarm
StageAssistant.prototype.applySettingsFromAlarm = function(settingName)
{
	Mojo.Log.warn("Night moves is applying settings for " + settingName + " at " + new Date());
	//Tell user what's happening
	var showSettingName;
	if (settingName == "Morn") 
	{ 
		showSettingName = "morning"; 
		if (appModel.AppSettingsCurrent["NotificationOptionEnabled"] == "true")
		{
			systemModel.setShowNotificationsWhenLocked(true);
			systemModel.setLEDLightNotifications(true);
		}
		if (appModel.AppSettingsCurrent["DataOptionEnabled"] == "true")
		{
			systemModel.setWANEnabled(true);
			systemModel.setWifiEnabled(true);
		}
	};
	if (settingName == "Eve") 
	{ 
		showSettingName = "evening"; 
	};
	if (settingName == "Nite") 
	{ 
		showSettingName = "night"; 
		if (appModel.AppSettingsCurrent["NotificationOptionEnabled"] == "true")
		{
			systemModel.setShowNotificationsWhenLocked(false);
			systemModel.setLEDLightNotifications(false);
		}
		if (appModel.AppSettingsCurrent["DataOptionEnabled"] == "true")
		{
			systemModel.setWANEnabled(false);
			systemModel.setWifiEnabled(false);
		}
	};
	Mojo.Controller.getAppController().showBanner("Night Moves set to " + showSettingName + ".", {source: 'notification'});
	
	//Apply the settings
	systemModel.SetSystemBrightness(appModel.AppSettingsCurrent[settingName + "Bright"]);
	systemModel.SetSystemVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
	systemModel.SetRingtoneVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
}

StageAssistant.prototype.manageAllAlarms = function(appSettings, currentAlarmName)
{
	Mojo.Log.warn("Night Moves is re-establishing all alarms.");
	this.manageAlarm("Morn", appSettings["MornStart"], appSettings["MornEnabled"], currentAlarmName);
	this.manageAlarm("Eve", appSettings["EveStart"], appSettings["EveEnabled"], currentAlarmName);
	this.manageAlarm("Nite", appSettings["NiteStart"], appSettings["NiteEnabled"], currentAlarmName);
	//this.manageAlarm(currentAlarmName, false, false, false);
}

adjustAlarmTimeToToday = function (alarmTime)
{
	var today = new Date();
	var alarmAdjust = new Date(alarmTime);
	alarmAdjust.setYear(today.getFullYear());
	alarmAdjust.setMonth(today.getMonth());
	alarmAdjust.setDate(today.getDate());
	return alarmAdjust;
}

//This gnarly function actually sets the alarms. Depending on how far out the next alarm time is, we might need an absolute or relative alarm.
StageAssistant.prototype.manageAlarm = function (alarmName, alarmTime, alarmEnabled, forceAbsolute)
{
	//Clear out the alarm every time
	if (systemModel.ClearSystemAlarm(alarmName))
		Mojo.Log.info("Cleared alarm: " + alarmName);
	else
		Mojo.Log.error("Could not clear alarm: " + alarmName);

	//If the alarm is on, set it again
	var alarmSetResult = false;
	if (alarmEnabled == "true" || alarmEnabled == true)	//If the alarm is on
	{
		Mojo.Log.info("### Alarm requested at: " + new Date());
		//Turn alarmTime into a current date
		Mojo.Log.info("### Alarm time passed in: " + alarmTime);
		var today = new Date();
		today.setSeconds(today.getSeconds() + 60);
		alarmTime = adjustAlarmTimeToToday(alarmTime);
		Mojo.Log.info("### Alarm time changed to: " + alarmTime);

		if (appModel.AppSettingsCurrent.Debug)	//Fire quickly in debug mode
		{
			Mojo.Log.info("### Alarm debug is on, over-riding alarm time.");
			if (systemModel.SetSystemAlarmRelative(alarmName, "00:00:05:00")) //Seconds
				alarmSetResult = "Next trigger: 5 seconds (debug)";
		}
		else	//Fire on scheduled date time
		{
			//Determine if we can use a relative alarm
			var useAbsolute = false;
			if (alarmName == forceAbsolute || forceAbsolute == true)	//If we were forced to use absolute by the call parameters
			{
				Mojo.Log.info("### Forcing absolute for alarm " + alarmName );
				useAbsolute = true;
			}
			if (today.getHours() > alarmTime.getHours())	//If the alarm time already happened, force an absolute time for tomorrow
			{
				Mojo.Log.info("### Set absolute for alarm where hours are earlier in the day " + alarmName);
				alarmTime.setDate(today.getDate()+1)
				useAbsolute = true;
			}
			if (today.getHours() == alarmTime.getHours() && today.getMinutes() >= alarmTime.getMinutes()-1) 	//If the alarm time already happened, force an absolute time for tomorrow
			{
				Mojo.Log.warn("today minutes: " + today.getMinutes());
				Mojo.Log.warn("alarm minutes: " + alarmTime.getMinutes());
				Mojo.Log.info("### Set absolute for alarm where hours and minutes are earlier in the day " + alarmName);
				alarmTime.setDate(today.getDate()+1)
				useAbsolute = true;
			}
			if (alarmTime.getTime() - today.getTime() <= 300000) 	//If the alarm time is tomorrow, but less than 5 minutes away, force relative
			{
				Mojo.Log.info("### Force relative alarm because absolute time is within 5 minutes " + alarmName);
				
				useAbsolute = false;
			}

			if (!useAbsolute)
			{
				Mojo.Log.info("### Next alarm time is today or within 5 minutes.");
				var relativeTime = (alarmTime.getTime() - today.getTime());
				Mojo.Log.info("### Relative time delta is: " + relativeTime);
				//Find the hours
				var hours = Math.floor(relativeTime / 3600000);
				if (hours < 10)
					hours = "0" + hours;
				//Found the hours, so discard them and find the remaining minutes
				relativeTime = (relativeTime - hours * 3600000);
				var minutes = Math.floor(relativeTime / 60000);
				if (minutes < 10)
					minutes = "0" + minutes;
				relativeTime = hours + ":" + minutes + ":00:00";

				Mojo.Log.info("### Relative alarm time should be: " + relativeTime);
				success = systemModel.SetSystemAlarmRelative(alarmName, relativeTime);
				if (!success)
				{
					Mojo.showAlertDialog("Error", "A relative alarm could not be set.");
					Mojo.Log.error("A relative alarm could not be set!");
				}
				else
				{
					var showTime = relativeTime.substring(0,5);
					alarmSetResult = "Next trigger: " + showTime + " from now.";
				}
			}
			else
			{
				Mojo.Log.info("### Next alarm time is tomorrow.");
				//alarmTime.setDate(alarmTime.getDate() + 1);
				Mojo.Log.info("### Alarm time requested was: " + alarmTime);
				var timeToUse = constructUTCAlarm(alarmTime, appModel.AppSettingsCurrent.Debug);
				Mojo.Log.info("### Alarm time requested is: " + alarmTime);
				success = systemModel.SetSystemAlarmAbsolute(alarmName, alarmTime);
				if (!success)
				{
					Mojo.showAlertDialog("Error", "An absolute alarm could not be set");
					Mojo.Log.error("An absolute alarm could not be set!");
				}
				else
				{
					alarmSetResult = "Next trigger: " + timeToUse + ".";
				}
			}
		}
	}
	Mojo.Log.info("Alarm set result, " + alarmSetResult);
	return alarmSetResult;
}

//Handle menu and button bar commands
StageAssistant.prototype.handleCommand = function(event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	var stageController = Mojo.Controller.stageController;
	var appController = Mojo.Controller.getAppController();

	if(event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'do-toggleDebug':
				if (appModel.AppSettingsCurrent.Debug == true)
					appModel.AppSettingsCurrent.Debug = false;
				else
					appModel.AppSettingsCurrent.Debug = true;
				appController.showBanner("Debug mode: " + appModel.AppSettingsCurrent.Debug, {source: 'notification'});
				stageController.popScene();
				stageController.pushScene("main");
				break;
			case 'do-togglePrecision':
				if (appModel.AppSettingsCurrent.PreciseTimers == true)
					appModel.AppSettingsCurrent.PreciseTimers = false;
				else
					appModel.AppSettingsCurrent.PreciseTimers = true;
				appController.showBanner("Using precision timers: " + appModel.AppSettingsCurrent.PreciseTimers, {source: 'notification'});
				stageController.popScene();
				stageController.pushScene("main");
				break;
			case 'do-myAbout':
				this.controller.showAlertDialog({
					onChoose: function(value) {},
					title: $L("Night Moves"),
					message: $L("Copyright 2018, Jonathan Wise. Available under an MIT License. Source code available at: https://github.com/codepoet80/webos-nightmoves"),
					choices:[
						{label:$L("OK"), value:""}
					]
				});
				break;
			case 'do-resetSettings':
				this.manageAlarm("Morn", false, false, false);
				this.manageAlarm("Eve", false, false, false);
				this.manageAlarm("Nite", false, false, false);
				appModel.ResetSettings();
				break;
		}
	}
}; 

constructUTCAlarm = function(useTime)
{
	var providedDate = new Date(useTime);
	var utcOffset = (providedDate.getTimezoneOffset() / 60) * -1;
	providedDate.setHours(providedDate.getHours() + utcOffset);
    var utcString = padZeroes(providedDate.getUTCMonth()+1) + "/" + padZeroes(providedDate.getDate()) + "/" + padZeroes(providedDate.getUTCFullYear());
    utcString += " " + padZeroes(providedDate.getHours()) + ":" + padZeroes(providedDate.getUTCMinutes()) + ":" + padZeroes(providedDate.getUTCSeconds());
    return utcString;
}

padZeroes = function (value)
{
    if (Number(value) < 10)
        value = "0" + value;
    return value;
}