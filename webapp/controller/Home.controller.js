sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/ui/table/RowAction",
    "sap/ui/table/RowActionItem",
    "sap/ui/table/RowSettings",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, Sorter, FilterOperator, RowAction, RowActionItem, RowSettings, MessageBox) {
        "use strict";

        return Controller.extend("com.ferrero.zibanreq.controller.Home", {
            onInit: function () {
                // this.getView().byId("idSTMyRequests").rebindTable(true);
                this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this._onRouteMatched, this);
                this.extendTable();
            },
            extendTable: function () {
                var oTable = this.byId("idUiTabMyRequest");
                var fnPress = this.handleActionPress.bind(this);
                var oTemplate = oTable.getRowActionTemplate();
                if (oTemplate) {
                    oTemplate.destroy();
                    oTemplate = null;
                }
                var iCount;
                this.modes = [
                    {
                        key: "Multi",
                        text: "Multiple Actions",
                        handler: function () {
                            var oTemplate = new RowAction({
                                items: [
                                    new RowActionItem({ icon: "sap-icon://action", text: "Action", press: fnPress })
                                ]
                            });
                            return [1, oTemplate];
                        }
                    }
                ];
                for (var i = 0; i < this.modes.length; i++) {
                    if ("Multi" == this.modes[i].key) {
                        var aRes = this.modes[i].handler();
                        iCount = aRes[0];
                        oTemplate = aRes[1];
                        break;
                    }
                }
                oTable.setRowActionTemplate(oTemplate);
                oTable.setRowActionCount(iCount);
            },
            handleActionPress: function (oEvent) {
                var oInput = oEvent.getSource().getParent();
                var bApprove, bReject;
                var bDelete;
                var oRecordCreator = oInput.getBindingContext().getObject().createdBy;
                // var oRecordApprover = oInput.getBindingContext().getObject().approver;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/userid");
                // if (logOnUserObj.userid && oRecordApprover.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                if (oInput.getBindingContext().getObject().status_code === "Approved" ||
                    oInput.getBindingContext().getObject().status_code === "Rejected") {
                    bApprove = false;
                } else {
                    bApprove = true;
                }
                // if (oInput.getBindingContext().getObject().status_code === "Rejected") {
                //     bEdit = false;
                // } else {
                //     bEdit = true;
                // }

                // } else {
                //     bEdit = false;
                // }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "Bottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Approve', type: 'Transparent', width: '6rem', enabled: bApprove,
                            type: "Accept",
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', type: 'Transparent', width: '6rem', enabled: bApprove,
                            type: "Reject",
                            press: this.onPressReject.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            _onRouteMatched: function () {
                // this.getView().byId("idSTMyRequests").rebindTable(true);
            },
            onSearch: function (oEvent) {
                var aFilters = [];
                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    var filter = new Filter("iban", FilterOperator.Contains, sQuery);
                    aFilters.push(filter);
                }
                var oList = this.byId("idrequestsData");
                var oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },
            onPressDownloadLink: async function (oEvent) {
                var refId = oEvent.getSource().getBindingContext().getObject().linkToAttach_uuid;
                var oModel = this.getOwnerComponent().getModel();
                var sServiceUrl = oModel.sServiceUrl + "/RequestAttachments(guid'" + refId + "')/content";
                sap.ui.core.BusyIndicator.show();
                const oAttach = await $.get(oModel.sServiceUrl + "/RequestAttachments(guid'" + refId + "')");
                var sTitle;
                if (oAttach.d) {
                    sTitle = oAttach.d.fileName;
                }
                // sap.m.URLHelper.redirect(sServiceUrl);
                var oPdfViewer = new sap.m.PDFViewer();
                oPdfViewer.setShowDownloadButton(false);
                this.getView().addDependent(oPdfViewer);


                oPdfViewer.setSource(sServiceUrl);
                oPdfViewer.setTitle(sTitle);
                sap.ui.core.BusyIndicator.hide();
                oPdfViewer.open();
            },
            onBeforeRebindTable: async function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    oModel = this.getOwnerComponent().getModel();
                // var oUserModel = this.getOwnerComponent().getModel("userModel");
                // if (!oUserModel.getProperty("/userid")) {

                //     await this.getUser();
                // }
                // var aFilter = [];
                // var newFilter = new Filter("createdBy", FilterOperator.EQ, oUserModel.getProperty("/userid"));
                // // }
                // mBindingParams.filters.push(newFilter);

                oModel.attachRequestFailed(this._showError, this);
                oModel.attachRequestCompleted(this._detach, this);
            },
            _showError: function (oResponse) {
                var oModel = this.getOwnerComponent().getModel(),
                    oMsgs = oResponse.getSource().getMessagesByEntity("/Request");
                if (oMsgs[0]) {
                    MessageBox.error(oMsgs[0].message);
                    oModel.detachRequestFailed(this._showError, this);
                }
            },
            _detach: function (oEvent) {
                var oModel = this.getOwnerComponent().getModel();
                if (oEvent.getParameter("success") === true) {
                    oModel.detachRequestFailed(this._showError, this);
                }
                oModel.detachRequestCompleted(this._detach, this);
            },
            getUser: async function () {
                var oModel = this.getOwnerComponent().getModel();
                const info = await $.get(oModel.sServiceUrl + '/getUserDetails');
                if (info.d) {
                    this.getOwnerComponent().getModel("userModel").setProperty("/userid", info.d.getUserDetails);
                }
            },
            onPressApprove: function (oEvent) {
                var oObj = oEvent.getParent().getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                var oPayLoad = {
                    "status_code": "Approved",
                    "approvedDate": new Date().toISOString()
                }
                sap.ui.core.BusyIndicator.show();
                var sPath = "/Request(" + oObj.RequestID + ")";
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        MessageBox.success("Record Approved successfully");
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(error);
                    }.bind(this)
                })
            },
            onPressReject: function (oEvent) {
                var oObj = oEvent.getParent().getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                var oPayLoad = {
                    "status_code": "Rejected",
                    "approvedDate": new Date().toISOString()
                }
                sap.ui.core.BusyIndicator.show();
                var sPath = "/Request(" + oObj.RequestID + ")";
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        MessageBox.success("Record Rejected successfully");
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error(error);
                    }.bind(this)
                })
            }
        });
    });

