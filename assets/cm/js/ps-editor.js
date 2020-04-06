//https://codemirror.net/doc/manual.html

var modesMenuEle = null;
var btnChangeMode = null;

var themesMenuEle = null;
var btnChangeTheme = null;

// Start : UI methods
function _toggleModesMenu(event) {
    _hideThemesMenu();
    if (modesMenuEle != null)
        modesMenuEle.classList.toggle("show");
}
function _hideModesMenu() {
    if (modesMenuEle != null)
        modesMenuEle.classList.remove("show");
}
function _renderModes(modeInfoList) {
    var menuItem = '';
    modesMenuEle = document.getElementById("modesMenu");
    if (modesMenuEle != null && modeInfoList != null && modeInfoList.length > 0) {
        modeInfoList.forEach((modeInfo) => {
            menuItem += `<div id='${modeInfo.name}' class="menu-item">${modeInfo.name}</div>`;
        });
        modesMenuEle.innerHTML = menuItem;
        _bindModeChangeEvent(modeInfoList);
    }
}
function _bindModeChangeEvent(modeInfoList) {
    modesMenuEle.onclick = function (event) {
        _hideModesMenu();
        var selectedModeEle = event.srcElement;
        var modeName = selectedModeEle.id;
        var modeInfo = modeInfoList.find(x => x.name == modeName);
        console.log(modeInfo);
        _setSelectedMode(modeInfo);
    }
}
function _setSelectedMode(modeInfo) {
    var defaultMode = { "name": "JavaScript", "mimes": ["text/javascript", "text/ecmascript", "application/javascript", "application/x-javascript", "application/ecmascript"], "mode": "javascript", "ext": ["js"], "alias": ["ecmascript", "js", "node"], "mime": "text/javascript" };
    modeInfo = modeInfo == null ? defaultMode : modeInfo;
    editor.setOption("mode", modeInfo.mime);
    CodeMirror.autoLoadMode(editor, modeInfo.mode);
    if (btnChangeMode != null)
        btnChangeMode.innerHTML = modeInfo.name;
}


function _toggleThemesMenu() {
    _hideModesMenu();
    if (themesMenuEle != null)
        themesMenuEle.classList.toggle("show");
}
function _hideThemesMenu() {
    if (themesMenuEle != null)
        themesMenuEle.classList.remove("show");
}
function _renderThemes() {
    var menuItem = '';
    themesMenuEle = document.getElementById("themesMenu");
    if (themesMenuEle != null && themeList != null && themeList.length > 0) {
        themeList.forEach((themeInfo) => {
            menuItem += `<div id='${themeInfo.themeName}' class="menu-item">${themeInfo.themeName}</div>`;
        });
        themesMenuEle.innerHTML = menuItem;
        _bindThemeChangeEvent(themeList);
    }
}
function _bindThemeChangeEvent(themeList) {
    themesMenuEle.onclick = function (event) {
        _hideThemesMenu();
        var selectedThemeEle = event.srcElement;
        var themeName = selectedThemeEle.id;
        var themeInfo = themeList.find(x => x.themeName == themeName);
        _setSelectedTheme(themeInfo);
    }
}
function _setSelectedTheme(themeInfo) {
    var defaultTheme = themeList[0];
    themeInfo = themeInfo == null ? defaultTheme : themeInfo;
    editor.setOption("theme", themeInfo.themeName);
    CodeMirror.autoLoadTheme(editor, themeInfo);
    if (btnChangeTheme != null)
        btnChangeTheme.innerHTML = themeInfo.themeName;
}

function _hideAllMenus() {
    _hideModesMenu();
    _hideThemesMenu();
}
// End : UI methods

