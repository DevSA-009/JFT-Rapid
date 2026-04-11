/**
 * Shows a custom Alert Dialog in Adobe Illustrator using ScriptUI.
 *
 * @param {string} msg - The message to display.
 * @param {boolean} [multiline=false] - Whether the message should be multiline (uses edittext with scrolling).
 * @param {number} [widthScale=1] - Scale factor for the dialog width.
 *                                  `1` = default (500px), `0` = use current size without scaling.
 * @param {number} [heightScale=1] - Scale factor for the message area height.
 *                                   `1` = default, `0` = use current size without scaling.
 * @returns {Window} The dialog window object.
 */
const alertDialogSA = (
  msg,
  multiline = false,
  widthScale = 1,
  heightScale = 1,
) => {
  // ALERTDIALOGSA
  const alertDialogSA = new Window("dialog", undefined, undefined, {
    closeButton: false,
  });
  alertDialogSA.text = "Alert Dialog";
  alertDialogSA.orientation = "column";
  alertDialogSA.alignChildren = ["center", "center"];
  alertDialogSA.spacing = 10;
  alertDialogSA.margins = 10;

  // ALERTPANEL
  const alertPanel = alertDialogSA.add("panel", undefined, undefined);
  alertPanel.text = "Message";
  alertPanel.orientation = "column";
  alertPanel.alignChildren = ["left", "top"];
  alertPanel.spacing = 10;
  alertPanel.margins = [0, 10, 0, 10];

  // Calculate scaled width
  const baseWidth = 500;
  const finalWidth =
    widthScale === 0 ? baseWidth : Math.round(baseWidth * widthScale);
  alertPanel.preferredSize.width = finalWidth;

  // ALERTMSGGRP
  const alertMsgGrp = alertPanel.add("group", undefined, {
    name: "alertMsgGrp",
  });
  alertMsgGrp.orientation = "column";
  alertMsgGrp.alignChildren = ["left", "center"];
  alertMsgGrp.spacing = 10;
  alertMsgGrp.margins = [10, 2, 0, 0];

  const alertMsgText = alertMsgGrp.add("group", undefined);
  alertMsgText.getText = function () {
    const t = [];
    for (let n = 0; n < alertMsgText.children.length; n++) {
      let text = alertMsgText.children[n].text || "";
      if (text === "") text = " ";
      t.push(text);
    }
    return t.join("\n");
  };
  alertMsgText.orientation = "column";
  alertMsgText.alignChildren = ["left", "center"];
  alertMsgText.spacing = 0;

  // Calculate scaled height for the text field
  const baseTextHeight = multiline ? 200 : 50;
  const finalTextHeight =
    heightScale === 0
      ? baseTextHeight
      : Math.round(baseTextHeight * heightScale);

  const textField = alertMsgText.add(
    multiline ? "edittext" : "statictext",
    undefined,
    msg,
    { multiline: multiline, scrolling: multiline, readonly: true },
  );

  textField.preferredSize = [finalWidth - 20, finalTextHeight]; // 20px margin adjustment

  // ALERTMSGBTNGRP
  const alertMsgBtnGrp = alertPanel.add("group", undefined, { name: "ok" });
  alertMsgBtnGrp.orientation = "row";
  alertMsgBtnGrp.alignChildren = ["left", "top"];
  alertMsgBtnGrp.spacing = 0;
  alertMsgBtnGrp.margins = [10, 10, 0, 0];

  const alertBtn = alertMsgBtnGrp.add("button", undefined, undefined, {
    name: "ok",
  });
  alertBtn.text = "OK";
  alertBtn.active = true;
  alertBtn.preferredSize.width = 70;

  alertBtn.onClick = () => {
    alertDialogSA.close();
  };

  app.beep();

  const result = alertDialogSA.show();

  if (result === 1) {
    $.gc();
  }

  return alertDialogSA;
};
