function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {

	//Load my mojo additions
	Mojo.Additions = Additions;

	//Bind local members
	StageController = Mojo.Controller.stageController;
	StageController.manageAlarm = this.manageAlarm;
	StageController.manageAllAlarms = this.manageAllAlarms;
	StageController.resetSettings = this.resetSettings;
	StageController.launchWithAlarm = this.launchWithAlarm;
	
	//Setup App Menu
	StageController.appMenuAttributes = {omitDefaultItems: true};
	StageController.appMenuModel = { label: "Settings",
		items: [
			{label: "Debug", checkEnabled: true, command: 'do-toggleDebug'},
			{label: "Reset Settings", command: 'do-resetSettings'}, 
			{label: "About Night Moves", command: 'do-myAbout'}
		]
	};
	
	Mojo.Log.info("Nightmoves stage alarm launch: " + appModel.AlarmLaunch);
	if (!appModel.AlarmLaunch)	//If its a normal launch, start a scene
		this.controller.pushScene('main');
	else	//If its an alarm re-launch, handle the alarm and close
	{
		this.launchWithAlarm();
		StageController.window.close();
	}
}

StageAssistant.prototype.launchWithAlarm = function()
{
	Mojo.Log.info("Loadings settings for alarm: " + appModel.AlarmLaunchName);
	var settingName = appModel.AlarmLaunchName;
	var settingsCookie = new Mojo.Model.Cookie("settings");
	var appSettings = settingsCookie.get();
	
	Mojo.Log.info("Setting - Enabled is: " + appSettings[settingName + "Enabled"]);

	//Read and set brightness
	Mojo.Log.info("Setting - Brightness is: " + appSettings[settingName + "Bright"]);
	systemService.SetSystemBrightness(appSettings[settingName + "Bright"]);
	
	//Read and set volume
	Mojo.Log.info("Setting - System Volume is: " + appSettings[settingName + "Volume"]);
	systemService.SetSystemVolume(appSettings[settingName + "Volume"]);
	Mojo.Log.info("Setting - Ringtone Volume is: " + appSettings[settingName + "Volume"]);
	systemService.SetRingtoneVolume(appSettings[settingName + "Volume"]);

	//Tell user what happened
	var showSettingName;
	if (settingName == "Morn") { showSettingName = "morning"; };
	if (settingName == "Eve") { showSettingName = "evening"; };
	if (settingName == "Nite") { showSettingName = "night"; };
	setTimeout(function(showSettingName) {
		Mojo.Controller.getAppController().showBanner("Night Moves set to " + showSettingName + ".", {source: 'notification'});
	}, 2000);
	
	//Then we'll need to set the alarms again for next time, before we die
	this.manageAllAlarms(appSettings, settingName);
}

StageAssistant.prototype.manageAllAlarms = function(appSettings, currentAlarmName)
{
	Mojo.Log.info("Night Moves is re-establishing all alarms.");

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
		Mojo.Log.info("### Alarm requested at: " + new Date());
		//Turn alarmTime into a current date
		Mojo.Log.info("### Alarm time passed in: " + alarmTime);
		var alarm = new Date(alarmTime);
		alarm.setYear(today.getFullYear());
		alarm.setMonth(today.getMonth());
		alarm.setDate(today.getDate());
		alarmTime = alarm;
		Mojo.Log.info("### Alarm time changed to: " + alarmTime);

		if (appModel.Debug)	//Fire quickly
		{
			Mojo.Log.error("### Alarm debug is on, over-riding alarm time.");
			//Seconds
			systemService.SetSystemAlarmRelative(alarmName, "00:00:05:00");
		}
		else	//Fire on scheduled date time
		{
			//Determine if we can use a relative alarm
			var useAbsolute = false;
			if (alarmName == forceAbsolute)
			{
				Mojo.Log.info("Forcing absolute for alarm by name " + alarmName );
				useAbsolute = true;
			}
			if (forceAbsolute == true)
			{
				Mojo.Log.info("Forcing absolute for alarm by boolean " + alarmName );
				useAbsolute = true;
			}
			if (today.getHours() > alarm.getHours())
			{
				Mojo.Log.info("Set absolute for alarm where hours are earlier in the day " + alarmName);
				useAbsolute = true;
			}
			if (today.getHours() == alarm.getHours() && today.getMinutes() >= alarm.getMinutes()-1)
			{
				Mojo.Log.info("Set absolute for alarm where hours and minutes are earlier in the day " + alarmName);
				useAbsolute = true;
			}

			if (!useAbsolute)
			{
				Mojo.Log.info("### Next alarm time is today.");
				var relativeTime = (alarm.getTime() - today.getTime());
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
				success = systemService.SetSystemAlarmRelative(alarmName, relativeTime);
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
				Mojo.Log.info("### Next alarm time is tomorrow.");
				alarmTime.setDate(alarmTime.getDate() + 1);
				Mojo.Log.info("### Alarm time requested was: " + alarmTime);
				var timeToUse = constructUTCAlarm(alarmTime, appModel.Debug);
				Mojo.Log.info("### Alarm time requested is: " + timeToUse);
				success = systemService.SetSystemAlarmAbsolute(alarmName, timeToUse);
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
		success = systemService.ClearSystemAlarm(alarmName);
	}
	return alarmSetResult;
}

StageAssistant.prototype.handleCommand = function(event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	StageController = Mojo.Controller.stageController;

	if(event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'do-toggleDebug':
				if (appModel.Debug == true)
					appModel.Debug = false;
				else
					appModel.Debug = true;
				Mojo.Controller.getAppController().showBanner("Debug mode " + appModel.Debug, {source: 'notification'});
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
				this.resetSettings();
				break;
		}
	}
}; 

StageAssistant.prototype.resetSettings = function()
{
	//Tell main scene to drop settings
	appModel.DoReset = true;
	//Restart main scene
	StageController = Mojo.Controller.stageController;
	StageController.popScene('main');
	StageController.pushScene('main');
}

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