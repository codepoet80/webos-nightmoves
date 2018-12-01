function MainAssistant() {
	
}
	
/* Called before scene is visible, before any transitions take place,and before widgets are rendered. */
MainAssistant.prototype.setup = function()
{
	appModel.LoadSettings();
	appModel.DoReset = false;
	Mojo.Log.error("** Loaded Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
	
	//Setup toggles
	this.timeTapped = this.timeTapped.bind(this);
	this.setupToggle('Morn', appModel.AppSettingsCurrent);
	this.setupToggle('Eve', appModel.AppSettingsCurrent);
	this.setupToggle('Nite', appModel.AppSettingsCurrent);
	
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
	this.controller.setupWidget(Mojo.Menu.appMenu, Mojo.Controller.stageController.appMenuAttributes, Mojo.Controller.stageController.appMenuModel);

	//With each launch, we're going to re-establish alarms, in order to "self-heal"
	//Mojo.Controller.stageController.manageAllAlarms(appModel.AppSettingsCurrent);
}

MainAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	example, key handlers that are observing the document */

	if (appModel.AppSettingsCurrent == appModel.AppSettingsDefault)
	{		
		Mojo.Log.error("** Using first run default settings");
		this.controller.showAlertDialog({
			onChoose: function(value) {},
			title: $L("Welcome to Night Moves!"),
			message: $L("With this app, you can configure the settings you want your webOS device to be set to at different times in the day. Default settings have been loaded to get things started."),
			choices:[
				{label:$L("OK"), value:""}
			]
		});
	}

	document.body.className = "palm-default";
	if (appModel.AppSettingsCurrent.Debug == true)
	{
		document.getElementById("divDebug").innerHTML = " - Debug";
	}
	Mojo.Additions.SetToggleState("att-toggle-Morn", appModel.AppSettingsCurrent["MornEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Eve", appModel.AppSettingsCurrent["EveEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Nite", appModel.AppSettingsCurrent["NiteEnabled"]);
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
	if (appModel.AppSettingsCurrent.Debug)
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
	
	Mojo.Log.error("**** Settings when time saved: " + JSON.stringify(appModel.AppSettingsCurrent));
	this.controller.get("drawer" + findSettingName).mojo.toggleState();
	var newTime = Mojo.Controller.stageController.manageAlarm(findSettingName, appModel.AppSettingsCurrent[findSettingName + "Start"], appModel.AppSettingsCurrent[findSettingName + "Enabled"]);
	if (newTime != false)
	{
		if (newTime != true)
		{
			Mojo.Controller.getAppController().showBanner(newTime, {source: 'notification'});
		}
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
	Mojo.Log.error("**** Settings after slider changed: " + JSON.stringify(appModel.AppSettingsCurrent));
}

MainAssistant.prototype.setupToggle = function (toggleName, settings)
{
	this.attribute = {
		trueLabel:  'on',
		trueValue:  'true',
		falseLabel:  'off',
		falseValue: 'false',
		fieldName:  'toggle'
	}
	this.model = {
		value : settings[toggleName + "Enabled"],
		disabled: false 
	}
	this.controller.setupWidget('att-toggle-' + toggleName, this.attribute, this.model);

	this.togglePressed = this.togglePressed.bind(this);
	Mojo.Event.listen(this.controller.get('att-toggle-' + toggleName), Mojo.Event.propertyChange, this.togglePressed);
	var labelName = toggleName + "TimeLabel";
	var tdName = toggleName + "TimeTD";
	this.updateTimeLabel(toggleName, settings[toggleName + "Start"]);
	Mojo.Event.listen(this.controller.get(labelName), Mojo.Event.tap, this.timeTapped);
}

MainAssistant.prototype.togglePressed = function(event){
	var findSettingName = event.srcElement.id.replace("att-toggle-", "");
	findSettingName = findSettingName;

	appModel.AppSettingsCurrent[findSettingName + "Enabled"] = event.value.toString();
	appModel.SaveSettings();
	Mojo.Log.error("**** Settings when toggle pressed: " + JSON.stringify(appModel.AppSettingsCurrent));

	var newTime = Mojo.Controller.stageController.manageAlarm(findSettingName, appModel.AppSettingsCurrent[findSettingName + "Start"], appModel.AppSettingsCurrent[findSettingName + "Enabled"]);
	if (newTime != false)
	{
		if (newTime != true)
		{
			Mojo.Controller.getAppController().showBanner(newTime, {source: 'notification'});
		}
	}
}

MainAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	this scene is popped or another scene is pushed on top */
	Mojo.Log.error("Night moves is being deactivated.");
	if (appModel.DoReset)
	{
		Mojo.Log.error("Settings are being reset.");
	}
	else
	{
		Mojo.Log.error("Settings are being saved.");
	}
	Mojo.Log.error("** Saved Settings: " + JSON.stringify(appModel.AppSettingsCurrent));
	appModel.SaveSettings();
}

MainAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('att-toggle-Morn'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('att-toggle-Eve'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('att-toggle-Nite'), Mojo.Event.propertyChange, this.togglePressed);
	Mojo.Event.stopListening(this.controller.get('sldMornBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldMornVolume'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldEveBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldEveVolume'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldNiteBright'), Mojo.Event.propertyChanged, this.sliderChanged);
	Mojo.Event.stopListening(this.controller.get('sldNiteVolume'), Mojo.Event.propertyChanged, this.sliderChanged);
}	