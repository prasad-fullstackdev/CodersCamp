CodeMirror.defineExtension("commentOrUnCommentRange", function (from, to) {
    var cm = this, curMode = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(from).state).mode;
    cm.operation(function () {
        var isComment = true;
        var selText = cm.getRange(from, to);
        var startIndex = selText.indexOf(curMode.commentStart);
        var endIndex = selText.lastIndexOf(curMode.commentEnd);
        if (startIndex > -1 && endIndex > -1 && endIndex > startIndex)
            isComment = false;

        if (isComment) {
            // Comment range
            cm.replaceRange(curMode.commentEnd, to);
            cm.replaceRange(curMode.commentStart, from);
            if (from.line == to.line && from.ch == to.ch) {
                // An empty comment inserted - put cursor inside
                cm.setCursor(from.line, from.ch + curMode.commentStart.length);
            }
            else {
                //Set Selection after comment
                var end = { line: to.line, ch: to.ch + 7 };
                cm.setSelection(from, end);
            }
        } else {
            // Uncomment range
            if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
                // Take string till comment start
                selText = selText.substr(0, startIndex)
                    // From comment start till comment end
                    + selText.substring(startIndex + curMode.commentStart.length, endIndex)
                    // From comment end till string end
                    + selText.substr(endIndex + curMode.commentEnd.length);
            }
            cm.replaceRange(selText, from, to);
            //Set Selection after uncomment
            cm.setSelection(from, to);
        }
    });
});


// Start: Auto Format Selection
function _getSelectedRange(editor) {
    return { from: editor.getCursor(true), to: editor.getCursor(false) };
}
function _autoFormatSelection(editor) {
    editor.execCommand("selectAll");
    var range = _getSelectedRange(editor);
    editor.autoFormatRange(range.from, range.to);
}
// function _commentSelection() {
//     var isComment = true;
//     var range = _getSelectedRange();
//     editor.commentRange(isComment, range.from, range.to);
// }
function _commentOrUnCommentRange(editor) {
    var range = _getSelectedRange(editor);
    editor.commentOrUnCommentRange(range.from, range.to);
}
// CodeMirror.commands.autoFormatSelection = _autoFormatSelection;
// CodeMirror.commands.commentSelection = _commentSelection;
CodeMirror.commands.commentOrUnCommentRange = _commentOrUnCommentRange;

//For Multiple Cursors below code
// var a1 = {line: 0, ch: 2 };
// var a2 = {line: 3, ch: 5 };
// var b1 = {line: 5, ch: 0 };
// var b2 = {line: 7, ch: 0 };
// var c = [{ 'anchor': a1, 'head': a2},{ 'anchor': b1, 'head': b2} ];
// editor.setSelections(c);
// End: Auto Format Selection