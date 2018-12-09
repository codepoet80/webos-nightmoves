function MainAssistant() {
	
}
	
/* Called before scene is visible, before any transitions take place,and before widgets are rendered. */
MainAssistant.prototype.setup = function()
{
	appModel.LoadSettings();
	Mojo.Log.info("** Stage Loaded Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
	var stageController = Mojo.Controller.stageController;

	//Setup App Menu
	stageController.appMenuAttributes = {omitDefaultItems: true};
		stageController.appMenuModel = { label: "Settings",
		items: [
			{label: ('Advanced'),
				items: [
					{label: "Debug Timers", checkEnabled: true, command: 'do-toggleDebug', chosen:appModel.AppSettingsCurrent.Debug },
					{label: "Precise Timers", checkEnabled: true, command: 'do-togglePrecision', chosen:appModel.AppSettingsCurrent.PreciseTimers }
				]
			},
			{label: "Reset Settings", command: 'do-resetSettings'}, 
			{label: "About Night Moves", command: 'do-myAbout'}
		]
	};
	
	//Setup toggles
	this.timeTapped = this.timeTapped.bind(this);
	this.setupTimeToggle('Morn', appModel.AppSettingsCurrent["MornEnabled"], appModel.AppSettingsCurrent["MornStart"]);
	this.setupTimeToggle('Eve', appModel.AppSettingsCurrent["EveEnabled"], appModel.AppSettingsCurrent["EveStart"]);
	this.setupTimeToggle('Nite', appModel.AppSettingsCurrent["NiteEnabled"], appModel.AppSettingsCurrent["NiteStart"]);
	this.setupToggle('NotificationOption', appModel.AppSettingsCurrent["NotificationOptionEnabled"]);
	this.setupToggle('DataOption', appModel.AppSettingsCurrent["DataOptionEnabled"]);

	//Setup sliders
	this.sliderChanged = this.sliderChanged.bind(this);
	this.setupSlider("MornBright", appModel.AppSettingsCurrent);
	this.setupSlider("MornVolume", appModel.AppSettingsCurrent);
	this.setupSlider("EveBright", appModel.AppSettingsCurrent);
	this.setupSlider("EveVolume", appModel.AppSettingsCurrent);
	this.setupSlider("NiteBright", appModel.AppSettingsCurrent);
	this.setupSlider("NiteVolume", appModel.AppSettingsCurrent);
	
	//Setup time pickers
	this.timeSaved = this.timeSaved.bind(this);
	this.setupTimePicker("Morn", appModel.AppSettingsCurrent);
	this.setupTimePicker("Eve", appModel.AppSettingsCurrent);
	this.setupTimePicker("Nite", appModel.AppSettingsCurrent);

	//App Menu (handled in stage controller: stage-assistant.js)
	this.controller.setupWidget(Mojo.Menu.appMenu, stageController.appMenuAttributes, stageController.appMenuModel);

	if (appModel.AppSettingsCurrent["Debug"])
		document.getElementById("txtExplainDebugMode").style.display = "block";
	else
		document.getElementById("txtExplainDebugMode").style.display = "none";

	//With each launch, maybe we should re-establish alarms, in order to "self-heal"
	if(appModel.AppSettingsCurrent.Debug == false)
	stageController.manageAllAlarms(appModel.AppSettingsCurrent);
}

MainAssistant.prototype.activate = function(event) {

	document.body.className = "palm-default";

	//Set toggles
	Mojo.Additions.SetToggleState("att-toggle-Morn", appModel.AppSettingsCurrent["MornEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Eve", appModel.AppSettingsCurrent["EveEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Nite", appModel.AppSettingsCurrent["NiteEnabled"]);

	//Welcome new users
	if (appModel.AppSettingsCurrent["FirstRun"] == true)
	{	
		Mojo.Log.info("** Using first run default settings");
		appModel.AppSettingsCurrent["FirstRun"] = false;
		appModel.SaveSettings();
		var welcomeMessage = "With this app, you can configure the settings you want your webOS device to be set to at different times in the day. Default settings have been loaded to get things started.";
		if (Mojo.Environment.DeviceInfo.platformVersionMajor>=3)
		{
			welcomeMessage += "<br><br><b>TouchPad Usage Notes:</b> Because the TouchPad won't allow its settings to be changed from behind the lock screen, this app will only work if the lock screen is not active. This occurs when the TouchPad is charging (including a TouchStone) or if the lock screen has been disabled with a tweak."
		}
		Mojo.Additions.ShowDialogBox("Welcome to Night Moves!", welcomeMessage);
	}
}

MainAssistant.prototype.setupTimePicker = function (hiddenDivName, settings) {
	this.controller.setupWidget("drawer" + hiddenDivName,
		this.attributes = {
			modelProperty: 'open',
			unstyled: false
		},
		this.model = {
			open: false
		}
	);

	var dateString = appModel.AppSettingsCurrent[hiddenDivName + "Start"];
	var useTime = new Date(dateString);
	var minuteInterval = 5;
	if (appModel.AppSettingsCurrent.PreciseTimers)
		minuteInterval = 1;
	this.controller.setupWidget("timePicker" + hiddenDivName,
	this.attributes = {
			label: 'Time',
			modelProperty: 'time',
			minuteInterval: minuteInterval
		},
		this.model = {
			time: useTime
		}
	);

	this.controller.setupWidget("btn" + hiddenDivName,
	this.attributes = {
		},
		this.model = {
			label : "Save",
			disabled: false
		}
	);
	Mojo.Event.listen(this.controller.get("btn" + hiddenDivName), Mojo.Event.tap, this.timeSaved);
}

MainAssistant.prototype.timeTapped = function(event) {
	var timePicked = event.srcElement.id.replace("TimeLabel", "");
	timePicked = timePicked.replace("TimeTD", "");
	this.controller.get("drawer" + timePicked).mojo.toggleState();
}

MainAssistant.prototype.timeSaved = function (event)
{
	var findButton = Mojo.Additions.FindAncestorWithIdPart(event.srcElement, "btn", 0, 12);
	var findSettingName = findButton.id.replace("btn", "");
	var thisWidgetSetup = this.controller.getWidgetSetup("timePicker" + findSettingName);
	var setTime = thisWidgetSetup.model.time.getHours() + ":" + thisWidgetSetup.model.time.getMinutes();
	setTime = appModel.BaseDateString + setTime;

	appModel.AppSettingsCurrent[findSettingName + "Start"] = setTime;
	appModel.SaveSettings();
	this.updateTimeLabel(findSettingName, appModel.AppSettingsCurrent[findSettingName + "Start"]);
	
	Mojo.Log.info("**** Settings when time saved: " + JSON.stringify(appModel.AppSettingsCurrent));
	this.controller.get("drawer" + findSettingName).mojo.toggleState();
	var newTime = Mojo.Controller.stageController.manageAlarm(findSettingName, appModel.AppSettingsCurrent[findSettingName + "Start"], appModel.AppSettingsCurrent[findSettingName + "Enabled"]);
	if (newTime != false)
	{
		Mojo.Controller.getAppController().showBanner(newTime, {source: 'notification'});
	}
}

MainAssistant.prototype.updateTimeLabel = function (timeName, timeToUse)
{
	var myTime = new Date(timeToUse);
	var displayTime = "Start at ";
	//This should be based on regional settings
	//	Currently forcing US settings with this logic
	if (myTime.getHours() > 12)
		displayTime += myTime.getHours() - 12;
	else if (myTime.getHours() == 0)
		displayTime += "12";
	else
		displayTime += myTime.getHours();
	displayTime += ":";
	if (myTime.getMinutes() < 10)
		displayTime += "0";
	displayTime += myTime.getMinutes();
	if (myTime.getHours() < 12)
		displayTime += " am";
	else
		displayTime += " pm";

	document.getElementById(timeName + "TimeLabel").innerHTML = displayTime;
}

MainAssistant.prototype.setupSlider = function (sliderName, settings)
{
	this.attributes = {
		modelProperty:	'value'
		,minValue:		1
		,maxValue:		100
		,round:			true
	    };
	this.model = {
		value : settings[sliderName]
	}
	var widgetName = "sld" + sliderName;
	this.controller.setupWidget(widgetName, this.attributes, this.model);
	var updateLabel = document.getElementById(widgetName + "Label");
	updateLabel.innerHTML = updateLabel.title + ": " + settings[sliderName]+ "%";
	Mojo.Event.listen(this.controller.get(widgetName), Mojo.Event.propertyChanged, this.sliderChanged);
}

MainAssistant.prototype.sliderChanged = function(event){
	var updateLabel = document.getElementById(event.srcElement.id + "Label");
	updateLabel.innerHTML = updateLabel.title + ": " + event.value + "%";
	var settingName = event.srcElement.id.replace("sld", "");

	appModel.AppSettingsCurrent[settingName] = event.value;
	appModel.SaveSettings();
	Mojo.Log.info("**** Settings after slider changed: " + JSON.stringify(appModel.AppSettingsCurrent));
}

MainAssistant.prototype.setupTimeToggle = function (toggleName, toggleValue, timeValue)
{
	this.setupToggle(toggleName, toggleValue);

	var labelName = toggleName + "TimeLabel";
	this.updateTimeLabel(toggleName, timeValue);
	Mojo.Event.listen(this.controller.get(labelName), Mojo.Event.tap, this.timeTapped);
}

MainAssistant.prototype.setupToggle = function (toggleName, toggleValue)
{
	this.attribute = {
		trueLabel:  'on',
		trueValue:  'true',
		falseLabel:  'off',
		falseValue: 'false',
		fieldName:  'toggle'
	}
	this.model = {
		value : toggleValue,
		disabled: false 
	}
	this.controller.setupWidget('att-toggle-' + toggleName, this.attribute, this.model);
	this.togglePressed = this.togglePressed.bind(this);
	Mojo.Event.listen(this.controller.get('att-toggle-' + toggleName), Mojo.Event.propertyChange, this.togglePressed);
}

MainAssistant.prototype.togglePressed = function(event)
{
	//Change the value in settings
	var findSettingName = event.srcElement.id.replace("att-toggle-", "");
	findSettingName = findSettingName;
	Mojo.Log.info("toggle setting: " + findSettingName);
	appModel.AppSettingsCurrent[findSettingName + "Enabled"] = event.value.toString();
	appModel.SaveSettings();
	Mojo.Log.info("**** Settings when toggle pressed: " + JSON.stringify(appModel.AppSettingsCurrent));

	if (event.srcElement.id.indexOf("Option") != -1)	//This is an option toggle
	{
		Mojo.Controller.getAppController().showBanner(findSettingName + " is " + event.value, {source: 'notification'});
	}
	else	//This is a time toggle
	{
		var newTime = Mojo.Controller.stageController.manageAlarm(findSettingName, appModel.AppSettingsCurrent[findSettingName + "Start"], appModel.AppSettingsCurrent[findSettingName + "Enabled"]);
		if (newTime != false)
		{
			Mojo.Controller.getAppController().showBanner(newTime, {source: 'notification'});
		}
	}
}

MainAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	this scene is popped or another scene is pushed on top */
	Mojo.Event.stopListening(this.controller.get('att-toggle-Morn'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('att-toggle-Eve'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('att-toggle-Nite'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('sldMornBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldMornVolume'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldEveBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldEveVolume'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldNiteBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldNiteVolume'), Mojo.Event.propertyChanged, this.sliderChanged);

	//Save settings
	Mojo.Log.info("Night moves is being deactivated.");
	appModel.SaveSettings();
	Mojo.Log.info("** Saved Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
}

MainAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	a result of being popped off the scene stack */
}	