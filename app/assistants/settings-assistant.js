function SettingsAssistant(AlarmName) {
	this.alarmName = AlarmName;
}

SettingsAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	appModel.LoadSettings();
	Mojo.Log.error("** Loaded Settings: " + JSON.stringify(appModel.AppSettingsCurrent));

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	document.body.className = "settings-page";

	this.controller.setupWidget("spinnerSettings",
		this.attributes = {
			spinnerSize: "large"
		},
		this.model = {
			spinning: true
		}
	); 

	var stageController = Mojo.Controller.stageController;
	//Try to wake up the screen
	/*stageController.setWindowProperties({
		blockScreenTimeout: true
	});*/
	
	/* add event handlers to listen to events from widgets */
};

SettingsAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	var stageController = Mojo.Controller.stageController;
	var stoleFocus = false;
	if (!stageController.isActiveAndHasScenes())
	{
		stageController.window.focus();
		stoleFocus = true;
	}

	//Load settings for the alarm that woke us up
	Mojo.Log.error("Loadings settings for alarm: " + appModel.AlarmLaunchName);
	var settingName = appModel.AlarmLaunchName;
	var alarmEnabled = appModel.AppSettingsCurrent[settingName + "Enabled"];
	Mojo.Log.error("Setting - Enabled is: " + alarmEnabled);

	//Read brightness setting for this alarm
	var brightness = appModel.AppSettingsCurrent[settingName + "Bright"];
	Mojo.Log.error("Setting - Brightness is: " + brightness);
		
	//Read volume setting for this alarm
	var volume = appModel.AppSettingsCurrent[settingName + "Volume"];
	Mojo.Log.error("Setting - System Volume is: " + volume);	
	Mojo.Log.error("Setting - Ringtone Volume is: " + volume);

	if (alarmEnabled)
	{
		//Wait until the TouchPad is good and awake
		Mojo.Log.error(new Date() + " - Waiting for readiness...");
		setTimeout(function() {applySettings(settingName, brightness, volume, stoleFocus);}, 2000);
	}

	//Then we'll need to set the alarms again for next time, before we die
	if (!appModel.AppSettingsCurrent.Debug)
		stageController.manageAllAlarms(appSettings, settingName);
	else
		Mojo.Log.error("Not resetting alarms since this one was fired in Debug mode.");

	/*stageController.setWindowProperties({
		blockScreenTimeout: false
	});*/
};



lightsOut = function(stoleFocus)
{
	Mojo.Log.error(new Date() + " - Going back to sleep...");

	var stageController = Mojo.Controller.stageController;

	//Let the screen go back to sleep
	/*stageController.setWindowProperties({
		blockScreenTimeout: false
	});*/

	var currentScenes = stageController.getScenes();
	if (currentScenes.length > 1 && !stoleFocus)
	{
		//User has the main screen open and was looking at it, just pop this scene off the stack
		Mojo.Log.error("Active, popping screen to die.");
		stageController.popScene();
	}
	else
	{
		//User is not using this app, and we stole their focus, so kill the whole app
		Mojo.Log.error("Not active, killing stage to die.");
		stageController.window.close();
	}
}

SettingsAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	var stageController = Mojo.Controller.stageController;
	//Let the screen go back to sleep

	
};

SettingsAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
