function MainAssistant() {
	
}
var appSettingsCurrent;
var dateString = "August 25, 2001 ";
var appSettingsDefaults = {
	MornEnabled: false,
	MornStart: dateString + "06:00:00",
	MornBright: '90',
	MornVolume: '70',
	EveEnabled: false,
	EveStart: dateString + "19:30:00",
	EveBright: '40',
	EveVolume: '30',
	NiteEnabled: false,
	NiteStart: dateString + "22:00:00",
	NiteBright: '5',
	NiteVolume: '1'
};

MainAssistant.prototype.loadSettings = function () {
	var appSettings = appSettingsDefaults;
	var settingsCookie = new Mojo.Model.Cookie("settings");
	try
	{
		appSettings = settingsCookie.get();
		Mojo.Log.info("cookie had: " + typeof(appSettings));
		if (typeof settingsCookie.get() === "undefined" || settingsCookie.get() == null) {
			Mojo.Log.info("Using first run defaults!");
			var appSettings = appSettingsDefaults;
		}
		else
		{
			Mojo.Log.info("Using cookie settings!");
			Mojo.Log.info("settings are: " + settingsCookie.get())
			appSettings = settingsCookie.get();
		}
	}
	catch(ex)
	{
		appSettings = appSettingsDefaults;
		settingsCookie.put(null);
		Mojo.Log.error("Settings cookie was corrupt and has been purged!");
	}
	return appSettings;
}
	
/*
* Called before scene is visible, before any transitions take place,and before widgets are rendered.
* The scene assistant may attach event listeners to divs for widgets, as they will remain in place after the widgets are rendered.
* Transition to bring scene on stage begins after this method returns.
*/
MainAssistant.prototype.setup = function(){

	this.appSettingsCurrent = this.loadSettings();
	Mojo.Log.info("default settings: " + JSON.stringify(appSettingsDefaults));
	Mojo.Log.info("loaded settings: " + JSON.stringify(appSettingsCurrent));
	
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

MainAssistant.prototype.timeTapped = function(event) {
	var timePicked = event.srcElement.id.replace("TimeLabel", "");
	this.controller.get("drawer" + timePicked).mojo.toggleState();
}

MainAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	example, key handlers that are observing the document */
	this.SetToggleState("att-toggle-Morn", this.appSettingsCurrent["MornEnabled"]);
	this.SetToggleState("att-toggle-Eve", this.appSettingsCurrent["EveEnabled"]);
	this.SetToggleState("att-toggle-Nite", this.appSettingsCurrent["NiteEnabled"]);
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

MainAssistant.prototype.timeSaved = function (event)
{
	var findButton = this.findAncestorWithIdPart(event.srcElement, "btn", 0, 12);
	var findSettingName = findButton.id.replace("btn", "");
	var thisWidgetSetup = this.controller.getWidgetSetup("timePicker" + findSettingName);
	var setTime = thisWidgetSetup.model.time;
	this.appSettingsCurrent[findSettingName + "Start"] = setTime;
	this.updateTimeLabel(findSettingName, this.appSettingsCurrent[findSettingName + "Start"]);
	this.controller.get("drawer" + findSettingName).mojo.toggleState();
	Mojo.Controller.getAppController().showBanner("Setting timer...", {source: 'notification'});
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

MainAssistant.prototype.findAncestorWithIdPart = function (currElement, namePartToSearch, expectedIndex, levelsToClimb)
{
	var parentList = "";
	var foundElement;
	for (var i=0;i<levelsToClimb;i++)
	{
		var parentElement = currElement.parentElement;
		if (parentElement != null && parentElement.id != null && parentElement.id != "")
		{
			parentList += parentElement.id + ",";
			if (parentElement.id.indexOf(namePartToSearch) == expectedIndex)
			{
				foundElement = parentElement;
			}
		}
		else
		{
			parentList += "null,";
		}
		currElement = parentElement;
	}
	Mojo.Log.info("Discovered ancestor ids: " + parentList);
	return foundElement;
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
	Mojo.Log.info("change setting " + settingName + " to " + event.value);
	this.appSettingsCurrent[settingName] = event.value;
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
	var settingName = event.srcElement.id.replace("att-toggle-", "");
	settingName = settingName + "Enabled";
	Mojo.Log.info("change setting " + settingName + " to " + event.value);
	this.appSettingsCurrent[settingName] = event.value;
}

MainAssistant.prototype.SetToggleState = function(widgetName, newvalue)
{
	var thisWidgetSetup = this.controller.getWidgetSetup(widgetName);
	var thisWidgetModel = thisWidgetSetup.model;
	thisWidgetModel.value = newvalue;
	this.controller.setWidgetModel(widgetName, thisWidgetModel);

	//There appears to be a bug in Mojo that means a toggle button doesn't reflect its model state during instantiation
	//	This work-around fixes it.
	var children = document.getElementById(widgetName).querySelectorAll('*');
	for (var i=0; i<children.length; i++) {
		if (children[i].className.indexOf("toggle-button") != -1)
		{
			children[i].className = "toggle-button " + thisWidgetModel.value;
		}
		if (children[i].tagName == "SPAN")
		{
			if (thisWidgetModel.value.toString().toLowerCase() == "true")
				children[i].innerHTML = "on";
			else
				children[i].innerHTML = "off";
		}
	}
}

// This function will popup a dialog, displaying the message passed in.
MainAssistant.prototype.showDialogBox = function(title, message){
	this.controller.showAlertDialog({
	onChoose: function(value) {},
	title:title,
	message:message,
	choices:[ {label:'OK', value:'OK', type:'color'} ]
});
}

MainAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	this scene is popped or another scene is pushed on top */
	Mojo.Log.info("settings were: " + JSON.stringify(this.appSettingsCurrent));
	var settingsCookie = new Mojo.Model.Cookie("settings");
	settingsCookie.put(this.appSettingsCurrent);
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