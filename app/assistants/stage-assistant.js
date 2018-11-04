function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {

	//Load my mojo additions
	Mojo.Additions = Additions;

	//Setup App Menu
	StageController = Mojo.Controller.stageController;
	StageController.manageAlarm = this.manageAlarm;
	StageController.appMenuAttributes = {omitDefaultItems: true};
	StageController.appMenuModel = { label: "Settings",
		items: [
			{label: "Debug", checkEnabled: true, command: 'do-toggleDebug'},
			{label: "Reset Settings", command: 'do-resetSettings'}, 
			{label: "About Night Moves", command: 'do-myAbout'}
		]
	};

	this.controller.pushScene('main');
}

StageAssistant.prototype.manageAlarm = function (alarmName, alarmTime, alarmEnabled)
{
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

		if (debug)	//Fire quickly
		{
			Mojo.Log.info("### Alarm debug is on, over-riding alarm time.");
			//Seconds
			SystemService.SetSystemAlarmRelative(alarmName, "00:00:05:00");
		}
		else	//Fire on scheduled date time
		{
			if (today.getHours() < alarm.getHours() || (today.getHours() == alarm.getHours() && today.getMinutes()+1 < alarm.getMinutes()))
			{
				Mojo.Log.error("### Next alarm time is today.");
				var relativeTime = (alarm.getTime() - today.getTime());
				var hours = Math.floor(relativeTime / 3600000);
				if (hours < 10)
					hours = "0" + hours;
				var minutes = Math.floor(relativeTime / 60000);
				if (minutes < 10)
					minutes = "0" + minutes;
				relativeTime = hours + ":" + minutes + ":00:00";

				Mojo.Log.info("### Relative alarm time should be " + relativeTime);
				SystemService.SetSystemAlarmRelative(alarmName, relativeTime);
				Mojo.Log.error("### Alarm time requested was in minutes: " + relativeTime);
			}
			else
			{
				Mojo.Log.error("### Next alarm time is tomorrow.");
				alarmTime.setDate(alarmTime.getDate() + 1);
				Mojo.Log.info("### Alarm time requested was: " + alarmTime);
				var timeToUse = constructUTCAlarm(alarmTime, debug);
				Mojo.Log.error("### Alarm time requested is: " + timeToUse);
				SystemService.SetSystemAlarmAbsolute(alarmName, timeToUse);
			}			
		}
	}
	else
	{
		Mojo.Log.info("### Requesting the clearing of alarm " + alarmName);
		SystemService.ClearSystemAlarm(alarmName);
	}
}

constructUTCAlarm = function(useTime)
{
    var providedDate = new Date(useTime);
    var utcString = padZeroes(providedDate.getUTCMonth()+1) + "/" + padZeroes(providedDate.getDate()) + "/" + padZeroes(providedDate.getUTCFullYear());
    utcString += " " + padZeroes(providedDate.getHours()) + ":" + padZeroes(providedDate.getUTCMinutes()) + ":" + padZeroes(providedDate.getUTCSeconds());
    return utcString;
}

StageAssistant.prototype.handleCommand = function(event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	StageController = Mojo.Controller.stageController;

	if(event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'do-toggleDebug':
				if (debug == true)
					debug = false;
				else
					debug = true;
				Mojo.Controller.getAppController().showBanner("Debug mode " + debug, {source: 'notification'});
				break;
			case 'do-myAbout':
				this.controller.showAlertDialog({
					onChoose: function(value) {},
					title: $L("Night Moves"),
					message: $L("Copyright 2018, Jonathan Wise. Available under an MIT License. Source code available at: https://github.com/codepoet80/webos-stopwatch"),
					choices:[
						{label:$L("OK"), value:""}
					]
				});
				break;
			case 'do-resetSettings':
				var settingsCookie = new Mojo.Model.Cookie("settings");
				appSettings = settingsCookie.put(null);
				this.controller.showAlertDialog({
					onChoose: function(value) {},
					title: $L("Night Moves"),
					message: $L("Preferences storage has been cleared."),
					choices:[
						{label:$L("OK"), value:""}
					]
				});
				break;
		}
	}
  }; 