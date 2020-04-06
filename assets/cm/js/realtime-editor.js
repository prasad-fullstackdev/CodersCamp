// var delay;
// // Initialize CodeMirror editor with a nice html5 canvas demo.
// var editor = CodeMirror.fromTextArea(document.getElementById('code'), {
//     mode: 'text/html',
//     // mode: { name: "javascript" },
//     lineNumbers: true,
//     matchBrackets: true,
//     lineWrapping: true,
//     autoCloseTags: true,
//     autoCloseBrackets: true,
//     styleSelectedText: true,
//     extraKeys: {
//         "Ctrl-Space": "autocomplete",
//         "Shift-Alt-F": "autoFormatSelection",
//         "Ctrl-/": "commentOrUnCommentRange",
//         "F11": function (cm) {
//             cm.setOption("fullScreen", !cm.getOption("fullScreen"));
//         },
//         "Esc": function (cm) {
//             if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
//         }
//     },
//     foldGutter: true,
//     gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
//     showCursorWhenSelecting: true,
//     keyMap: "sublime",
//     theme: "monokai",
//     tabSize: 2
// });
// editor.on("change", function () {
//     clearTimeout(delay);
//     delay = setTimeout(updatePreview, 300);
// });

// editor.on("refresh", function (editor) {
//     _autoComplete();
// });

// CodeMirror.commands.autocomplete = function (cm) {
//     // cm.showHint({ hint: CodeMirror.hint.anyword });
//     cm.showHint({ hint: synonyms(cm, null) });
// }

// function updatePreview() {
//     var previewFrame = document.getElementById('preview');
//     var preview = previewFrame.contentDocument || previewFrame.contentWindow.document;
//     preview.open();
//     preview.write(editor.getValue());
//     preview.close();
// }
// setTimeout(updatePreview, 300);

// var comp = [];
// function _autoComplete() {
//     if (typeof Promise !== "undefined") {
//         comp = [
//             ["here", "hither"],
//             ["asynchronous", "nonsynchronous"],
//             ["completion", "achievement", "conclusion", "culmination", "expirations"],
//             ["hinting", "advive", "broach", "imply"],
//             ["function", "action"],
//             ["provide", "add", "bring", "give"],
//             ["synonyms", "equivalents"],
//             ["words", "token"],
//             ["each", "every"],
//         ];

//         // var editor2 = CodeMirror.fromTextArea(document.getElementById("synonyms"), {
//         //     extraKeys: { "Ctrl-Space": "autocomplete" },
//         //     lineNumbers: true,
//         //     lineWrapping: true,
//         //     mode: "text/x-markdown",
//         //     hintOptions: { hint: synonyms }
//         // });
//     }
// }

function synonyms(cm, option) {
    return new Promise(function (accept) {
        setTimeout(function () {
            var cursor = cm.getCursor(), line = cm.getLine(cursor.line)
            var start = cursor.ch, end = cursor.ch
            while (start && /\w/.test(line.charAt(start - 1)))--start
            while (end < line.length && /\w/.test(line.charAt(end)))++end
            var word = line.slice(start, end).toLowerCase()
            for (var i = 0; i < comp.length; i++) if (comp[i].indexOf(word) != -1)
                return accept({
                    list: comp[i],
                    from: CodeMirror.Pos(cursor.line, start),
                    to: CodeMirror.Pos(cursor.line, end)
                })
            return accept(null)
        }, 100)
    })
}

// editor.refresh();