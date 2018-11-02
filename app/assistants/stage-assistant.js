function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	//Setup App Menu
	StageController = Mojo.Controller.stageController;
	StageController.appMenuAttributes = {omitDefaultItems: true};
	StageController.appMenuModel = { label: "Settings",
		items: [{label: "Reset Settings", command: 'do-resetSettings'}, {label: "About Night Moves", command: 'do-myAbout'}]
	};

	this.controller.pushScene('main');
}

StageAssistant.prototype.handleCommand = function(event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	StageController = Mojo.Controller.stageController;

	if(event.type == Mojo.Event.command) {
		switch(event.command) {
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