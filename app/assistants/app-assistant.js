var appModel = null;
var systemModel = null;
function AppAssistant(appController) {
	appModel = new AppModel();
	systemModel = new SystemModel();
	Mojo.Additions = Additions;
}

//This function will handle relaunching the app when an alarm goes off(see the device/alarm scene)
AppAssistant.prototype.handleLaunch = function(params) {

	Mojo.Log.info("Night Moves App is Launching");
	if (!params || params["action"] == undefined)	//If no parameters were passed, this is a normal launch
	{	
		Mojo.Log.info("This is a normal launch");
		appModel.AlarmLaunch = false;
		//get the proxy for the stage in the event it already exists (eg: app is currently open)
		var mainStage = this.controller.getStageProxy("");
		if (mainStage)  //if the stage already exists then just bring it into focus
		{
			var stageController = this.controller.getStageController("");
			stageController.window.focus();
		} 
		return;
	}
    else	//If parameters were passed, this is a launch from a system alarm
    {
		Mojo.Log.info("This is a re-launch with parameters: " + JSON.stringify(params));
		appModel.AlarmLaunch = true;		
		appModel.AlarmLaunchName = params["action"];

		//get the proxy for the stage in the event it already exists (eg: app is currently open)
		var mainStage = this.controller.getStageProxy("");
		if (mainStage) //if the stage already exists then let it handle the re-launch
		{
			Mojo.Log.info("calling existing stage!");
			var stageController = this.controller.getStageController("");
			stageController.launchWithAlarm(appModel.AlarmLaunchName, true);
		}
		//If not, this will fall through to normal stage creation
		//	We'll have to handle the launch types in the stage as well
		return;
    }
};
