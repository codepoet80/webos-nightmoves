var appModel = null;
var systemService = null;
function AppAssistant(appController) {
	appModel = new AppModel();
	systemService = new SystemService();
	Mojo.Additions = Additions;
}

//This function will handle relaunching the app when an alarm goes off(see the device/alarm scene)
AppAssistant.prototype.handleLaunch = function(params) {

	Mojo.Log.info("Nightmoves App is Launching");
	if (!params || params["action"] == undefined)	//If no parameters were passed, this is a normal launch
	{	
		Mojo.Log.info("This is a normal launch");
		appModel.AlarmLaunch = false;
		return;
	}
    else	//If parameters were passed, this is a launch from a system alarm
    {
		Mojo.Log.info("This is a re-launch with parameters: " + JSON.stringify(params));
		appModel.AlarmLaunch = true;		
		appModel.AlarmLaunchName = params["action"];

		//get the proxy for the stage in the event it already exists (eg: app is currently open)
		var mainStage = this.controller.getStageProxy("");
		//if the stage already exists then let it handle the re-launch
		if (mainStage) {
			Mojo.Log.info("calling existing stage!");

			var stageController = this.controller.getStageController("");
			stageController.launchWithAlarm();
		} 
		//This is how we could launch a Dashboard, if we needed one.
		/*else {
			var f = function(stageController) {
				stageController.pushScene({name: "alarmAlert", sceneTemplate: "device/alarms/alarmAlert-scene"}, params);
			}
			this.controller.createStageWithCallback({
				name: 'alarm', 
				lightweight: true,
				name: stageName, 
				"height": 160, 
				sound: "/media/internal/ringtones/Rain Dance.mp3"
			}, f, 'popupalert');		
		}*/     
		return;
    }
};
