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
	
	//Setup App Menu
	stageController.appMenuAttributes = {omitDefaultItems: true};
		stageController.appMenuModel = { label: "Settings",
		items: [
			{label: "Debug", checkEnabled: true, command: 'do-toggleDebug'},
			{label: "Reset Settings", command: 'do-resetSettings'}, 
			{label: "About Night Moves", command: 'do-myAbout'}
		]
	};
	
	appModel.LoadSettings();

	//Figure out how we were launched
	Mojo.Log.error("Nightmoves stage loaded.");
	if (!appModel.AlarmLaunch)	//If its a normal launch, start a scene
	{
		Mojo.Log.error("Normal stage launch. Pushing main scene.");
		this.controller.pushScene('main');
	}
	else	//If its an alarm re-launch, handle the alarm and close
	{
		Mojo.Log.error("Alarm stage launch. Using alarm launch.");
		if (stageController.getScenes() > 0)
			this.launchWithAlarm(appModel.AlarmLaunchName, true);
		else
			this.launchWithAlarm(appModel.AlarmLaunchName, false);
	}
}

StageAssistant.prototype.launchWithAlarm = function(AlarmName, running)
{
	var stageController = Mojo.Controller.stageController;

	/*if (Mojo.Environment.DeviceInfo.platformVersionMajor>=3)
	{
		//This is a touchpad, working on using a scene to force it to awake
		//	Unfortunately, then it stays awake...
		var pushPopup = function(stageController)
		{
			stageController.pushScene('settings', AlarmName);
		}
		Mojo.Controller.getAppController().createStageWithCallback({name: "popupStage", lightweight: true, height: 200}, pushPopup, 'popupalert');
	}
	else
	{*/
		this.applySettingsFromAlarm(AlarmName);
		if (!appModel.AppSettingsCurrent.Debug)
		{
			this.manageAllAlarms(appModel.AppSettingsCurrent, AlarmName);
		}
		else
		{
			Mojo.Log.error("Not re-setting alarms, since we're in Debug mode");
		}
		if (!running)
			stageController.window.close();
	//}
}

StageAssistant.prototype.applySettingsFromAlarm = function(settingName)
{
	Mojo.Log.error(new Date() + " - Applying settings...");
	var stageController = Mojo.Controller.stageController;
	//Tell user what's happening
	var showSettingName;
	if (settingName == "Morn") { showSettingName = "morning"; };
	if (settingName == "Eve") { showSettingName = "evening"; };
	if (settingName == "Nite") { showSettingName = "night"; };
	//TODO: This gets hidden by the ringer icon on my Pre3.
	Mojo.Controller.getAppController().showBanner("Night Moves set to " + showSettingName + ".", {source: 'notification'});
	
	//Apply the settings
	systemModel.SetSystemBrightness(appModel.AppSettingsCurrent[settingName + "Bright"]);
	systemModel.SetSystemVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
	systemModel.SetRingtoneVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
}

StageAssistant.prototype.manageAllAlarms = function(appSettings, currentAlarmName)
{
	Mojo.Log.error("Night Moves is re-establishing all alarms.");

	this.manageAlarm("Morn", null, false);
	if (appSettings["MornEnabled"])
	    this.manageAlarm("Morn", appSettings["MornStart"], appSettings["MornEnabled"], currentAlarmName);
	this.manageAlarm("Eve", null, false);
	if (appSettings["EveEnabled"])
	    this.manageAlarm("Eve", appSettings["EveStart"], appSettings["EveEnabled"], currentAlarmName);
	this.manageAlarm("Nite", null, false);
	if (appSettings["NiteEnabled"])
	    this.manageAlarm("Nite", appSettings["NiteStart"], appSettings["NiteEnabled"], currentAlarmName);	
}

StageAssistant.prototype.manageAlarm = function (alarmName, alarmTime, alarmEnabled, forceAbsolute)
{
	var alarmSetResult = false;
	if (alarmEnabled == "true" || alarmEnabled == true)
	{
		var today = new Date();
		Mojo.Log.error("### Alarm requested at: " + new Date());
		//Turn alarmTime into a current date
		Mojo.Log.error("### Alarm time passed in: " + alarmTime);
		var alarm = new Date(alarmTime);
		alarm.setYear(today.getFullYear());
		alarm.setMonth(today.getMonth());
		alarm.setDate(today.getDate());
		alarmTime = alarm;
		Mojo.Log.error("### Alarm time changed to: " + alarmTime);

		if (appModel.AppSettingsCurrent.Debug)	//Fire quickly
		{
			Mojo.Log.error("### Alarm debug is on, over-riding alarm time.");
			//Seconds
			if (systemModel.SetSystemAlarmRelative(alarmName, "00:00:05:00"))
				alarmSetResult = "Next trigger: 5 seconds (debug)";
		}
		else	//Fire on scheduled date time
		{
			//Determine if we can use a relative alarm
			var useAbsolute = false;
			if (alarmName == forceAbsolute)
			{
				Mojo.Log.error("### Forcing absolute for alarm by name " + alarmName );
				useAbsolute = true;
			}
			if (forceAbsolute == true)
			{
				Mojo.Log.error("### Forcing absolute for alarm by boolean " + alarmName );
				useAbsolute = true;
			}
			if (today.getHours() > alarm.getHours())
			{
				Mojo.Log.error("### Set absolute for alarm where hours are earlier in the day " + alarmName);
				useAbsolute = true;
			}
			if (today.getHours() == alarm.getHours() && today.getMinutes() >= alarm.getMinutes()-1)
			{
				Mojo.Log.error("### Set absolute for alarm where hours and minutes are earlier in the day " + alarmName);
				useAbsolute = true;
			}

			if (!useAbsolute)
			{
				Mojo.Log.error("### Next alarm time is today.");
				var relativeTime = (alarm.getTime() - today.getTime());
				Mojo.Log.error("### Relative time delta is: " + relativeTime);
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

				Mojo.Log.error("### Relative alarm time should be: " + relativeTime);
				success = systemModel.SetSystemAlarmRelative(alarmName, relativeTime);
				if (!success)
				{
					Mojo.showAlertDialog("Error", "A relative alarm could not be set.");
				}
				else
				{
					var showTime = relativeTime.substring(0,5);
					alarmSetResult = "Next trigger: " + showTime + " from now.";
				}
			}
			else
			{
				Mojo.Log.error("### Next alarm time is tomorrow.");
				alarmTime.setDate(alarmTime.getDate() + 1);
				Mojo.Log.error("### Alarm time requested was: " + alarmTime);
				var timeToUse = constructUTCAlarm(alarmTime, appModel.AppSettingsCurrent.Debug);
				Mojo.Log.error("### Alarm time requested is: " + timeToUse);
				success = systemModel.SetSystemAlarmAbsolute(alarmName, timeToUse);
				if (!success)
				{
					Mojo.showAlertDialog("Error", "An absolute alarm could not be set");
				}
				else
				{
					alarmSetResult = "Next trigger: " + timeToUse + ".";
				}
			}
		}
	}
	else
	{
		success = systemModel.ClearSystemAlarm(alarmName);
	}
	return alarmSetResult;
}

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
				appController.showBanner("Debug mode " + appModel.AppSettingsCurrent.Debug, {source: 'notification'});
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
				appModel.ResetSettings();
				break;
		}
	}
}; 

constructUTCAlarm = function(useTime)
{
    var providedDate = new Date(useTime);
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