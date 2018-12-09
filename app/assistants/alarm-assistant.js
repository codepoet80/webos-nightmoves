/* This is an assistant for the popup alarm alert
 */
function AlarmAssistant(argFromPusher){
    this.passedArguments = argFromPusher;
}

closeTimer = null;
AlarmAssistant.prototype.setup = function(){
    systemModel.PreventDisplaySleep();
    Mojo.Log.info("notification stage setup at " + new Date());
}

// Cleanup anything we did in setup function
AlarmAssistant.prototype.cleanup = function() {
    Mojo.Log.info("notification stage closing at " + new Date());
}