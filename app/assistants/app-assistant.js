/*
In the app assistant, we setup some app-wide global objects and handle different kinds of launches, creating and delegating to the main stage
Note: In theory, it should be possible to handle alarm launches without any scenes or stages by declaring noWindow:true in the appinfo.json
	However, this seems to break loading of the DOM and other shared objects, so it just wasn't worth it. As a result, during alarm
	launches, the main stage will be loaded and used -- then discarded if it wasn't already in use.
*/
var appModel = null;
var systemModel = null;
function AppAssistant(appController) {
	appModel = new AppModel();
	systemModel = new SystemModel();
	Mojo.Additions = Additions;
}

//This function will handle relaunching the app when an alarm goes off(see the device/alarm scene)
AppAssistant.prototype.handleLaunch = function(params) {
	appModel.LoadSettings();
	Mojo.Log.info("** App Settings: " + JSON.stringify(appModel.AppSettingsCurrent));

	//get the proxy for the stage in the event it already exists (eg: app is currently open)
	var mainStage = this.controller.getStageProxy("");
	Mojo.Log.info("Night Moves App is Launching");
	if (!params || params["action"] == undefined)	//If no parameters were passed, this is a normal launch
	{	
		Mojo.Log.info("This is a normal launch");
		appModel.AlarmLaunch = false;
		if (mainStage)  //if the stage already exists then just bring it into focus
		{
			var stageController = this.controller.getStageController("");
			stageController.activate();
		} 
		return;
	}
    else	//If parameters were passed, this is a launch from a system alarm
    {
		Mojo.Log.info("This is a re-launch with parameters: " + JSON.stringify(params));
		appModel.AlarmLaunch = true;		
		appModel.AlarmLaunchName = params["action"];

		if (mainStage) //if the stage already exists then let it handle the re-launch
		{
			Mojo.Log.info("calling existing stage!");
			var stageController = this.controller.getStageController("");
			stageController.activate();
			stageController.launchWithAlarm(appModel.AlarmLaunchName, true);
		}
		//If not, this will fall through to normal stage creation
		//	We'll have to handle the launch types in the stage as well
		return;
    }
};
