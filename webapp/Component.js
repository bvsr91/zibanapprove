sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/ferrero/zibanapprove/model/models"
],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("com.ferrero.zibanapprove.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.getUser();
            },
            getUser: async function () {
                setTimeout(function () {
                }.bind(this), 10000);
                var oModel = this.getModel();
                const info = await $.get(oModel.sServiceUrl + '/getUserDetails');
                if (info.d) {
                    this.getModel("userModel").setProperty("/userid", info.d.getUserDetails);
                }
            }
        });
    }
);