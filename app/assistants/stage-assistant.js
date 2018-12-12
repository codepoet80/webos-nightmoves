/*
As well as handling launches, most of the alarm application and management ended up here.
While this could probably be factored out to a seperate model, this Stage is sort of the centre of intelligence in the app, so I just kept it here
*/

function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

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
	if (appModel.AlarmLaunch)	//If its an alarm re-launch, call the alarm launch handler
	{
		Mojo.Log.warn("Alarm stage launch at " + new Date() + ". Using alarm launch: " + appModel.AlarmLaunchName);
		this.launchWithAlarm(appModel.AlarmLaunchName);
	}
}

var alreadyRunning = false;
StageAssistant.prototype.launchWithAlarm = function(AlarmName)
{
	var stageController = Mojo.Controller.stageController;
	//Determine if we were already running or not
	if (stageController.getScenes().length > 0)
		alreadyRunning = true;

	//Find the best way to do alarm things, depending on device type
	var touchpad = Mojo.Environment.DeviceInfo.platformVersionMajor>=3;
	if (touchpad)
	{
		//If this is a Touchpad, opening a notification scene can force it to awake and apply settings
		//	Then we need to close that scene after a delay
		systemModel.ShowNotificationStage("alarm", "main/alarm-scene", 140, false, false);
		setTimeout("doClose()", 2000);
	}
	else
	{
		//For Pre phones, we can just directly apply the settings
		this.applySettingsFromAlarm(AlarmName);
	}
	
	//Reset alarms
	this.manageAllAlarms(appModel.AppSettingsCurrent, AlarmName);
	
	//For phones, close the app if it wasn't active before.
	//	On Touchpads we'll make this decision later
	if (!alreadyRunning && !touchpad)
		stageController.window.close();
}

//Do the actual night moves associated with this alarm
StageAssistant.prototype.applySettingsFromAlarm = function(settingName)
{
	Mojo.Log.warn("Night Moves is applying settings for " + settingName + " at " + new Date());

	var showSettingName;
	if (settingName == "Morn") 
	{ 
		showSettingName = "morning"; 
		if (appModel.AppSettingsCurrent["NotificationOptionEnabled"] == "true")
		{
			Mojo.Log.warn("Notifications are being enabled.");
			systemModel.setShowNotificationsWhenLocked(true);
			systemModel.setLEDLightNotifications(true);
		}
		if (appModel.AppSettingsCurrent["DataOptionEnabled"] == "true")
		{
			Mojo.Log.warn("Data connections are being enabled.");
			systemModel.setWANEnabled(true);
			systemModel.setWifiEnabled(true);
		}
	}
	if (settingName == "Eve") 
	{ 
		showSettingName = "evening"; 
	}
	if (settingName == "Nite") 
	{ 
		showSettingName = "night"; 
		if (appModel.AppSettingsCurrent["NotificationOptionEnabled"] == "true")
		{
			Mojo.Log.warn("Notifications are being disabled.");
			systemModel.setShowNotificationsWhenLocked(false);
			systemModel.setLEDLightNotifications(false);
		}
		if (appModel.AppSettingsCurrent["DataOptionEnabled"] == "true")
		{
			Mojo.Log.warn("Data connections are being enabled.");
			systemModel.setWANEnabled(false);
			systemModel.setWifiEnabled(false);
		}
	}
	
	//Apply the settings
	systemModel.SetSystemBrightness(appModel.AppSettingsCurrent[settingName + "Bright"]);
	systemModel.SetSystemVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
	systemModel.SetRingtoneVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);

	//Tell user what happened
	Mojo.Controller.getAppController().showBanner("Night Moves set to " + showSettingName + ".", {source: 'notification'});
}

StageAssistant.prototype.manageAllAlarms = function(appSettings, currentAlarmName)
{
	Mojo.Log.warn("Night Moves is re-establishing all alarms.");
	this.manageAlarm("Morn", appSettings["MornStart"], appSettings["MornEnabled"], currentAlarmName, true);
	this.manageAlarm("Eve", appSettings["EveStart"], appSettings["EveEnabled"], currentAlarmName, true);
	this.manageAlarm("Nite", appSettings["NiteStart"], appSettings["NiteEnabled"], currentAlarmName, true);
}

