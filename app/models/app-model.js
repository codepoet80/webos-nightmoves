var AppModel = function()
{
    this.AlarmLaunch = false;
    this.AlarmLaunchName = null;
    this.DoReset = false;
    this.BaseDateString = "August 25, 2001 ";
    this.AppSettingsCurrent = null;
    this.AppSettingsDefaults = {
		Debug: false,
        MornEnabled: 'false',
        MornStart: this.BaseDateString + "06:00:00",
        MornBright: 90,
        MornVolume: 70,
        EveEnabled: 'false',
        EveStart: this.BaseDateString + "19:30:00",
        EveBright: 40,
        EveVolume: 30,
        NiteEnabled: 'false',
        NiteStart: this.BaseDateString + "22:00:00",
        NiteBright: 5,
        NiteVolume: 1
    };
}

AppModel.prototype.LoadSettings = function () {
    this.AppSettingsCurrent = this.AppSettingsDefaults;
    var loadSuccess = false;
    var settingsCookie = new Mojo.Model.Cookie("settings");
	try
	{
		appSettings = settingsCookie.get();
		if (typeof appSettings === "undefined" || appSettings == null || !this.checkSettingsValid(appSettings)) {
			Mojo.Log.error("** Using first run default settings");
		}
		else
		{
			Mojo.Log.error("** Using cookie settings!");
            Mojo.Log.error(JSON.stringify(appSettings))
            this.AppSettingsCurrent = appSettings;
            loadSuccess = true;
		}
	}
	catch(ex)
	{
		settingsCookie.put(null);
		Mojo.Log.error("** Settings cookie were corrupt and have been purged!");
	}
	return loadSuccess;
}

AppModel.prototype.checkSettingsValid = function (loadedSettings)
{
	var retValue = true;
	for (var key in this.AppSettingsDefaults) {
		if (typeof loadedSettings[key] === undefined || loadedSettings[key] == null)
		{
			Mojo.Log.warn("** An expected saved setting, " + key + ", was null or undefined.");
			retValue = false;
		}
		if (typeof loadedSettings[key] !== typeof this.AppSettingsDefaults[key])
		{
			Mojo.Log.warn("** A saved setting, " + key + ", was of type " + typeof(loadedSettings[key]) + " but expected type " + typeof(this.AppSettingsDefaults[key]));
			retValue = false;
		}
		if (typeof this.AppSettingsDefaults[key] === "string" && this.AppSettingsDefaults[key].indexOf(this.BaseDateString) != -1 && loadedSettings[key].indexOf(this.BaseDateString))
		{
			Mojo.Log.error("** A saved time setting did not have the expected date value.");
			retValue = false;
		}
		if (typeof this.AppSettingsDefaults[key] === "string" && (this.AppSettingsDefaults[key] == "false" || this.AppSettingsDefaults[key] == "true"))
		{
			if (loadedSettings[key] != "false" && loadedSettings[key] != "true")
			{
				Mojo.Log.error("** A saved time setting did not have the expected boolean value.");
				retValue = false;
			}
		}
	 }
	 return retValue;
}

AppModel.prototype.SaveSettings = function ()
{
	var settingsCookie = new Mojo.Model.Cookie("settings");
	settingsCookie.put(appModel.AppSettingsCurrent);
}

AppModel.prototype.ResetSettings = function()
{
	//Tell main scene to drop settings
	this.DoReset = true;
	//Restart main scene
	var stageController = Mojo.Controller.stageController;
	stageController.popScene('main');
	stageController.pushScene('main');
}