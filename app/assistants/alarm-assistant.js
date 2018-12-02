/* This is an assistant for the popup alarm alert
 */
function AlarmAssistant(argFromPusher){
    this.passedArguments = argFromPusher;
}

closeTimer = null;
AlarmAssistant.prototype.setup = function(){
    appModel.LoadSettings();
    systemModel.PreventDisplaySleep();
    //set up button widget
	this.controller.setupWidget('quit-button', {}, {buttonLabel:'Close'})
	this.quitButtonHandler = this.handleQuitButton.bind(this);
    Mojo.Event.listen(this.controller.get('quit-button'), Mojo.Event.tap, this.quitButtonHandler);
    Mojo.Log.error("notification stage setup at " + new Date());
    setTimeout("doClose()", 2000);
}

doClose = function()
{
    systemModel.AllowDisplaySleep();
    Mojo.Log.error("Closing notification window at " + new Date());
    Mojo.Controller.appController.closeStage("alarm");
}

AlarmAssistant.prototype.handleQuitButton = function(){
	//close just this popupAlert stage
    Mojo.Controller.appController.closeStage("alarm");

    var stageController = Mojo.Controller.appController.getStageController("");
    if (stageController)
    {
        Mojo.Log.error("current scene is " + stageController.activeScene().sceneName);
        stageController.activate();
        if (stageController.activeScene().sceneName == "timer")
        {
            //If the timer is in focus, we need to re-launch it so that it knows about the alarm
            stageController.swapScene(
            {
                transition: Mojo.Transition.none,
                name: "timer"
            });
        }
    }
    else
    {
        Mojo.Log.error("stage controller wasn't usable!");
    }
}

// Cleanup anything we did in setup function
AlarmAssistant.prototype.cleanup = function() {
	this.controller.stopListening('quit-button', Mojo.Event.tap, this.quitButtonHandler);
}