//This gnarly function actually sets the alarms. Depending on how far out the next alarm time is, we might need an absolute or relative alarm.
StageAssistant.prototype.manageAlarm = function (alarmName, alarmTime, alarmEnabled, forceAbsolute, bulk)
{
	var alarmSetResult = true;
	//Clear out the alarm every time
	if (systemModel.ClearSystemAlarm(alarmName))
		Mojo.Log.info("Cleared alarm: " + alarmName);
	else
		Mojo.Log.error("Could not clear alarm: " + alarmName);

	//If the alarm is on, set it again
	var alarmType = "absolute";
	if (alarmEnabled == "true" || alarmEnabled == true)
	{
		//now is the current datetime plus/minutes a minute, since alarms aren't precise
		var now = new Date();
		var nowMax = new Date(now.setSeconds(now.getSeconds() + 60));
		var nowMin = new Date(now.setSeconds(now.getSeconds() - 60));

		//alarmTime: adjust theoretical alarm time to today
		alarmTime = new Date(adjustAlarmTimeToToday(alarmTime));

		//If the alarm is 1 min or less in the future, and not a currently active alarm
		if (alarmTime.getTime() > nowMin.getTime() && alarmTime.getTime() < nowMax.getTime())
		{
			if (forceAbsolute != true && forceAbsolute != alarmName)
			{
				alarmType = "relative";
				var relativeTime = (alarmTime.getTime() - now.getTime());				
				var hours = Math.floor(relativeTime / 3600000); //Find the hours
				relativeTime = (relativeTime - hours * 3600000); //Found the hours, so discard them and find the remaining minutes
				var minutes = Math.floor(relativeTime / 60000);
				relativeTime = (relativeTime - minutes * 60000); //Found the minutes, so discard them and find the remain seconds
				var seconds = Math.floor(relativeTime / 1000);
				relativeTime = padZeroes(hours) + ":" + padZeroes(minutes) + ":" + padZeroes(seconds) + ":00";

				Mojo.Log.warn("Setting Relative " + alarmName + " Alarm: " + relativeTime);
				alarmSetResult = systemModel.SetSystemAlarmRelative(alarmName, relativeTime);
				if (alarmSetResult && !bulk)
					Mojo.Controller.getAppController().showBanner("Next trigger: in seconds.", {source: 'notification'});
			}
			else
			{
				//Subtract another 30 seconds to ensure this alarm time is in the past, and fall through to absolute alarm setting
				alarmTime.setSeconds(alarmTime.getSeconds()-30);
			}
		}
		//If the alarm is in the past, move the date to tomorrow and set the time absolutely
		if (alarmTime.getTime() <= nowMin.getTime())
		{
			//Move the date to tomorrow
			var utcAlarm = new Date(alarmTime.getTime());
			utcAlarm.setDate(utcAlarm.getDate() + 1);
			utcAlarm = constructUTCAlarm(utcAlarm);
			Mojo.Log.warn("Setting Absolute " + alarmName + " Alarm for Tomorrow: " + alarmTime + " (UTC: " + utcAlarm + ")");
			alarmSetResult = systemModel.SetSystemAlarmAbsolute(alarmName, utcAlarm);
			if (alarmSetResult && !bulk)
				Mojo.Controller.getAppController().showBanner("Next trigger: tomorrow.", {source: 'notification'});
		}
		//If the alarm is more than 1 min in the future, set the time absolutely
		if (alarmTime.getTime() >= nowMax.getTime())
		{
			var utcAlarm = constructUTCAlarm(alarmTime);
			Mojo.Log.warn("Setting Absolute " + alarmName + " Alarm for Today: " + alarmTime + " (UTC: " + utcAlarm + ")");
			alarmSetResult = systemModel.SetSystemAlarmAbsolute(alarmName, utcAlarm);
			if (alarmSetResult && !bulk)
				Mojo.Controller.getAppController().showBanner("Next trigger: later today.", {source: 'notification'});
		}
	}
	if (alarmSetResult)
		Mojo.Log.info(alarmType + " alarm set succeeded!");
	else
	{
		Mojo.Log.error(alarmType + " " + alarmName + " alarm set failed!")
		Mojo.Controller.getAppController().showBanner("Failed to set next trigger!", {source: 'notification'});
	}
	return alarmSetResult;
}

//Handle menu and button bar commands
StageAssistant.prototype.handleCommand = function(event) {
	var currentScene = Mojo.Controller.stageController.activeScene();
	var stageController = Mojo.Controller.stageController;
	var appController = Mojo.Controller.getAppController();

	if(event.type == Mojo.Event.command) {
		switch(event.command) {
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
				currentScene.showAlertDialog({
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

//Helper functions
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

adjustAlarmTimeToToday = function (theoreticalAlarmTime)
{
	var today = new Date();
	var alarmAdjusted = new Date(theoreticalAlarmTime);
	alarmAdjusted.setYear(today.getFullYear());
	alarmAdjusted.setMonth(today.getMonth());
	alarmAdjusted.setDate(today.getDate());
	return alarmAdjusted;
}

constructUTCAlarm = function(useTime)
{
	var providedDate = new Date(useTime);
	var utcOffset = (providedDate.getTimezoneOffset() / 60);
	providedDate.setHours(providedDate.getHours() + utcOffset);
    var utcString = padZeroes(providedDate.getUTCMonth()+1) + "/" + padZeroes(providedDate.getDate()) + "/" + padZeroes(providedDate.getUTCFullYear());
    utcString += " " + padZeroes(providedDate.getHours()) + ":" + padZeroes(providedDate.getUTCMinutes()) + ":" + padZeroes(providedDate.getUTCSeconds());
	return utcString;
}

padZeroes = function(num) 
{ 
	return ((num>9)?"":"0")+num; 
}