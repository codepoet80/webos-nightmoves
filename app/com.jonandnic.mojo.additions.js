/*
Function I use often, that probably should have been part of Mojo
Some of them fix bugs in Mojo or make it easier to use.
*/

this.Additions = function () {
}

Additions.ShowDialogBox = function(title, message){
    var StageController = Mojo.Controller.getAppController().getActiveStageController();
    this.controller = StageController.activeScene();
    
    this.controller.showAlertDialog({
    onChoose: function(value) {},
    title:title,
    message:message,
        choices:[ {label:'OK', value:'OK', type:'color'} ]
    });
}

Additions.DisableWidget = function(widgetName, disabledValue)
{
    var StageController = Mojo.Controller.getAppController().getActiveStageController();
    this.controller = StageController.activeScene();

    var thisWidgetSetup = this.controller.getWidgetSetup(widgetName);
    var thisWidgetModel = thisWidgetSetup.model;
    thisWidgetModel.disabled = disabledValue;

    this.controller.setWidgetModel(widgetName, thisWidgetModel);
    this.controller.modelChanged(this.controller.get(widgetName));
}

Additions.EumerateObject = function(objectToEnumerate)
{
    for (var key in objectToEnumerate) {
        Mojo.Log.info("=== prop:" + key + ": " + objectToEnumerate[key]);
        if (objectToEnumerate.hasOwnProperty(key)) {
        var obj = objectToEnumerate[key];
        for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    Mojo.Log.info("...... sub: " + prop + " = " + obj[prop])
                }
            }
        }
    }
}

Additions.SetToggleState = function(widgetName, toggledValue)
{
    var StageController = Mojo.Controller.getAppController().getActiveStageController();
    this.controller = StageController.activeScene();

    var thisWidgetSetup = this.controller.getWidgetSetup(widgetName);
    var thisWidgetModel = thisWidgetSetup.model;
    thisWidgetModel.value = toggledValue;
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

Additions.FindAncestorWithIdPart = function (currElement, namePartToSearch, expectedIndex, levelsToClimb)
{
    var parentList = "";
    if (typeof levelsToClimb === undefined || levelsToClimb == null)
        levelsToClimb = 10;
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

function padZeroes(value)
{
    if (Number(value) < 10)
        value = "0" + value;
    return value;
}