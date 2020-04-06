function _getSelectedRange(editor) {
    return { from: editor.getCursor(true), to: editor.getCursor(false) };
}
function _autoFormatSelection(editor) {
    editor.execCommand("selectAll");
    var range = _getSelectedRange(editor);
    editor.autoFormatRange(range.from, range.to);
}
CodeMirror.commands.autoFormatSelection = _autoFormatSelection;