// Start : Custom Methods used in editor options
function _lineNumberFormatter(line) {
    var n = line + '';
    var width = 4;
    var z = '0';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

//Pass this params with options configs > sequenceNumberConfig
function _applySequenceNumberPadding(seqNum, width, replaceZeroWith = '0') {
    seqNum = seqNum + '';
    return seqNum.length >= width ? seqNum : new Array(width - seqNum.length + 1).join(replaceZeroWith) + seqNum;
}

function _executeToolbarCommand(editor, commandName, params) {
    if (commandName == 'bold' || commandName == 'italic')
        document.execCommand(commandName);
    else
        editor.execCommand(commandName);
}

// function _onEditorInit(editor) {
//     console.log("_onEditorInit called", editor);
// }

var defaultOptions = {
    // theme: "bespin",//Refer: pstheme.css
    // inputStyle: "contenteditable",
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    lineWrapping: true,
    firstLineNumber: 0,
    // readOnly: true,
    // readOnly: 'nocursor',
    autofocus: true,
    dragDrop: false,
    allowDropFileTypes: [],
    cursorHeight: 1,//1
    cursorBlinkRate: 250,//530ms
    lineNumberFormatter: _lineNumberFormatter,
    sequenceNumberConfig: {
        applyPadding: false,
        width: 4,
    },
    indentUnit: 2,
    tabSize: 4,
    tabMode: 'indent',
    // gutters: ["line-status-bar", "CodeMirror-linenumbers"],
    gutters: ["CodeMirror-linenumbers"],
    name: "text/html",
    mode: "javascript",
    theme: "pstheme"
}

// End : Custom Methods used in editor options

// eval(document.getElementById("code").value);
//editor must be stored in global object
var editor = CodeMirror.fromTextArea(document.getElementById("code"), defaultOptions);

CodeMirror.modeURL = "./js/modes/%N/%N.js";
// CodeMirror.themeURL = "./themes/%N.css";

console.log(editor);
editor.on("refresh", function (editor) {
    // var toolbarButtons = document.querySelectorAll("button");
    // console.log(editor.commands);
    // toolbarButtons.forEach((button) => {
    //     button.onclick = function (clickEvent) {
    //         var commandName = this.name;
    //         _executeToolbarCommand(editor, commandName);
    //     }
    // });
    // var ddlModes = document.getElementById("ddl-modes");
    // ddlModes.appendChild("dasf");
    btnChangeMode = document.getElementById("btnChangeMode");
    btnChangeMode.onclick = _toggleModesMenu;
    _renderModes(CodeMirror.modeInfo);
    _setSelectedMode();

    btnChangeTheme = document.getElementById("btnChangeTheme");
    btnChangeTheme.onclick = _toggleThemesMenu;
    _renderThemes();
    _setSelectedTheme();

    var btnSave = document.getElementById("btnSave");
    btnSave.onclick = function (event) {
        // console.log('Save clicked', editor);
        var codeSnippet = editor.getValue();
        console.log('Code Snippet : ', codeSnippet);
    };

});

// editor.on("gutterClick", function (editor, lineNumber) {
//     var lineInfo = editor.lineInfo(lineNumber);
//     // editor.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
//     editor.setGutterMarker(lineNumber, "line-status-bar", lineInfo.gutterMarkers ? null : setStatus(lineInfo));
// });
editor.on("gutterContextMenu", function (editor, lineNumber, gutter, contextMenu) {
    // console.log(editor, lineNumber, gutter, contextMenu);
    var lineInfo = editor.lineInfo(lineNumber);
});

editor.on("change", function (editor, changedLine) {
    // console.log(changedLine);
});

editor.on("changes", function (editor, changedLines) {
    // console.log(changedLines);
});
editor.on("beforeChange", function (editor, changedLine) {
    // console.log(changedLine);
    //Call this method to avoid the change
    // changedLine.cancel();
});

editor.on("focus", function (editor, focusEvent) {
    // console.log("focus");
    _hideAllMenus();
});
editor.on("blur", function (editor, blurEvent) {
    // console.log("blur");
});
editor.on("scroll", function (editor) {
    // console.log("blur");
});
editor.on("optionChange", function (editor, optionString) {
    console.log("optionString", optionString);
});
// editor.on("delete", function (editor, deletedLine) {
//     console.log(editor, deletedLine);
// });
// editor.on("beforeCursorEnter", function (editor, deletedLine) {
//     console.log(editor, deletedLine);
// });
// editor.setOption("extraKeys", {
//     Tab: function (cm) {
//         console.log("Tab");
//         var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
//         cm.replaceSelection(spaces);
//     }
// });

editor.refresh();

// function setStatus(lineInfo) {
//     var marker = document.createElement("div");
//     marker.classList = "line-status";
//     marker.innerHTML = "M*";
//     return marker;
// }