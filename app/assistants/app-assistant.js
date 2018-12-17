/*
In the app assistant, we setup some app-wide global objects and handle different kinds of launches, creating and delegating to the main stage
Note: In theory, it should be possible to handle alarm launches without any scenes or stages by declaring noWindow:true in the appinfo.json
	However, this seems to break loading of the DOM and other shared objects, so it just wasn't worth it. As a result, during alarm
	launches, the main stage will be loaded and used -- then discarded if it wasn't already in use.
*/
var appModel = null;
var systemModel = null;
var launchParams = null;
var AppRunning = false;
function AppAssistant(appController) {
	appModel = new AppModel();
	systemModel = new SystemModel();
	Mojo.Additions = Additions;
}

//This function will handle relaunching the app when an alarm goes off(see the device/alarm scene)
AppAssistant.prototype.handleLaunch = function(params) {
	launchParams = params;
	Mojo.Log.info("Night Moves is Launching");
	appModel.LoadSettings();
	Mojo.Log.info("** App Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
	var mainStage = this.controller.getStageProxy("");
	if (mainStage) 	//If the stage exists, note that we were already running
	{
		Mojo.Log.info("Found existing stage, app was already running");
		AppRunning = true;
	}
	else
		Mojo.Log.info("Found no existing stage, app was not running");
	//We'll finish setting up after we learn if the screen is on or off
	systemModel.GetDisplayState(this.getDisplayStateCallBack);
};

AppAssistant.prototype.getDisplayStateCallBack = function (response)
{
	this.controller = Mojo.Controller.getAppController();
	screenOn = false;
	if (response != null && response.state != null && response.state == "on")
		screenOn = true;
	systemModel.SetDisplayState("unlock");

	//get the proxy for the stage in the event it already exists (eg: app is currently open)
	var mainStage = this.controller.getStageProxy("");
	if (mainStage) 	//If the stage exists, use it
	{
		var stageController = this.controller.getStageController("");
		if (!launchParams || launchParams["action"] == undefined)	//If no parameters were passed, this is a normal launch
		{	
			Mojo.Log.info("This is a normal launch");
			appModel.AlarmLaunch = false;
			stageController.activate(); //bring existing stage into focus
			return;
		}
		else	//If parameters were passed, this is a launch from a system alarm
		{
			Mojo.Log.info("This is a re-launch with parameters: " + JSON.stringify(launchParams));
			appModel.AlarmLaunch = true;		
			appModel.AlarmLaunchName = launchParams["action"];

			Mojo.Log.info("Calling existing stage!");
			var stageController = this.controller.getStageController("");
			stageController.launchWithAlarm(appModel.AlarmLaunchName, screenOn);
			
			return;
		}
	}
	//If not, this will fall through to normal stage creation
	//	We'll have to handle the launch types in the stage as well
}
