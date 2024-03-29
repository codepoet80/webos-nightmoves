/*
In the app assistant, we setup some app-wide global objects and handle different kinds of launches, creating and delegating to the main stage
As well as handling launches, most of the alarm application and management ended up here.
*/
var appModel = null;
var systemModel = null;
var launchParams = null;
var alarmUtils = new Object();
var AppRunning = false;
var ScreenWasOn = false;
var ProblemAppsRunning = [];
var IsTouchPad = false;
var MainStageName = "main";
function AppAssistant(appController) {
	appModel = new AppModel();
	systemModel = new SystemModel();
	Mojo.Additions = Additions;
	
	//Bind local members
	alarmUtils.manageAlarm = this.manageAlarm;
	alarmUtils.manageAllAlarms = this.manageAllAlarms;
	alarmUtils.launchWithAlarm = this.launchWithAlarm;
	alarmUtils.applySettingsFromAlarm = this.applySettingsFromAlarm;
}

//LAUNCH STEP 1A - Initial launch and state
AppAssistant.prototype.handleLaunch = function(params) {
	launchParams = params;
	Mojo.Log.info("Night Moves is Launching! Params were: " + JSON.stringify(params));
	appModel.LoadSettings();
	Mojo.Log.info("** App Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
	IsTouchPad = Mojo.Environment.DeviceInfo.platformVersionMajor>=3;
	systemModel.GetRunningApps(this.checkRunningApps.bind(this));
};

//LAUNCH STEP 1B - Determine what's running
AppAssistant.prototype.checkRunningApps = function(response)
{
	//Problem apps are ones that force the display to stay on.
	var problemApps = ["com.palm.app.kindle", "org.scummvm.scummvm"]
	var appList = JSON.stringify(response);
	Mojo.Log.info("Other running apps are: " + appList);
	for (var l=0;l<response.running.length;l++)
	{
		if(JSON.stringify(problemApps).indexOf(response.running[l].id) != -1)
		{
			Mojo.Log.warn("found a problem app: " + response.running[l].id)
			ProblemAppsRunning[ProblemAppsRunning.length] = response.running[l].processid;
		}
	}

	//Determine if we were already running
	var mainStage = this.controller.getStageProxy(MainStageName);
	if (mainStage)
	{
		Mojo.Log.info("Found existing stage, app was already running");
		AppRunning = true;
	}
	else
		Mojo.Log.info("Found no existing stage, app was not running");
	//We'll finish setting up after we learn if the screen is on or off
	systemModel.GetDisplayState(this.getDisplayStateCallBack.bind(this));
}

//LAUNCH STEP 2 - After determining state, decide what to launch
AppAssistant.prototype.getDisplayStateCallBack = function (response)
{
	Mojo.Log.info("Called back from GetDisplayState with response: " + JSON.stringify(response) + " launchParams were: " + JSON.stringify(launchParams));
	this.controller = Mojo.Controller.getAppController();
	ScreenWasOn = false;
	if (response != null && response.state != null && response.state == "on")
		ScreenWasOn = true;
		
	if (AppRunning) 	//If the stage exists, use it
	{
		var stageController = this.controller.getStageController(MainStageName);
		if (!launchParams || launchParams["action"] == undefined)	//If no parameters were passed, this is a normal launch
		{	
			Mojo.Log.info("This is a normal re-launch");
			appModel.AlarmLaunch = false;
			stageController.activate(); //bring existing stage into focus
			return;
		}
		else	//If parameters were passed, this is a launch from a system alarm
		{
			Mojo.Log.info("This is a re-launch with parameters: " + JSON.stringify(launchParams));
			appModel.AlarmLaunch = true;		
			appModel.AlarmLaunchName = launchParams["action"];

			Mojo.Log.info("Calling Alarm Apply on existing app!");
			if (IsTouchPad && !ScreenWasOn)
				this.launchSceneWithAlarm(appModel.AlarmLaunchName);
			else
				this.doAlarmApply(appModel.AlarmLaunchName);
			return;
		}
	}
	else	//If not, determine if we should make one
	{
		if (!launchParams || launchParams["action"] == undefined)	//If no parameters were passed, this is a normal launch
		{	
			Mojo.Log.info("This is a normal launch");
			appModel.AlarmLaunch = false;
			
			var pushMainScene = function(stageController) {
				stageController.pushScene(MainStageName);
			};
			var stageArguments = {name: MainStageName, lightweight: true};
			this.controller.createStageWithCallback(stageArguments, pushMainScene);
			return;
		}
		else	//If parameters were passed, this is a launch from a system alarm
		{
			Mojo.Log.info("This is a launch with parameters: " + JSON.stringify(launchParams));
			appModel.AlarmLaunch = true;		
			appModel.AlarmLaunchName = launchParams["action"];

			Mojo.Log.info("Doing silent alarm launch");
			this.doAlarmApply(appModel.AlarmLaunchName);
			return;
		}
	}
}

//LAUNCH STEP 3 - OPTION 1: Apply alarm with an active scene
AppAssistant.prototype.launchSceneWithAlarm = function(AlarmName)
{
	var stageController = this.controller.getStageController(MainStageName);
	Mojo.Log.warn("Re-launching scene with alarm, screen was on: " + ScreenWasOn + ", app was running: " + AppRunning);
	//Determine if we were already running or not
	if (stageController.getScenes().length > 0)
	{
		//swapping the scene in with animation helps the TouchPad wake up!
		stageController.window.focus();
		stageController.swapScene({ name: "main" });
	}
	this.doAlarmApply(AlarmName);
}

//LAUNCH STEP 3 - OPTION 2: Apply alarm without an active scene
AppAssistant.prototype.doAlarmApply = function(AlarmName)
{
	Mojo.Log.warn("Silently applying alarm, screen was on: " + ScreenWasOn + ", app was running: " + AppRunning);
	//Find the best way to do alarm things, depending on device type
	this.handleProblemApps();
	if (IsTouchPad)
	{
		//If this is a Touchpad, we have to do some extra heroics
		systemModel.SetDisplayState("unlock");	//Unlock the screen
		if (!ScreenWasOn)	//If the screen was off, turn it on
			systemModel.SetDisplayState("on");
		//Use a new stage to force the app to get control, we'll apply settings from there
		systemModel.ShowNotificationStage("alarm", "main/alarm-scene", 140, false, false);
		//Reset alarms
		alarmUtils.manageAllAlarms(appModel.AppSettingsCurrent, AlarmName);
		//Wait for everything to happen, then clean up
		setTimeout(this.doTouchPadAlarmFinish.bind(this), 2500);
	}
	else
	{
		//Reset alarms
		alarmUtils.manageAllAlarms(appModel.AppSettingsCurrent, AlarmName);
		//For Pre phones, we can just directly apply the settings
		alarmUtils.applySettingsFromAlarm(AlarmName);
		//Clean up
		this.doPalmPreAlarmFinish();	
	}	
}

//Apply the selected strategy to deal with problem apps
AppAssistant.prototype.handleProblemApps = function()
{
	if (ProblemAppsRunning.length > 0)
	{
		//If we're allowed to, kill the problem app
		if (appModel.AppSettingsCurrent["KillProblemApps"])
		{
			Mojo.Log.warn("Handling " + ProblemAppsRunning.length + " problem apps by killing them.");
			for (var a=0;a<ProblemAppsRunning.length;a++)
			{
				systemModel.KillApp(ProblemAppsRunning[a]);
			}
		}
		else	//Show a card so that the problem app doesn't have focus
		{
			Mojo.Log.warn("Handling " + ProblemAppsRunning.length + " problem apps by stealing focus.");
			if (AppRunning)
			{
				var stageController = this.controller.getStageController(MainStageName);
				stageController.activate();
			}
			else
			{
				var pushMainScene = function(stageController) {
					stageController.pushScene(MainStageName);
				};
				var stageArguments = {name: MainStageName, lightweight: true};
				this.controller.createStageWithCallback(stageArguments, pushMainScene);
			}
		}
	}
	else
		Mojo.Log.info("There were no problem apps to handle.");
}

//Called right away on the Pre to put the environment back the way it was before the alarm launch
AppAssistant.prototype.doPalmPreAlarmFinish = function()
{
	Mojo.Log.info("Doing Pre Alarm Finish, Screen Was On: " + ScreenWasOn + ", App Was Running: " + AppRunning);
	var stageController = Mojo.Controller.appController.getStageController(MainStageName);
	if (!ScreenWasOn)	//Turn the screen back off if was off when the alarm fired
		systemModel.SetDisplayState("off");
	if (!AppRunning && stageController != null)	//Quit the app if it wasn't running when the alarm fired
		stageController.window.close();
}

//Fires after a delay on the TouchPad to put the environment back the way it was before the alarm launch
AppAssistant.prototype.doTouchPadAlarmFinish = function()
{
	Mojo.Log.info("Doing TouchPad Alarm Finish at " + new Date() + ", Screen Was On: " + ScreenWasOn + ", App Was Running: " + AppRunning);
	var stageController = Mojo.Controller.appController.getStageController(MainStageName);
	systemModel.AllowDisplaySleep();
	Mojo.Controller.appController.closeStage("alarm");
	if (!ScreenWasOn)	//Turn the screen back off if was off when the alarm fired
		systemModel.SetDisplayState("off");
	if (!AppRunning && stageController != null)	//Quit the app if it wasn't running when the alarm fired
		stageController.window.close();
}

//Do the actual night moves associated with this alarm
AppAssistant.prototype.applySettingsFromAlarm = function(settingName)
{
	var showSettingName = "";
	Mojo.Log.warn("Applying settings for " + settingName + " at " + new Date());

	if (settingName == "Daily")
	{	
		if (appModel.AppSettingsCurrent["LunaRestartOptionEnabled"]) {
			Mojo.Log.info("A daily Luna restart was enabled...");
			systemModel.restartLuna();
		}
	} 
	else 
	{
		if (settingName == "Morn") 
		{ 
			showSettingName = "morning"; 
			if (appModel.AppSettingsCurrent["NotificationOptionEnabled"])
			{
				Mojo.Log.info("Notifications are being enabled.");
				systemModel.setShowNotificationsWhenLocked(true);
				systemModel.setLEDLightNotifications(true);
			}
			if (appModel.AppSettingsCurrent["DataOptionEnabled"])
			{
				Mojo.Log.info("Data connections are being enabled.");
				systemModel.setWANEnabled(true);
				systemModel.setWifiEnabled(true);
			}
			if (appModel.AppSettingsCurrent["BluetoothOptionEnabled"])
			{
				Mojo.Log.info("Bluetooth radio is being enabled.");
				systemModel.setBluetoothEnabled(true);
			}
		}
		if (settingName == "Eve") 
		{ 
			showSettingName = "evening"; 
		}
		if (settingName == "Nite") 
		{ 
			showSettingName = "night"; 
			if (appModel.AppSettingsCurrent["NotificationOptionEnabled"])
			{
				Mojo.Log.info("Notifications are being disabled.");
				systemModel.setShowNotificationsWhenLocked(false);
				systemModel.setLEDLightNotifications(false);
			}
			if (appModel.AppSettingsCurrent["DataOptionEnabled"])
			{
				Mojo.Log.info("Data connections are being disabled.");
				systemModel.setWANEnabled(false);
				systemModel.setWifiEnabled(false);
			}
			if (appModel.AppSettingsCurrent["BluetoothOptionEnabled"])
			{
				Mojo.Log.info("Bluetooth radio is being disabled.");
				systemModel.setBluetoothEnabled(false);
			}
		}
		
		//Apply the settings
		systemModel.SetSystemBrightness(appModel.AppSettingsCurrent[settingName + "Bright"]);
		systemModel.SetSystemVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);
		systemModel.SetRingtoneVolume(appModel.AppSettingsCurrent[settingName + "Volume"]);

		//Tell user what happened
		if (showSettingName != "")
			Mojo.Controller.getAppController().showBanner("Night Moves set to " + showSettingName + ".", {source: 'notification'});
	}
}

