function MainAssistant() {
	
}
var appSettingsCurrent;
var appSettingsDefaults = {
	MornEnabled: false,
	MornStart: '6:37',
	MornBright: '98',
	MornVolume: '78',
	EveEnabled: true,
	EveStart: '19:39',
	EveBright: '46',
	EveVolume: '36',
	NiteEnabled: true,
	NiteStart: '22:03',
	NiteBright: '8',
	NiteVolume: '7'
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
	
	this.setupToggle('Morn', this.appSettingsCurrent);
	this.setupToggle('Eve', this.appSettingsCurrent);
	this.setupToggle('Nite', this.appSettingsCurrent);
	
	this.sliderChanged = this.sliderChanged.bind(this);
	this.setupSlider("MornBright", this.appSettingsCurrent);
	this.setupSlider("MornVolume", this.appSettingsCurrent);
	this.setupSlider("EveBright", this.appSettingsCurrent);
	this.setupSlider("EveVolume", this.appSettingsCurrent);
	this.setupSlider("NiteBright", this.appSettingsCurrent);
	this.setupSlider("NiteVolume", this.appSettingsCurrent);			
}

MainAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	example, key handlers that are observing the document */
	this.SetToggleState("att-toggle-Morn", this.appSettingsCurrent["MornEnabled"]);
	this.SetToggleState("att-toggle-Eve", this.appSettingsCurrent["EveEnabled"]);
	this.SetToggleState("att-toggle-Nite", this.appSettingsCurrent["NiteEnabled"]);
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
	document.getElementById(labelName).innerHTML = "Start at " + settings[toggleName + "Start"];
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

	//There appears to be a bug in Mojo that means a toggle button doesn't show its model state during instantiation
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
	//Mojo.Event.stopListening(this.controller.get('att-toggle'),Mojo.Event.propertyChange,this.togglePressed);
	//Mojo.Event.stopListening(this.controller.get('Button'),Mojo.Event.tap,this.buttonPressed);
		
}	