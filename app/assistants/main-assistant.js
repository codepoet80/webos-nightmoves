function MainAssistant() {
	
}
var appSettingsCurrent;
var baseDateString = "August 25, 2001 ";
var appSettingsDefaults = {
	MornEnabled: 'false',
	MornStart: baseDateString + "06:00:00",
	MornBright: 90,
	MornVolume: 70,
	EveEnabled: 'false',
	EveStart: baseDateString + "19:30:00",
	EveBright: 40,
	EveVolume: 30,
	NiteEnabled: 'false',
	NiteStart: baseDateString + "22:00:00",
	NiteBright: 5,
	NiteVolume: 1
};

MainAssistant.prototype.loadSettings = function () {
	var appSettings = appSettingsDefaults;
	var settingsCookie = new Mojo.Model.Cookie("settings");
	try
	{
		appSettings = settingsCookie.get();
		if (typeof appSettings === "undefined" || appSettings == null || !this.checkSettingsValid(appSettings)) {
			Mojo.Log.info("** Using first run default settings");
			var appSettings = appSettingsDefaults;
		}
		else
		{
			Mojo.Log.info("** Using cookie settings!");
			Mojo.Log.info(JSON.stringify(appSettings))
		}
	}
	catch(ex)
	{
		appSettings = appSettingsDefaults;
		settingsCookie.put(null);
		Mojo.Log.error("** Settings cookie were corrupt and have been purged!");
	}
	return appSettings;
}

MainAssistant.prototype.checkSettingsValid = function (loadedSettings)
{
	var retValue = true;
	for (var key in appSettingsDefaults) {
		if (typeof loadedSettings[key] === undefined || loadedSettings[key] == null)
		{
			Mojo.Log.warn("** An expected saved setting, " + key + ", was null or undefined.");
			retValue = false;
		}
		if (typeof loadedSettings[key] !== typeof appSettingsDefaults[key])
		{
			Mojo.Log.warn("** A saved setting, " + key + ", was of type " + typeof(loadedSettings[key]) + " but expected type " + typeof(appSettingsDefaults[key]));
			retValue = false;
		}
		if (typeof appSettingsDefaults[key] === "string" && appSettingsDefaults[key].indexOf(baseDateString) != -1 && loadedSettings[key].indexOf(baseDateString))
		{
			Mojo.Log.info("** A saved time setting did not have the expected date value.");
			retValue = false;
		}
		if (typeof appSettingsDefaults[key] === "string" && (appSettingsDefaults[key] == "false" || appSettingsDefaults[key] == "true"))
		{
			if (loadedSettings[key] != "false" && loadedSettings[key] != "true")
			{
				Mojo.Log.info("** A saved time setting did not have the expected boolean value.");
				retValue = false;
			}
		}
	 }
	 return retValue;
}
	
/* Called before scene is visible, before any transitions take place,and before widgets are rendered. */
MainAssistant.prototype.setup = function(){

	this.appSettingsCurrent = this.loadSettings();
	Mojo.Log.info("** Loaded Settings: " + JSON.stringify(this.appSettingsCurrent));
	
	//Setup toggles
	this.timeTapped = this.timeTapped.bind(this);
	this.setupToggle('Morn', this.appSettingsCurrent);
	this.setupToggle('Eve', this.appSettingsCurrent);
	this.setupToggle('Nite', this.appSettingsCurrent);
	
	//Setup sliders
	this.sliderChanged = this.sliderChanged.bind(this);
	this.setupSlider("MornBright", this.appSettingsCurrent);
	this.setupSlider("MornVolume", this.appSettingsCurrent);
	this.setupSlider("EveBright", this.appSettingsCurrent);
	this.setupSlider("EveVolume", this.appSettingsCurrent);
	this.setupSlider("NiteBright", this.appSettingsCurrent);
	this.setupSlider("NiteVolume", this.appSettingsCurrent);
	
	//Setup time pickers
	this.timeSaved = this.timeSaved.bind(this);
	this.setupTimePicker("Morn", this.appSettingsCurrent);
	this.setupTimePicker("Eve", this.appSettingsCurrent);
	this.setupTimePicker("Nite", this.appSettingsCurrent);

	//App Menu (handled in stage controller: stage-assistant.js)
	this.controller.setupWidget(Mojo.Menu.appMenu, Mojo.Controller.stageController.appMenuAttributes, Mojo.Controller.stageController.appMenuModel);
}

MainAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	example, key handlers that are observing the document */
	Mojo.Additions.SetToggleState("att-toggle-Morn", this.appSettingsCurrent["MornEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Eve", this.appSettingsCurrent["EveEnabled"]);
	Mojo.Additions.SetToggleState("att-toggle-Nite", this.appSettingsCurrent["NiteEnabled"]);
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

	var dateString = this.appSettingsCurrent[hiddenDivName + "Start"];
	var useTime = new Date(dateString);
	this.controller.setupWidget("timePicker" + hiddenDivName,
	this.attributes = {
			label: 'Time',
			modelProperty: 'time'
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
	this.controller.get("drawer" + timePicked).mojo.toggleState();
}

MainAssistant.prototype.timeSaved = function (event)
{
	var findButton = Mojo.Additions.FindAncestorWithIdPart(event.srcElement, "btn", 0, 12);
	var findSettingName = findButton.id.replace("btn", "");
	var thisWidgetSetup = this.controller.getWidgetSetup("timePicker" + findSettingName);
	var setTime = thisWidgetSetup.model.time.getHours() + ":" + thisWidgetSetup.model.time.getMinutes();
	setTime = baseDateString + setTime;

	this.appSettingsCurrent[findSettingName + "Start"] = setTime;
	this.saveSettings();
	this.updateTimeLabel(findSettingName, this.appSettingsCurrent[findSettingName + "Start"]);
	
	Mojo.Log.info("**** Settings when time saved: " + JSON.stringify(this.appSettingsCurrent));
	this.controller.get("drawer" + findSettingName).mojo.toggleState();
	Mojo.Controller.stageController.manageAlarm(findSettingName, this.appSettingsCurrent[findSettingName + "Start"], this.appSettingsCurrent[findSettingName + "Enabled"]);
}

MainAssistant.prototype.updateTimeLabel = function (timeName, timeToUse)
{
	var myTime = new Date(timeToUse);
	var displayTime = "Start at ";
	if (myTime.getHours() > 12)
		displayTime += myTime.getHours() - 12;
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

	this.appSettingsCurrent[settingName] = event.value;
	this.saveSettings();
	Mojo.Log.info("**** Settings after slider changed: " + JSON.stringify(this.appSettingsCurrent));
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
	this.updateTimeLabel(toggleName, settings[toggleName + "Start"]);
	Mojo.Event.listen(this.controller.get(labelName), Mojo.Event.tap, this.timeTapped);
}

MainAssistant.prototype.togglePressed = function(event){
	var findSettingName = event.srcElement.id.replace("att-toggle-", "");
	findSettingName = findSettingName;

	this.appSettingsCurrent[findSettingName + "Enabled"] = event.value.toString();
	this.saveSettings();
	Mojo.Log.info("**** Settings when toggle pressed: " + JSON.stringify(this.appSettingsCurrent));

	Mojo.Controller.stageController.manageAlarm(findSettingName, this.appSettingsCurrent[findSettingName + "Start"], this.appSettingsCurrent[findSettingName + "Enabled"]);
}

MainAssistant.prototype.saveSettings = function ()
{
	var settingsCookie = new Mojo.Model.Cookie("settings");
	settingsCookie.put(this.appSettingsCurrent);
}

MainAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	this scene is popped or another scene is pushed on top */
	Mojo.Log.info("** Saved Settings: " + JSON.stringify(this.appSettingsCurrent));
	this.saveSettings();
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