AppAssistant.prototype.manageAllAlarms = function(appSettings, currentAlarmName)
{
	Mojo.Log.warn("Re-establishing all alarms.");
	this.manageAlarm("Morn", appSettings["MornStart"], appSettings["MornEnabled"], currentAlarmName, true);
	this.manageAlarm("Eve", appSettings["EveStart"], appSettings["EveEnabled"], currentAlarmName, true);
	this.manageAlarm("Nite", appSettings["NiteStart"], appSettings["NiteEnabled"], currentAlarmName, true);
	if (appSettings["LunaRestartOptionEnabled"] == true) {
		this.manageAlarm("Daily", appSettings["DailyStart"], appSettings["LunaRestartOptionEnabled"], currentAlarmName, true);
	}
}

//This gnarly function actually sets the alarms. Depending on how far out the next alarm time is, we might need an absolute or relative alarm.
AppAssistant.prototype.manageAlarm = function (alarmName, alarmTime, alarmEnabled, forceAbsolute, bulk)
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
		//now is the current datetime plus/minus a minute, since alarms aren't precise
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
			var adjustedAlarmTime = new Date(alarmTime);
			if (alarmName == "Morn" && appModel.AppSettingsCurrent["MornDelayWeekend"] == "true")
			{
				adjustedAlarmTime = checkAdjustAlarmTimeForWeekends(adjustedAlarmTime);
				utcAlarm = checkAdjustAlarmTimeForWeekends(utcAlarm);
			}
			utcAlarm = constructUTCAlarm(utcAlarm);
			Mojo.Log.warn("Setting Absolute " + alarmName + " Alarm for Tomorrow: " + adjustedAlarmTime.getHours() + ":" + padZeroes(adjustedAlarmTime.getMinutes()) + " (UTC: " + utcAlarm + ")");
			alarmSetResult = systemModel.SetSystemAlarmAbsolute(alarmName, utcAlarm);
			if (alarmSetResult && !bulk)
				Mojo.Controller.getAppController().showBanner("Next trigger: tomorrow.", {source: 'notification'});
		}
		//If the alarm is more than 1 min in the future, set the time absolutely
		if (alarmTime.getTime() >= nowMax.getTime())
		{
			var utcAlarm = constructUTCAlarm(alarmTime);
			Mojo.Log.warn("Setting Absolute " + alarmName + " Alarm for Today: " + alarmTime.getHours() + ":" + padZeroes(alarmTime.getMinutes()) + " (UTC: " + utcAlarm + ")");
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

//Helper functions
adjustAlarmTimeToToday = function (theoreticalAlarmTime)
{
	var today = new Date();
	var alarmAdjusted = new Date(theoreticalAlarmTime);
	alarmAdjusted.setYear(today.getFullYear());
	alarmAdjusted.setMonth(today.getMonth());
	alarmAdjusted.setDate(today.getDate());
	return alarmAdjusted;
}

checkAdjustAlarmTimeForWeekends = function (currentAlarmTime)
{
	if (currentAlarmTime.getDay() == 0 || currentAlarmTime.getDay() == 6)
	{
		Mojo.Log.info("Next alarm time is a weekend day, adding an hour!");
		currentAlarmTime = new Date(currentAlarmTime.setHours(currentAlarmTime.getHours() + 1));
	}
	else
		Mojo.Log.info("Next alarm time is not weekend day!");
	return currentAlarmTime;
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
