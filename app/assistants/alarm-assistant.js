/* 
This alarm scene is used for Touchpads, which will only pretend to change settings if running in the background
Launching this scene forces the Touchpad to wake up to deal with presenting it, and when it does we have a good
chance of successfully changing the settings. We can then close this window. All the smarts for this are in stage assistant.
 */
function AlarmAssistant(argFromPusher){
    this.passedArguments = argFromPusher;
}

AlarmAssistant.prototype.setup = function(){
    Mojo.Log.info("notification stage setup at " + new Date());
    //systemModel.SetDisplayState("unlock");
    alarmUtils.applySettingsFromAlarm(appModel.AlarmLaunchName);
}

// Cleanup anything we did in setup function
AlarmAssistant.prototype.cleanup = function() {
    Mojo.Log.info("notification stage closing at " + new Date());
}