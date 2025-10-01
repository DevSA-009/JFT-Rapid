const alertDialogSA = (msg, multiline = false) => {

    // ALERTDIALOGSA
    // =============
    const alertDialogSA = new Window("dialog", undefined, undefined, { closeButton: false });
    alertDialogSA.text = "Alert Dialog";
    alertDialogSA.orientation = "column";
    alertDialogSA.alignChildren = ["center", "center"];
    alertDialogSA.spacing = 10;
    alertDialogSA.margins = 10;

    // ALERTPANEL
    // ==========
    const alertPanel = alertDialogSA.add("panel", undefined, undefined, { name: "alertPanel" });
    alertPanel.text = "Message";
    alertPanel.preferredSize.width = 500;
    alertPanel.orientation = "column";
    alertPanel.alignChildren = ["left", "top"];
    alertPanel.spacing = 10;
    alertPanel.margins = [0, 10, 0, 10];

    // ALERTMSGGRP
    // ===========
    const alertMsgGrp = alertPanel.add("group", undefined, { name: "alertMsgGrp" });
    alertMsgGrp.orientation = "column";
    alertMsgGrp.alignChildren = ["left", "center"];
    alertMsgGrp.spacing = 10;
    alertMsgGrp.margins = [10, 2, 0, 0];

    const alertMsgText = alertMsgGrp.add("group", undefined, { name: "alertMsgText" });
    alertMsgText.getText = function () { const t = []; for (const n = 0; n < alertMsgText.children.length; n++) { const text = alertMsgText.children[n].text || ''; if (text === '') text = ' '; t.push(text); } return t.join('\n'); };
    alertMsgText.orientation = "column";
    alertMsgText.alignChildren = ["left", "center"];
    alertMsgText.spacing = 0;

    const textField = alertMsgText.add(multiline ? "edittext" : "statictext", undefined, msg, { multiline: multiline, scrolling: multiline, readonly: true });

    textField.preferredSize = [480, multiline ? 200 : 50];

    // ALERTMSGBTNGRP
    // ==============
    const alertMsgBtnGrp = alertPanel.add("group", undefined, { name: "ok" });
    alertMsgBtnGrp.orientation = "row";
    alertMsgBtnGrp.alignChildren = ["left", "top"];
    alertMsgBtnGrp.spacing = 0;
    alertMsgBtnGrp.margins = [10, 10, 0, 0];

    const alertBtn = alertMsgBtnGrp.add("button", undefined, undefined, { name: "alertBtn" });
    alertBtn.text = "OK";
    alertBtn.active = true;
    alertBtn.preferredSize.width = 70;

    app.beep();

    alertDialogSA.show();


    return alertDialogSA;

};