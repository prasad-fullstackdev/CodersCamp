!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.emmetCodeMirror=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * Emmet Editor interface implementation for CodeMirror.
 * Interface is optimized for multiple cursor usage: authors
 * should run acttion multiple times and update `selectionIndex`
 * property on each iteration.
 */

var emmet = _interopRequire(require("./emmet"));

var modeMap = {
	"text/html": "html",
	"application/xml": "xml",
	"text/xsl": "xsl",
	"text/css": "css",
	"text/x-less": "less",
	"text/x-scss": "scss",
	"text/x-sass": "sass"
};

exports.modeMap = modeMap;

var EmmetEditor = (function () {
	function EmmetEditor(ctx) {
		var selIndex = arguments[1] === undefined ? 0 : arguments[1];

		_classCallCheck(this, EmmetEditor);

		this.context = ctx;
		this.selectionIndex = selIndex || 0;
	}

	_createClass(EmmetEditor, {
		selectionList: {

			/**
    * Returns list of selections for current CodeMirror instance. 
    * @return {Array}
    */

			value: function selectionList() {
				var cm = this.context;
				return cm.listSelections().map(function (sel) {
					var anchor = posToIndex(cm, sel.anchor);
					var head = posToIndex(cm, sel.head);

					return {
						start: Math.min(anchor, head),
						end: Math.max(anchor, head)
					};
				});
			}
		},
		getCaretPos: {
			value: function getCaretPos() {
				return this.getSelectionRange().start;
			}
		},
		setCaretPos: {
			value: function setCaretPos(pos) {
				this.createSelection(pos);
			}
		},
		getSelectionRange: {

			/**
    * Returns current selection range (for current selection index)
    * @return {Object}
    */

			value: function getSelectionRange() {
				return this.selectionList()[this.selectionIndex];
			}
		},
		createSelection: {
			value: function createSelection(start, end) {
				if (typeof end == "undefined") {
					end = start;
				}

				var sels = this.selectionList();
				var cm = this.context;
				sels[this.selectionIndex] = { start: start, end: end };
				this.context.setSelections(sels.map(function (sel) {
					return {
						head: indexToPos(cm, sel.start),
						anchor: indexToPos(cm, sel.end)
					};
				}));
			}
		},
		getSelection: {

			/**
    * Returns current selection
    * @return {String}
    */

			value: function getSelection() {
				var sel = this.getSelectionRange();
				sel.start = indexToPos(this.context, sel.start);
				sel.end = indexToPos(this.context, sel.end);
				return this.context.getRange(sel.start, sel.end);
			}
		},
		getCurrentLineRange: {
			value: function getCurrentLineRange() {
				var caret = indexToPos(this.context, this.getCaretPos());
				return {
					start: posToIndex(this.context, caret.line, 0),
					end: posToIndex(this.context, caret.line, this.context.getLine(caret.line).length)
				};
			}
		},
		getCurrentLine: {
			value: function getCurrentLine() {
				var caret = indexToPos(this.context, this.getCaretPos());
				return this.context.getLine(caret.line) || "";
			}
		},
		replaceContent: {
			value: function replaceContent(value, start, end, noIndent) {
				if (typeof end == "undefined") {
					end = typeof start == "undefined" ? this.getContent().length : start;
				}
				if (typeof start == "undefined") {
					start = 0;
				}

				// normalize indentation according to editor preferences
				value = this.normalize(value);

				// indent new value
				if (!noIndent) {
					value = emmet.utils.common.padString(value, emmet.utils.common.getLinePaddingFromPosition(this.getContent(), start));
				}

				// find new caret position
				var tabstopData = emmet.tabStops.extract(value, { escape: function (ch) {
						return ch;
					} });
				value = tabstopData.text;

				var firstTabStop = tabstopData.tabstops[0] || { start: value.length, end: value.length };
				firstTabStop.start += start;
				firstTabStop.end += start;

				this.context.replaceRange(value, indexToPos(this.context, start), indexToPos(this.context, end));
				this.createSelection(firstTabStop.start, firstTabStop.end);
			}
		},
		normalize: {

			/**
    * Normalizes string indentation in given string
    * according to editor preferences
    * @param  {String} str
    * @return {String}
    */

			value: function normalize(str) {
				var indent = "\t";
				var ctx = this.context;
				if (!ctx.getOption("indentWithTabs")) {
					indent = emmet.utils.common.repeatString(" ", ctx.getOption("indentUnit"));
				}

				return emmet.utils.editor.normalize(str, {
					indentation: indent
				});
			}
		},
		getContent: {
			value: function getContent() {
				return this.context.getValue();
			}
		},
		getSyntax: {
			value: function getSyntax() {
				var editor = this.context;
				var pos = editor.posFromIndex(this.getCaretPos());
				var mode = editor.getModeAt(editor.getCursor());
				var syntax = mode.name;
				if (syntax === "xml" && mode.configuration) {
					syntax = mode.configuration;
				}

				return syntax || emmet.utils.action.detectSyntax(this, syntax);
			}
		},
		getProfileName: {

			/**
    * Returns current output profile name (@see emmet#setupProfile)
    * @return {String}
    */

			value: function getProfileName() {
				if (this.context.getOption("profile")) {
					return this.context.getOption("profile");
				}

				return emmet.utils.action.detectProfile(this);
			}
		},
		prompt: {

			/**
    * Ask user to enter something
    * @param {String} title Dialog title
    * @return {String} Entered data
    */

			value: (function (_prompt) {
				var _promptWrapper = function prompt(_x) {
					return _prompt.apply(this, arguments);
				};

				_promptWrapper.toString = function () {
					return _prompt.toString();
				};

				return _promptWrapper;
			})(function (title) {
				return prompt(title);
			})
		},
		getFilePath: {

			/**
    * Returns current editor's file path
    * @return {String}
    */

			value: function getFilePath() {
				return location.href;
			}
		},
		isValidSyntax: {

			/**
    * Check if current editor syntax is valid, e.g. is supported by Emmet
    * @return {Boolean}
    */

			value: function isValidSyntax() {
				return emmet.resources.hasSyntax(this.getSyntax());
			}
		}
	});

	return EmmetEditor;
})();

exports["default"] = EmmetEditor;

/**
 * Converts CM’s inner representation of character
 * position (line, ch) to character index in text
 * @param  {CodeMirror} cm  CodeMirror instance
 * @param  {Object}     pos Position object
 * @return {Number}
 */
function posToIndex(cm, pos) {
	if (arguments.length > 2 && typeof pos !== "object") {
		pos = { line: arguments[1], ch: arguments[2] };
	}
	return cm.indexFromPos(pos);
}

/**
 * Converts charater index in text to CM’s internal object representation
 * @param  {CodeMirror} cm CodeMirror instance
 * @param  {Number}     ix Character index in CM document
 * @return {Object}
 */
function indexToPos(cm, ix) {
	return cm.posFromIndex(ix);
}
},{"./emmet":2}],2:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var emmet = _interopRequire(require("emmet"));

require("emmet/bundles/snippets");

require("emmet/bundles/caniuse");

module.exports = emmet;
},{"emmet":39,"emmet/bundles/caniuse":4,"emmet/bundles/snippets":5}],3:[function(require,module,exports){
},{}],4:[function(require,module,exports){
/**
 * Bundler, used in builder script to statically
 * include optimized caniuse.json into bundle
 */
var db = require('caniuse-db/data.json');
var ciu = require('../lib/assets/caniuse');
ciu.load(db, true);

},{"../lib/assets/caniuse":24,"caniuse-db/data.json":3}],5:[function(require,module,exports){
/**
 * Bundler, used in builder script to statically
 * include snippets.json into bundle
 */
var res = require('../lib/assets/resources');
var snippets = require('../lib/snippets.json');
res.setVocabulary(snippets, 'system');

},{"../lib/assets/resources":32,"../lib/snippets.json":68}],6:[function(require,module,exports){
/**
 * HTML pair matching (balancing) actions
 * @constructor
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var htmlMatcher = require('../assets/htmlMatcher');
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var range = require('../assets/range');
	var cssEditTree = require('../editTree/css');
	var cssSections = require('../utils/cssSections');
	var lastMatch = null;

	function last(arr) {
		return arr[arr.length - 1];
	}

	function balanceHTML(editor, direction) {
		var info = editorUtils.outputInfo(editor);
		var content = info.content;
		var sel = range(editor.getSelectionRange());
		
		// validate previous match
		if (lastMatch && !lastMatch.range.equal(sel)) {
			lastMatch = null;
		}
		
		if (lastMatch && sel.length()) {
			if (direction == 'in') {
				// user has previously selected tag and wants to move inward
				if (lastMatch.type == 'tag' && !lastMatch.close) {
					// unary tag was selected, can't move inward
					return false;
				} else {
					if (lastMatch.range.equal(lastMatch.outerRange)) {
						lastMatch.range = lastMatch.innerRange;
					} else {
						var narrowed = utils.narrowToNonSpace(content, lastMatch.innerRange);
						lastMatch = htmlMatcher.find(content, narrowed.start + 1);
						if (lastMatch && lastMatch.range.equal(sel) && lastMatch.outerRange.equal(sel)) {
							lastMatch.range = lastMatch.innerRange;
						}
					}
				}
			} else {
				if (
					!lastMatch.innerRange.equal(lastMatch.outerRange) 
					&& lastMatch.range.equal(lastMatch.innerRange) 
					&& sel.equal(lastMatch.range)) {
					lastMatch.range = lastMatch.outerRange;
				} else {
					lastMatch = htmlMatcher.find(content, sel.start);
					if (lastMatch && lastMatch.range.equal(sel) && lastMatch.innerRange.equal(sel)) {
						lastMatch.range = lastMatch.outerRange;
					}
				}
			}
		} else {
			lastMatch = htmlMatcher.find(content, sel.start);
		}

		if (lastMatch) {
			if (lastMatch.innerRange.equal(sel)) {
				lastMatch.range = lastMatch.outerRange;
			}

			if (!lastMatch.range.equal(sel)) {
				editor.createSelection(lastMatch.range.start, lastMatch.range.end);
				return true;
			}
		}
		
		lastMatch = null;
		return false;
	}

	function rangesForCSSRule(rule, pos) {
		// find all possible ranges
		var ranges = [rule.range(true)];

		// braces content
		ranges.push(rule.valueRange(true));

		// find nested sections
		var nestedSections = cssSections.nestedSectionsInRule(rule);

		// real content, e.g. from first property name to
		// last property value
		var items = rule.list();
		if (items.length || nestedSections.length) {
			var start = Number.POSITIVE_INFINITY, end = -1;
			if (items.length) {
				start = items[0].namePosition(true);
				end = last(items).range(true).end;
			}

			if (nestedSections.length) {
				if (nestedSections[0].start < start) {
					start = nestedSections[0].start;
				}

				if (last(nestedSections).end > end) {
					end = last(nestedSections).end;
				}
			}

			ranges.push(range.create2(start, end));
		}

		ranges = ranges.concat(nestedSections);

		var prop = cssEditTree.propertyFromPosition(rule, pos) || items[0];
		if (prop) {
			ranges.push(prop.range(true));
			var valueRange = prop.valueRange(true);
			if (!prop.end()) {
				valueRange._unterminated = true;
			}
			ranges.push(valueRange);
		}

		return ranges;
	}

	/**
	 * Returns all possible selection ranges for given caret position
	 * @param  {String} content CSS content
	 * @param  {Number} pos     Caret position(where to start searching)
	 * @return {Array}
	 */
	function getCSSRanges(content, pos) {
		var rule;
		if (typeof content === 'string') {
			var ruleRange = cssSections.matchEnclosingRule(content, pos);
			if (ruleRange) {
				rule = cssEditTree.parse(ruleRange.substring(content), {
					offset: ruleRange.start
				});
			}
		} else {
			// passed parsed CSS rule
			rule = content;
		}

		if (!rule) {
			return null;
		}

		// find all possible ranges
		var ranges = rangesForCSSRule(rule, pos);

		// remove empty ranges
		ranges = ranges.filter(function(item) {
			return !!item.length;
		});

		return utils.unique(ranges, function(item) {
			return item.valueOf();
		});
	}

	function balanceCSS(editor, direction) {
		var info = editorUtils.outputInfo(editor);
		var content = info.content;
		var sel = range(editor.getSelectionRange());

		var ranges = getCSSRanges(info.content, sel.start);
		if (!ranges && sel.length()) {
			// possible reason: user has already selected
			// CSS rule from last match
			try {
				var rule = cssEditTree.parse(sel.substring(info.content), {
					offset: sel.start
				});
				ranges = getCSSRanges(rule, sel.start);
			} catch(e) {}
		}

		if (!ranges) {
			return false;
		}

		ranges = range.sort(ranges, true);

		// edge case: find match that equals current selection,
		// in case if user moves inward after selecting full CSS rule
		var bestMatch = utils.find(ranges, function(r) {
			return r.equal(sel);
		});

		if (!bestMatch) {
			bestMatch = utils.find(ranges, function(r) {
				// Check for edge case: caret right after CSS value
				// but it doesn‘t contains terminating semicolon.
				// In this case we have to check full value range
				return r._unterminated ? r.include(sel.start) : r.inside(sel.start);
			});
		}

		if (!bestMatch) {
			return false;
		}

		// if best match equals to current selection, move index
		// one position up or down, depending on direction
		var bestMatchIx = ranges.indexOf(bestMatch);
		if (bestMatch.equal(sel)) {
			bestMatchIx += direction == 'out' ? 1 : -1;
		}

		if (bestMatchIx < 0 || bestMatchIx >= ranges.length) {
			if (bestMatchIx >= ranges.length && direction == 'out') {
				pos = bestMatch.start - 1;

				var outerRanges = getCSSRanges(content, pos);
				if (outerRanges) {
					bestMatch = last(outerRanges.filter(function(r) {
						return r.inside(pos);
					}));
				}
			} else if (bestMatchIx < 0 && direction == 'in') {
				bestMatch = null;
			} else {
				bestMatch = null;
			}
		} else {
			bestMatch = ranges[bestMatchIx];	
		}

		if (bestMatch) {
			editor.createSelection(bestMatch.start, bestMatch.end);
			return true;
		}
		
		return false;
	}
	
	return {
		/**
		 * Find and select HTML tag pair
		 * @param {IEmmetEditor} editor Editor instance
		 * @param {String} direction Direction of pair matching: 'in' or 'out'. 
		 * Default is 'out'
		 */
		balance: function(editor, direction) {
			direction = String((direction || 'out').toLowerCase());
			var info = editorUtils.outputInfo(editor);
			if (actionUtils.isSupportedCSS(info.syntax)) {
				return balanceCSS(editor, direction);
			}
			
			return balanceHTML(editor, direction);
		},

		balanceInwardAction: function(editor) {
			return this.balance(editor, 'in');
		},

		balanceOutwardAction: function(editor) {
			return this.balance(editor, 'out');	
		},

		/**
		 * Moves caret to matching opening or closing tag
		 * @param {IEmmetEditor} editor
		 */
		goToMatchingPairAction: function(editor) {
			var content = String(editor.getContent());
			var caretPos = editor.getCaretPos();
			
			if (content.charAt(caretPos) == '<') 
				// looks like caret is outside of tag pair  
				caretPos++;
				
			var tag = htmlMatcher.tag(content, caretPos);
			if (tag && tag.close) { // exclude unary tags
				if (tag.open.range.inside(caretPos)) {
					editor.setCaretPos(tag.close.range.start);
				} else {
					editor.setCaretPos(tag.open.range.start);
				}
				
				return true;
			}
			
			return false;
		}
	};
});
},{"../assets/htmlMatcher":27,"../assets/range":31,"../editTree/css":37,"../utils/action":70,"../utils/common":73,"../utils/cssSections":74,"../utils/editor":75}],7:[function(require,module,exports){
/**
 * Encodes/decodes image under cursor to/from base64
 * @param {IEmmetEditor} editor
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var file = require('../plugin/file');
	var base64 = require('../utils/base64');
	var actionUtils = require('../utils/action');
	var editorUtils = require('../utils/editor');

	/**
	 * Test if <code>text</code> starts with <code>token</code> at <code>pos</code>
	 * position. If <code>pos</code> is omitted, search from beginning of text 
	 * @param {String} token Token to test
	 * @param {String} text Where to search
	 * @param {Number} pos Position where to start search
	 * @return {Boolean}
	 * @since 0.65
	 */
	function startsWith(token, text, pos) {
		pos = pos || 0;
		return text.charAt(pos) == token.charAt(0) && text.substr(pos, token.length) == token;
	}

	/**
	 * Encodes image to base64
	 * 
	 * @param {IEmmetEditor} editor
	 * @param {String} imgPath Path to image
	 * @param {Number} pos Caret position where image is located in the editor
	 * @return {Boolean}
	 */
	function encodeToBase64(editor, imgPath, pos) {
		var editorFile = editor.getFilePath();
		var defaultMimeType = 'application/octet-stream';

		if (editorFile === null) {
			throw "You should save your file before using this action";
		}

		// locate real image path
		file.locateFile(editorFile, imgPath, function(realImgPath) {
			if (realImgPath === null) {
				throw "Can't find " + imgPath + ' file';
			}

			file.read(realImgPath, function(err, content) {
				if (err) {
					throw 'Unable to read ' + realImgPath + ': ' + err;
				}

				var b64 = base64.encode(String(content));
				if (!b64) {
					throw "Can't encode file content to base64";
				}

				b64 = 'data:' + (actionUtils.mimeTypes[String(file.getExt(realImgPath))] || defaultMimeType) +
					';base64,' + b64;

				editor.replaceContent('$0' + b64, pos, pos + imgPath.length);
			});
		});

		return true;
	}

	/**
	 * Decodes base64 string back to file.
	 * @param {IEmmetEditor} editor
	 * @param {String} filePath to new image
	 * @param {String} data Base64-encoded file content
	 * @param {Number} pos Caret position where image is located in the editor
	 */
	function decodeFromBase64(editor, filePath, data, pos) {
		// ask user to enter path to file
		filePath = filePath || String(editor.prompt('Enter path to file (absolute or relative)'));
		if (!filePath) {
			return false;
		}

		var editorFile = editor.getFilePath();
		file.createPath(editorFile, filePath, function(err, absPath) {
			if (err || !absPath) {
				throw "Can't save file";
			}

			var content = data.replace(/^data\:.+?;.+?,/, '');
			file.save(absPath, base64.decode(content), function(err) {
				if (err) {
					throw 'Unable to save ' + absPath + ': ' + err;
				}

				editor.replaceContent('$0' + filePath, pos, pos + data.length);
			});
		});

		return true;
	}

	return {
		/**
		 * Action to encode or decode file to data:url
		 * @param  {IEmmetEditor} editor  Editor instance
		 * @param  {String} syntax  Current document syntax
		 * @param  {String} profile Output profile name
		 * @return {Boolean}
		 */
		encodeDecodeDataUrlAction: function(editor, filepath) {
			var data = String(editor.getSelection());
			var caretPos = editor.getCaretPos();
			var info = editorUtils.outputInfo(editor);

			if (!data) {
				// no selection, try to find image bounds from current caret position
				var text = info.content, m;
				while (caretPos-- >= 0) {
					if (startsWith('src=', text, caretPos)) { // found <img src="">
						if ((m = text.substr(caretPos).match(/^(src=(["'])?)([^'"<>\s]+)\1?/))) {
							data = m[3];
							caretPos += m[1].length;
						}
						break;
					} else if (startsWith('url(', text, caretPos)) { // found CSS url() pattern
						if ((m = text.substr(caretPos).match(/^(url\((['"])?)([^'"\)\s]+)\1?/))) {
							data = m[3];
							caretPos += m[1].length;
						}
						break;
					}
				}
			}

			if (data) {
				if (startsWith('data:', data)) {
					return decodeFromBase64(editor, filepath, data, caretPos);
				} else {
					return encodeToBase64(editor, data, caretPos);
				}
			}

			return false;
		}
	};
});

},{"../plugin/file":63,"../utils/action":70,"../utils/base64":71,"../utils/editor":75}],8:[function(require,module,exports){
/**
 * Move between next/prev edit points. 'Edit points' are places between tags 
 * and quotes of empty attributes in html
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	/**
	 * Search for new caret insertion point
	 * @param {IEmmetEditor} editor Editor instance
	 * @param {Number} inc Search increment: -1 — search left, 1 — search right
	 * @param {Number} offset Initial offset relative to current caret position
	 * @return {Number} Returns -1 if insertion point wasn't found
	 */
	function findNewEditPoint(editor, inc, offset) {
		inc = inc || 1;
		offset = offset || 0;
		
		var curPoint = editor.getCaretPos() + offset;
		var content = String(editor.getContent());
		var maxLen = content.length;
		var nextPoint = -1;
		var reEmptyLine = /^\s+$/;
		
		function getLine(ix) {
			var start = ix;
			while (start >= 0) {
				var c = content.charAt(start);
				if (c == '\n' || c == '\r')
					break;
				start--;
			}
			
			return content.substring(start, ix);
		}
			
		while (curPoint <= maxLen && curPoint >= 0) {
			curPoint += inc;
			var curChar = content.charAt(curPoint);
			var nextChar = content.charAt(curPoint + 1);
			var prevChar = content.charAt(curPoint - 1);
				
			switch (curChar) {
				case '"':
				case '\'':
					if (nextChar == curChar && prevChar == '=') {
						// empty attribute
						nextPoint = curPoint + 1;
					}
					break;
				case '>':
					if (nextChar == '<') {
						// between tags
						nextPoint = curPoint + 1;
					}
					break;
				case '\n':
				case '\r':
					// empty line
					if (reEmptyLine.test(getLine(curPoint - 1))) {
						nextPoint = curPoint;
					}
					break;
			}
			
			if (nextPoint != -1)
				break;
		}
		
		return nextPoint;
	}
	
	return {
		/**
		 * Move to previous edit point
		 * @param  {IEmmetEditor} editor  Editor instance
		 * @param  {String} syntax  Current document syntax
		 * @param  {String} profile Output profile name
		 * @return {Boolean}
		 */
		previousEditPointAction: function(editor, syntax, profile) {
			var curPos = editor.getCaretPos();
			var newPoint = findNewEditPoint(editor, -1);
				
			if (newPoint == curPos)
				// we're still in the same point, try searching from the other place
				newPoint = findNewEditPoint(editor, -1, -2);
			
			if (newPoint != -1) {
				editor.setCaretPos(newPoint);
				return true;
			}
			
			return false;
		},

		/**
		 * Move to next edit point
		 * @param  {IEmmetEditor} editor  Editor instance
		 * @param  {String} syntax  Current document syntax
		 * @param  {String} profile Output profile name
		 * @return {Boolean}
		 */
		nextEditPointAction: function(editor, syntax, profile) {
			var newPoint = findNewEditPoint(editor, 1);
			if (newPoint != -1) {
				editor.setCaretPos(newPoint);
				return true;
			}
			
			return false;
		}
	};
});
},{}],9:[function(require,module,exports){
/**
 * Evaluates simple math expression under caret
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var actionUtils = require('../utils/action');
	var utils = require('../utils/common');
	var math = require('../utils/math');
	var range = require('../assets/range');

	return {
		/**
		 * Evaluates math expression under the caret
		 * @param  {IEmmetEditor} editor
		 * @return {Boolean}
		 */
		evaluateMathAction: function(editor) {
			var content = editor.getContent();
			var chars = '.+-*/\\';
			
			/** @type Range */
			var sel = range(editor.getSelectionRange());
			if (!sel.length()) {
				sel = actionUtils.findExpressionBounds(editor, function(ch) {
					return utils.isNumeric(ch) || chars.indexOf(ch) != -1;
				});
			}
			
			if (sel && sel.length()) {
				var expr = sel.substring(content);
				
				// replace integral division: 11\2 => Math.round(11/2) 
				expr = expr.replace(/([\d\.\-]+)\\([\d\.\-]+)/g, 'round($1/$2)');
				
				try {
					var result = utils.prettifyNumber(math.evaluate(expr));
					editor.replaceContent(result, sel.start, sel.end);
					editor.setCaretPos(sel.start + result.length);
					return true;
				} catch (e) {}
			}
			
			return false;
		}
	};
});

},{"../assets/range":31,"../utils/action":70,"../utils/common":73,"../utils/math":76}],10:[function(require,module,exports){
/**
 * 'Expand abbreviation' editor action: extracts abbreviation from current caret 
 * position and replaces it with formatted output. 
 * <br><br>
 * This behavior can be overridden with custom handlers which can perform 
 * different actions when 'Expand Abbreviation' action is called.
 * For example, a CSS gradient handler that produces vendor-prefixed gradient
 * definitions registers its own expand abbreviation handler.  
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var handlerList = require('../assets/handlerList');
	var range = require('../assets/range');
	var prefs = require('../assets/preferences');
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var cssGradient = require('../resolver/cssGradient');
	var parser = require('../parser/abbreviation');

	/**
	 * Search for abbreviation in editor from current caret position
	 * @param {IEmmetEditor} editor Editor instance
	 * @return {String}
	 */
	function findAbbreviation(editor) {
		var r = range(editor.getSelectionRange());
		var content = String(editor.getContent());
		if (r.length()) {
			// abbreviation is selected by user
			return r.substring(content);
		}
		
		// search for new abbreviation from current caret position
		var curLine = editor.getCurrentLineRange();
		return actionUtils.extractAbbreviation(content.substring(curLine.start, r.start));
	}

	/**
	 * @type HandlerList List of registered handlers
	 */
	var handlers = handlerList.create();

	// XXX setup default expand handlers
	
	/**
	 * Extracts abbreviation from current caret 
	 * position and replaces it with formatted output 
	 * @param {IEmmetEditor} editor Editor instance
	 * @param {String} syntax Syntax type (html, css, etc.)
	 * @param {String} profile Output profile name (html, xml, xhtml)
	 * @return {Boolean} Returns <code>true</code> if abbreviation was expanded 
	 * successfully
	 */
	handlers.add(function(editor, syntax, profile) {
		var caretPos = editor.getSelectionRange().end;
		var abbr = findAbbreviation(editor);
			
		if (abbr) {
			var content = parser.expand(abbr, {
				syntax: syntax, 
				profile: profile, 
				contextNode: actionUtils.captureContext(editor)
			});

			if (content) {
				var replaceFrom = caretPos - abbr.length;
				var replaceTo = caretPos;

				// a special case for CSS: if editor already contains
				// semicolon right after current caret position — replace it too
				var cssSyntaxes = prefs.getArray('css.syntaxes');
				if (cssSyntaxes && ~cssSyntaxes.indexOf(syntax)) {
					var curContent = editor.getContent();
					if (curContent.charAt(caretPos) == ';' && content.charAt(content.length - 1) == ';') {
						replaceTo++;
					}
				}

				editor.replaceContent(content, replaceFrom, replaceTo);
				return true;
			}
		}
		
		return false;
	}, {order: -1});
	handlers.add(cssGradient.expandAbbreviationHandler.bind(cssGradient));
		
	return {
		/**
		 * The actual “Expand Abbreviation“ action routine
		 * @param  {IEmmetEditor} editor  Editor instance
		 * @param  {String} syntax  Current document syntax
		 * @param  {String} profile Output profile name
		 * @return {Boolean}
		 */
		expandAbbreviationAction: function(editor, syntax, profile) {
			var args = utils.toArray(arguments);
			
			// normalize incoming arguments
			var info = editorUtils.outputInfo(editor, syntax, profile);
			args[1] = info.syntax;
			args[2] = info.profile;
			
			return handlers.exec(false, args);
		},

		/**
		 * A special case of “Expand Abbreviation“ action, invoked by Tab key.
		 * In this case if abbreviation wasn’t expanded successfully or there’s a selecetion, 
		 * the current line/selection will be indented. 
		 * @param  {IEmmetEditor} editor  Editor instance
		 * @param  {String} syntax  Current document syntax
		 * @param  {String} profile Output profile name
		 * @return {Boolean}
		 */
		expandAbbreviationWithTabAction: function(editor, syntax, profile) {
			var sel = editor.getSelection();
			var indent = '\t';

			// if something is selected in editor,
			// we should indent the selected content
			if (sel) {
				var selRange = range(editor.getSelectionRange());
				var content = utils.padString(sel, indent);
				
				editor.replaceContent(indent + '${0}', editor.getCaretPos());
				var replaceRange = range(editor.getCaretPos(), selRange.length());
				editor.replaceContent(content, replaceRange.start, replaceRange.end, true);
				editor.createSelection(replaceRange.start, replaceRange.start + content.length);
				return true;
			}
	
			// nothing selected, try to expand
			if (!this.expandAbbreviationAction(editor, syntax, profile)) {
				editor.replaceContent(indent, editor.getCaretPos());
			}
			
			return true;
		},

		
		_defaultHandler: function(editor, syntax, profile) {
			var caretPos = editor.getSelectionRange().end;
			var abbr = this.findAbbreviation(editor);
				
			if (abbr) {
				var ctx = actionUtils.captureContext(editor);
				var content = parser.expand(abbr, syntax, profile, ctx);
				if (content) {
					editor.replaceContent(content, caretPos - abbr.length, caretPos);
					return true;
				}
			}
			
			return false;
		},

		/**
		 * Adds custom expand abbreviation handler. The passed function should 
		 * return <code>true</code> if it was performed successfully, 
		 * <code>false</code> otherwise.
		 * 
		 * Added handlers will be called when 'Expand Abbreviation' is called
		 * in order they were added
		 * @memberOf expandAbbreviation
		 * @param {Function} fn
		 * @param {Object} options
		 */
		addHandler: function(fn, options) {
			handlers.add(fn, options);
		},
		
		/**
		 * Removes registered handler
		 * @returns
		 */
		removeHandler: function(fn) {
			handlers.remove(fn);
		},
		
		findAbbreviation: findAbbreviation
	};
});
},{"../assets/handlerList":26,"../assets/preferences":29,"../assets/range":31,"../parser/abbreviation":55,"../resolver/cssGradient":65,"../utils/action":70,"../utils/common":73,"../utils/editor":75}],11:[function(require,module,exports){
/**
 * Increment/decrement number under cursor
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var actionUtils = require('../utils/action');

	/**
	 * Returns length of integer part of number
	 * @param {String} num
	 */
	function intLength(num) {
		num = num.replace(/^\-/, '');
		if (~num.indexOf('.')) {
			return num.split('.')[0].length;
		}
		
		return num.length;
	}

	return {
		increment01Action: function(editor) {
			return this.incrementNumber(editor, .1);
		},

		increment1Action: function(editor) {
			return this.incrementNumber(editor, 1);
		},

		increment10Action: function(editor) {
			return this.incrementNumber(editor, 10);
		},

		decrement01Action: function(editor) {
			return this.incrementNumber(editor, -.1);
		},

		decrement1Action: function(editor) {
			return this.incrementNumber(editor, -1);
		},

		decrement10Action: function(editor) {
			return this.incrementNumber(editor, -10);
		},

		/**
		 * Default method to increment/decrement number under
		 * caret with given step
		 * @param  {IEmmetEditor} editor
		 * @param  {Number} step
		 * @return {Boolean}
		 */
		incrementNumber: function(editor, step) {
			var hasSign = false;
			var hasDecimal = false;
				
			var r = actionUtils.findExpressionBounds(editor, function(ch, pos, content) {
				if (utils.isNumeric(ch))
					return true;
				if (ch == '.') {
					// make sure that next character is numeric too
					if (!utils.isNumeric(content.charAt(pos + 1)))
						return false;
					
					return hasDecimal ? false : hasDecimal = true;
				}
				if (ch == '-')
					return hasSign ? false : hasSign = true;
					
				return false;
			});
				
			if (r && r.length()) {
				var strNum = r.substring(String(editor.getContent()));
				var num = parseFloat(strNum);
				if (!isNaN(num)) {
					num = utils.prettifyNumber(num + step);
					
					// do we have zero-padded number?
					if (/^(\-?)0+[1-9]/.test(strNum)) {
						var minus = '';
						if (RegExp.$1) {
							minus = '-';
							num = num.substring(1);
						}
							
						var parts = num.split('.');
						parts[0] = utils.zeroPadString(parts[0], intLength(strNum));
						num = minus + parts.join('.');
					}
					
					editor.replaceContent(num, r.start, r.end);
					editor.createSelection(r.start, r.start + num.length);
					return true;
				}
			}
			
			return false;
		}
	};
});
},{"../utils/action":70,"../utils/common":73}],12:[function(require,module,exports){
/**
 * Actions to insert line breaks. Some simple editors (like browser's 
 * &lt;textarea&gt;, for example) do not provide such simple things
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var prefs = require('../assets/preferences');
	var utils = require('../utils/common');
	var resources = require('../assets/resources');
	var htmlMatcher = require('../assets/htmlMatcher');
	var editorUtils = require('../utils/editor');

	var xmlSyntaxes = ['html', 'xml', 'xsl'];

	// setup default preferences
	prefs.define('css.closeBraceIndentation', '\n',
			'Indentation before closing brace of CSS rule. Some users prefere ' 
			+ 'indented closing brace of CSS rule for better readability. '
			+ 'This preference’s value will be automatically inserted before '
			+ 'closing brace when user adds newline in newly created CSS rule '
			+ '(e.g. when “Insert formatted linebreak” action will be performed ' 
			+ 'in CSS file). If you’re such user, you may want to write put a value ' 
			+ 'like <code>\\n\\t</code> in this preference.');

	return {
		/**
		 * Inserts newline character with proper indentation. This action is used in
		 * editors that doesn't have indentation control (like textarea element) to 
		 * provide proper indentation for inserted newlines
		 * @param {IEmmetEditor} editor Editor instance
		 */
		insertLineBreakAction: function(editor) {
			if (!this.insertLineBreakOnlyAction(editor)) {
				var curPadding = editorUtils.getCurrentLinePadding(editor);
				var content = String(editor.getContent());
				var caretPos = editor.getCaretPos();
				var len = content.length;
				var nl = '\n';
					
				// check out next line padding
				var lineRange = editor.getCurrentLineRange();
				var nextPadding = '';
					
				for (var i = lineRange.end, ch; i < len; i++) {
					ch = content.charAt(i);
					if (ch == ' ' || ch == '\t')
						nextPadding += ch;
					else
						break;
				}
				
				if (nextPadding.length > curPadding.length) {
					editor.replaceContent(nl + nextPadding, caretPos, caretPos, true);
				} else {
					editor.replaceContent(nl, caretPos);
				}
			}
			
			return true;
		},

		/**
		 * Inserts newline character with proper indentation in specific positions only.
		 * @param {IEmmetEditor} editor
		 * @return {Boolean} Returns <code>true</code> if line break was inserted 
		 */
		insertLineBreakOnlyAction: function(editor) {
			var info = editorUtils.outputInfo(editor);
			var caretPos = editor.getCaretPos();
			var nl = '\n';
			var pad = '\t';
			
			if (~xmlSyntaxes.indexOf(info.syntax)) {
				// let's see if we're breaking newly created tag
				var tag = htmlMatcher.tag(info.content, caretPos);
				if (tag && !tag.innerRange.length()) {
					editor.replaceContent(nl + pad + utils.getCaretPlaceholder() + nl, caretPos);
					return true;
				}
			} else if (info.syntax == 'css') {
				/** @type String */
				var content = info.content;
				if (caretPos && content.charAt(caretPos - 1) == '{') {
					var append = prefs.get('css.closeBraceIndentation');
					
					var hasCloseBrace = content.charAt(caretPos) == '}';
					if (!hasCloseBrace) {
						// do we really need special formatting here?
						// check if this is really a newly created rule,
						// look ahead for a closing brace
						for (var i = caretPos, il = content.length, ch; i < il; i++) {
							ch = content.charAt(i);
							if (ch == '{') {
								// ok, this is a new rule without closing brace
								break;
							}
							
							if (ch == '}') {
								// not a new rule, just add indentation
								append = '';
								hasCloseBrace = true;
								break;
							}
						}
					}
					
					if (!hasCloseBrace) {
						append += '}';
					}
					
					// defining rule set
					var insValue = nl + pad + utils.getCaretPlaceholder() + append;
					editor.replaceContent(insValue, caretPos);
					return true;
				}
			}
				
			return false;
		}
	};
});

},{"../assets/htmlMatcher":27,"../assets/preferences":29,"../assets/resources":32,"../utils/common":73,"../utils/editor":75}],13:[function(require,module,exports){
/**
 * Module describes and performs Emmet actions. The actions themselves are
 * defined in <i>actions</i> folder
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');

	// all registered actions
	var actions = {};

	// load all default actions
	var actionModules = {
		base64: require('./base64'),
		editPoints: require('./editPoints'),
		evaluateMath: require('./evaluateMath'),
		expandAbbreviation: require('./expandAbbreviation'),
		incrementDecrement: require('./incrementDecrement'),
		lineBreaks: require('./lineBreaks'),
		balance: require('./balance'),
		mergeLines: require('./mergeLines'),
		reflectCSSValue: require('./reflectCSSValue'),
		removeTag: require('./removeTag'),
		selectItem: require('./selectItem'),
		selectLine: require('./selectLine'),
		splitJoinTag: require('./splitJoinTag'),
		toggleComment: require('./toggleComment'),
		updateImageSize: require('./updateImageSize'),
		wrapWithAbbreviation: require('./wrapWithAbbreviation'),
		updateTag: require('./updateTag')
	};

	function addAction(name, fn, options) {
		name = name.toLowerCase();
		options = options || {};
		
		if (typeof options === 'string') {
			options = {label: options};
		}

		if (!options.label) {
			options.label = humanizeActionName(name);
		}
		
		actions[name] = {
			name: name,
			fn: fn,
			options: options
		};
	}
	
	/**
	 * “Humanizes” action name, makes it more readable for people
	 * @param {String} name Action name (like 'expand_abbreviation')
	 * @return Humanized name (like 'Expand Abbreviation')
	 */
	function humanizeActionName(name) {
		return utils.trim(name.charAt(0).toUpperCase() 
			+ name.substring(1).replace(/_[a-z]/g, function(str) {
				return ' ' + str.charAt(1).toUpperCase();
			}));
	}

	var bind = function(name, method) {
		var m = actionModules[name];
		return m[method].bind(m);
	};

	// XXX register default actions
	addAction('encode_decode_data_url', bind('base64', 'encodeDecodeDataUrlAction'), 'Encode\\Decode data:URL image');
	addAction('prev_edit_point', bind('editPoints', 'previousEditPointAction'), 'Previous Edit Point');
	addAction('next_edit_point', bind('editPoints', 'nextEditPointAction'), 'Next Edit Point');
	addAction('evaluate_math_expression', bind('evaluateMath', 'evaluateMathAction'), 'Numbers/Evaluate Math Expression');
	addAction('expand_abbreviation_with_tab', bind('expandAbbreviation', 'expandAbbreviationWithTabAction'), {hidden: true});
	addAction('expand_abbreviation', bind('expandAbbreviation', 'expandAbbreviationAction'), 'Expand Abbreviation');
	addAction('insert_formatted_line_break_only', bind('lineBreaks', 'insertLineBreakOnlyAction'), {hidden: true});
	addAction('insert_formatted_line_break', bind('lineBreaks', 'insertLineBreakAction'), {hidden: true});
	addAction('balance_inward', bind('balance', 'balanceInwardAction'), 'Balance (inward)');
	addAction('balance_outward', bind('balance', 'balanceOutwardAction'), 'Balance (outward)');
	addAction('matching_pair', bind('balance', 'goToMatchingPairAction'), 'HTML/Go To Matching Tag Pair');
	addAction('merge_lines', bind('mergeLines', 'mergeLinesAction'), 'Merge Lines');
	addAction('reflect_css_value', bind('reflectCSSValue', 'reflectCSSValueAction'), 'CSS/Reflect Value');
	addAction('remove_tag', bind('removeTag', 'removeTagAction'), 'HTML/Remove Tag');
	addAction('select_next_item', bind('selectItem', 'selectNextItemAction'), 'Select Next Item');
	addAction('select_previous_item', bind('selectItem', 'selectPreviousItemAction'), 'Select Previous Item');
	addAction('split_join_tag', bind('splitJoinTag', 'splitJoinTagAction'), 'HTML/Split\\Join Tag Declaration');
	addAction('toggle_comment', bind('toggleComment', 'toggleCommentAction'), 'Toggle Comment');
	addAction('update_image_size', bind('updateImageSize', 'updateImageSizeAction'), 'Update Image Size');
	addAction('wrap_with_abbreviation', bind('wrapWithAbbreviation', 'wrapWithAbbreviationAction'), 'Wrap With Abbreviation');
	addAction('update_tag', bind('updateTag', 'updateTagAction'), 'HTML/Update Tag');

	[1, -1, 10, -10, 0.1, -0.1].forEach(function(num) {
		var prefix = num > 0 ? 'increment' : 'decrement';
		var suffix = String(Math.abs(num)).replace('.', '').substring(0, 2);
		var actionId = prefix + '_number_by_' + suffix;
		var actionMethod = prefix + suffix + 'Action';
		var actionLabel = 'Numbers/' + prefix.charAt(0).toUpperCase() + prefix.substring(1) + ' number by ' + Math.abs(num);
		addAction(actionId, bind('incrementDecrement', actionMethod), actionLabel);
	});
	
	return {
		/**
		 * Registers new action
		 * @param {String} name Action name
		 * @param {Function} fn Action function
		 * @param {Object} options Custom action options:<br>
		 * <b>label</b> : (<code>String</code>) – Human-readable action name. 
		 * May contain '/' symbols as submenu separators<br>
		 * <b>hidden</b> : (<code>Boolean</code>) – Indicates whether action
		 * should be displayed in menu (<code>getMenu()</code> method)
		 */
		add: addAction,
		
		/**
		 * Returns action object
		 * @param {String} name Action name
		 * @returns {Object}
		 */
		get: function(name) {
			return actions[name.toLowerCase()];
		},
		
		/**
		 * Runs Emmet action. For list of available actions and their
		 * arguments see <i>actions</i> folder.
		 * @param {String} name Action name 
		 * @param {Array} args Additional arguments. It may be array of arguments
		 * or inline arguments. The first argument should be <code>IEmmetEditor</code> instance
		 * @returns {Boolean} Status of performed operation, <code>true</code>
		 * means action was performed successfully.
		 * @example
		 * require('action/main').run('expand_abbreviation', editor);  
		 * require('action/main').run('wrap_with_abbreviation', [editor, 'div']);  
		 */
		run: function(name, args) {
			if (!Array.isArray(args)) {
				args = utils.toArray(arguments, 1);
			}
			
			var action = this.get(name);
			if (!action) {
				throw new Error('Action "' + name + '" is not defined');
			}

			return action.fn.apply(action, args);
		},
		
		/**
		 * Returns all registered actions as object
		 * @returns {Object}
		 */
		getAll: function() {
			return actions;
		},
		
		/**
		 * Returns all registered actions as array
		 * @returns {Array}
		 */
		getList: function() {
			var all = this.getAll();
			return Object.keys(all).map(function(key) {
				return all[key];
			});
		},
		
		/**
		 * Returns actions list as structured menu. If action has <i>label</i>,
		 * it will be splitted by '/' symbol into submenus (for example: 
		 * CSS/Reflect Value) and grouped with other items
		 * @param {Array} skipActions List of action identifiers that should be 
		 * skipped from menu
		 * @returns {Array}
		 */
		getMenu: function(skipActions) {
			var result = [];
			skipActions = skipActions || [];
			this.getList().forEach(function(action) {
				if (action.options.hidden || ~skipActions.indexOf(action.name))
					return;
				
				var actionName = humanizeActionName(action.name);
				var ctx = result;
				if (action.options.label) {
					var parts = action.options.label.split('/');
					actionName = parts.pop();
					
					// create submenus, if needed
					var menuName, submenu;
					while ((menuName = parts.shift())) {
						submenu = utils.find(ctx, function(item) {
							return item.type == 'submenu' && item.name == menuName;
						});
						
						if (!submenu) {
							submenu = {
								name: menuName,
								type: 'submenu',
								items: []
							};
							ctx.push(submenu);
						}
						
						ctx = submenu.items;
					}
				}
				
				ctx.push({
					type: 'action',
					name: action.name,
					label: actionName
				});
			});
			
			return result;
		},

		/**
		 * Returns action name associated with menu item title
		 * @param {String} title
		 * @returns {String}
		 */
		getActionNameForMenuTitle: function(title, menu) {
			return utils.find(menu || this.getMenu(), function(val) {
				if (val.type == 'action') {
					if (val.label == title || val.name == title) {
						return val.name;
					}
				} else {
					return this.getActionNameForMenuTitle(title, val.items);
				}
			}, this);
		}
	};
});
},{"../utils/common":73,"./balance":6,"./base64":7,"./editPoints":8,"./evaluateMath":9,"./expandAbbreviation":10,"./incrementDecrement":11,"./lineBreaks":12,"./mergeLines":14,"./reflectCSSValue":15,"./removeTag":16,"./selectItem":17,"./selectLine":18,"./splitJoinTag":19,"./toggleComment":20,"./updateImageSize":21,"./updateTag":22,"./wrapWithAbbreviation":23}],14:[function(require,module,exports){
/**
 * Merges selected lines or lines between XHTML tag pairs
 * @param {Function} require
 * @param {Underscore} _
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var htmlMatcher = require('../assets/htmlMatcher');
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var range = require('../assets/range');

	return {
		mergeLinesAction: function(editor) {
			var info = editorUtils.outputInfo(editor);
		
			var selection = range(editor.getSelectionRange());
			if (!selection.length()) {
				// find matching tag
				var pair = htmlMatcher.find(info.content, editor.getCaretPos());
				if (pair) {
					selection = pair.outerRange;
				}
			}
			
			if (selection.length()) {
				// got range, merge lines
				var text =  selection.substring(info.content);
				var lines = utils.splitByLines(text);
				
				for (var i = 1; i < lines.length; i++) {
					lines[i] = lines[i].replace(/^\s+/, '');
				}
				
				text = lines.join('').replace(/\s{2,}/, ' ');
				var textLen = text.length;
				text = utils.escapeText(text);
				editor.replaceContent(text, selection.start, selection.end);
				editor.createSelection(selection.start, selection.start + textLen);
				
				return true;
			}
			
			return false;
		}
	};
});
},{"../assets/htmlMatcher":27,"../assets/range":31,"../utils/common":73,"../utils/editor":75}],15:[function(require,module,exports){
/**
 * Reflect CSS value: takes rule's value under caret and pastes it for the same 
 * rules with vendor prefixes
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var handlerList = require('../assets/handlerList');
	var prefs = require('../assets/preferences');
	var cssResolver = require('../resolver/css');
	var cssEditTree = require('../editTree/css');
	var utils = require('../utils/common');
	var actionUtils = require('../utils/action');
	var editorUtils = require('../utils/editor');
	var cssGradient = require('../resolver/cssGradient');

	prefs.define('css.reflect.oldIEOpacity', false, 'Support IE6/7/8 opacity notation, e.g. <code>filter:alpha(opacity=...)</code>.\
		Note that CSS3 and SVG also provides <code>filter</code> property so this option is disabled by default.')

	/**
	 * @type HandlerList List of registered handlers
	 */
	var handlers = handlerList.create();
	
	function doCSSReflection(editor) {
		var outputInfo = editorUtils.outputInfo(editor);
		var caretPos = editor.getCaretPos();
		
		var cssRule = cssEditTree.parseFromPosition(outputInfo.content, caretPos);
		if (!cssRule) return;
		
		var property = cssRule.itemFromPosition(caretPos, true);
		// no property under cursor, nothing to reflect
		if (!property) return;
		
		var oldRule = cssRule.source;
		var offset = cssRule.options.offset;
		var caretDelta = caretPos - offset - property.range().start;
		
		handlers.exec(false, [property]);
		
		if (oldRule !== cssRule.source) {
			return {
				data:  cssRule.source,
				start: offset,
				end:   offset + oldRule.length,
				caret: offset + property.range().start + caretDelta
			};
		}
	}
	
	/**
	 * Returns regexp that should match reflected CSS property names
	 * @param {String} name Current CSS property name
	 * @return {RegExp}
	 */
	function getReflectedCSSName(name) {
		name = cssEditTree.baseName(name);
		var vendorPrefix = '^(?:\\-\\w+\\-)?', m;
		
		if ((name == 'opacity' || name == 'filter') && prefs.get('css.reflect.oldIEOpacity')) {
			return new RegExp(vendorPrefix + '(?:opacity|filter)$');
		} else if ((m = name.match(/^border-radius-(top|bottom)(left|right)/))) {
			// Mozilla-style border radius
			return new RegExp(vendorPrefix + '(?:' + name + '|border-' + m[1] + '-' + m[2] + '-radius)$');
		} else if ((m = name.match(/^border-(top|bottom)-(left|right)-radius/))) { 
			return new RegExp(vendorPrefix + '(?:' + name + '|border-radius-' + m[1] + m[2] + ')$');
		}
		
		return new RegExp(vendorPrefix + name + '$');
	}

	/**
	 * Reflects inner CSS properites in given value
	 * agains name‘s vendor prefix. In other words, it tries
	 * to modify `transform 0.2s linear` value for `-webkit-transition`
	 * property
	 * @param  {String} name  Reciever CSS property name
	 * @param  {String} value New property value
	 * @return {String}
	 */
	function reflectValueParts(name, value) {
		// detects and updates vendor-specific properties in value,
		// e.g. -webkit-transition: -webkit-transform
		
		var reVendor = /^\-(\w+)\-/;
		var propPrefix = reVendor.test(name) ? RegExp.$1.toLowerCase() : '';
		var parts = cssEditTree.findParts(value);

		parts.reverse();
		parts.forEach(function(part) {
			var partValue = part.substring(value).replace(reVendor, '');
			var prefixes = cssResolver.vendorPrefixes(partValue);
			if (prefixes) {
				// if prefixes are not null then given value can
				// be resolved against Can I Use database and may or
				// may not contain prefixed variant
				if (propPrefix && ~prefixes.indexOf(propPrefix)) {
					partValue = '-' + propPrefix + '-' + partValue;
				}

				value = utils.replaceSubstring(value, partValue, part);
			}
		});

		return value;
	}
	
	/**
	 * Reflects value from <code>donor</code> into <code>receiver</code>
	 * @param {CSSProperty} donor Donor CSS property from which value should
	 * be reflected
	 * @param {CSSProperty} receiver Property that should receive reflected 
	 * value from donor
	 */
	function reflectValue(donor, receiver) {
		var value = getReflectedValue(donor.name(), donor.value(), 
				receiver.name(), receiver.value());
		
		value = reflectValueParts(receiver.name(), value);
		receiver.value(value);
	}
	
	/**
	 * Returns value that should be reflected for <code>refName</code> CSS property
	 * from <code>curName</code> property. This function is used for special cases,
	 * when the same result must be achieved with different properties for different
	 * browsers. For example: opаcity:0.5; → filter:alpha(opacity=50);<br><br>
	 * 
	 * This function does value conversion between different CSS properties
	 * 
	 * @param {String} curName Current CSS property name
	 * @param {String} curValue Current CSS property value
	 * @param {String} refName Receiver CSS property's name 
	 * @param {String} refValue Receiver CSS property's value
	 * @return {String} New value for receiver property
	 */
	function getReflectedValue(curName, curValue, refName, refValue) {
		curName = cssEditTree.baseName(curName);
		refName = cssEditTree.baseName(refName);
		
		if (curName == 'opacity' && refName == 'filter') {
			return refValue.replace(/opacity=[^)]*/i, 'opacity=' + Math.floor(parseFloat(curValue) * 100));
		} else if (curName == 'filter' && refName == 'opacity') {
			var m = curValue.match(/opacity=([^)]*)/i);
			return m ? utils.prettifyNumber(parseInt(m[1], 10) / 100) : refValue;
		}
		
		return curValue;
	}
	
	module = module || {};
	module.exports = {
		reflectCSSValueAction: function(editor) {
			if (editor.getSyntax() != 'css') {
				return false;
			}

			return actionUtils.compoundUpdate(editor, doCSSReflection(editor));
		},

		_defaultHandler: function(property) {
			var reName = getReflectedCSSName(property.name());
			property.parent.list().forEach(function(p) {
				if (reName.test(p.name())) {
					reflectValue(property, p);
				}
			});
		},

		/**
		 * Adds custom reflect handler. The passed function will receive matched
		 * CSS property (as <code>CSSEditElement</code> object) and should
		 * return <code>true</code> if it was performed successfully (handled 
		 * reflection), <code>false</code> otherwise.
		 * @param {Function} fn
		 * @param {Object} options
		 */
		addHandler: function(fn, options) {
			handlers.add(fn, options);
		},
		
		/**
		 * Removes registered handler
		 * @returns
		 */
		removeHandler: function(fn) {
			handlers.remove(fn);
		}
	};

	// XXX add default handlers
	handlers.add(module.exports._defaultHandler.bind(module.exports), {order: -1});
	handlers.add(cssGradient.reflectValueHandler.bind(cssGradient));

	return module.exports;
});
},{"../assets/handlerList":26,"../assets/preferences":29,"../editTree/css":37,"../resolver/css":64,"../resolver/cssGradient":65,"../utils/action":70,"../utils/common":73,"../utils/editor":75}],16:[function(require,module,exports){
/**
 * Gracefully removes tag under cursor
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var htmlMatcher = require('../assets/htmlMatcher');

	return {
		removeTagAction: function(editor) {
			var info = editorUtils.outputInfo(editor);
			
			// search for tag
			var tag = htmlMatcher.tag(info.content, editor.getCaretPos());
			if (tag) {
				if (!tag.close) {
					// simply remove unary tag
					editor.replaceContent(utils.getCaretPlaceholder(), tag.range.start, tag.range.end);
				} else {
					// remove tag and its newlines
					/** @type Range */
					var tagContentRange = utils.narrowToNonSpace(info.content, tag.innerRange);
					/** @type Range */
					var startLineBounds = utils.findNewlineBounds(info.content, tagContentRange.start);
					var startLinePad = utils.getLinePadding(startLineBounds.substring(info.content));
					var tagContent = tagContentRange.substring(info.content);
					
					tagContent = utils.unindentString(tagContent, startLinePad);
					editor.replaceContent(utils.getCaretPlaceholder() + utils.escapeText(tagContent), tag.outerRange.start, tag.outerRange.end);
				}
				
				return true;
			}
			
			return false;
		}
	};
});

},{"../assets/htmlMatcher":27,"../utils/common":73,"../utils/editor":75}],17:[function(require,module,exports){
/**
 * Actions that use stream parsers and tokenizers for traversing:
 * -- Search for next/previous items in HTML
 * -- Search for next/previous items in CSS
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var range = require('../assets/range');
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var stringStream = require('../assets/stringStream');
	var xmlParser = require('../parser/xml');
	var cssEditTree = require('../editTree/css');
	var cssSections = require('../utils/cssSections');

	var startTag = /^<([\w\:\-]+)((?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;

	/**
	 * Generic function for searching for items to select
	 * @param {IEmmetEditor} editor
	 * @param {Boolean} isBackward Search backward (search forward otherwise)
	 * @param {Function} extractFn Function that extracts item content
	 * @param {Function} rangeFn Function that search for next token range
	 */
	function findItem(editor, isBackward, extractFn, rangeFn) {
		var content = editorUtils.outputInfo(editor).content;
		
		var contentLength = content.length;
		var itemRange, rng;
		/** @type Range */
		var prevRange = range(-1, 0);
		/** @type Range */
		var sel = range(editor.getSelectionRange());
		
		var searchPos = sel.start, loop = 100000; // endless loop protection
		while (searchPos >= 0 && searchPos < contentLength && --loop > 0) {
			if ( (itemRange = extractFn(content, searchPos, isBackward)) ) {
				if (prevRange.equal(itemRange)) {
					break;
				}
				
				prevRange = itemRange.clone();
				rng = rangeFn(itemRange.substring(content), itemRange.start, sel.clone());
				
				if (rng) {
					editor.createSelection(rng.start, rng.end);
					return true;
				} else {
					searchPos = isBackward ? itemRange.start : itemRange.end - 1;
				}
			}
			
			searchPos += isBackward ? -1 : 1;
		}
		
		return false;
	}
	
	// XXX HTML section
	
	/**
	 * Find next HTML item
	 * @param {IEmmetEditor} editor
	 */
	function findNextHTMLItem(editor) {
		var isFirst = true;
		return findItem(editor, false, function(content, searchPos){
			if (isFirst) {
				isFirst = false;
				return findOpeningTagFromPosition(content, searchPos);
			} else {
				return getOpeningTagFromPosition(content, searchPos);
			}
		}, function(tag, offset, selRange) {
			return getRangeForHTMLItem(tag, offset, selRange, false);
		});
	}
	
	/**
	 * Find previous HTML item
	 * @param {IEmmetEditor} editor
	 */
	function findPrevHTMLItem(editor) {
		return findItem(editor, true, getOpeningTagFromPosition, function (tag, offset, selRange) {
			return getRangeForHTMLItem(tag, offset, selRange, true);
		});
	}
	
	/**
	 * Creates possible selection ranges for HTML tag
	 * @param {String} source Original HTML source for tokens
	 * @param {Array} tokens List of HTML tokens
	 * @returns {Array}
	 */
	function makePossibleRangesHTML(source, tokens, offset) {
		offset = offset || 0;
		var result = [];
		var attrStart = -1, attrName = '', attrValue = '', attrValueRange, tagName;
		tokens.forEach(function(tok) {
			switch (tok.type) {
				case 'tag':
					tagName = source.substring(tok.start, tok.end);
					if (/^<[\w\:\-]/.test(tagName)) {
						// add tag name
						result.push(range({
							start: tok.start + 1, 
							end: tok.end
						}));
					}
					break;
				case 'attribute':
					attrStart = tok.start;
					attrName = source.substring(tok.start, tok.end);
					break;
					
				case 'string':
					// attribute value
					// push full attribute first
					result.push(range(attrStart, tok.end - attrStart));
					
					attrValueRange = range(tok);
					attrValue = attrValueRange.substring(source);
					
					// is this a quoted attribute?
					if (isQuote(attrValue.charAt(0)))
						attrValueRange.start++;
					
					if (isQuote(attrValue.charAt(attrValue.length - 1)))
						attrValueRange.end--;
					
					result.push(attrValueRange);
					
					if (attrName == 'class') {
						result = result.concat(classNameRanges(attrValueRange.substring(source), attrValueRange.start));
					}
					
					break;
			}
		});
		
		// offset ranges
		result = result.filter(function(item) {
			if (item.length()) {
				item.shift(offset);
				return true;
			}
		});

		// remove duplicates
		return utils.unique(result, function(item) {
			return item.toString();
		});
	}
	
	/**
	 * Returns ranges of class names in "class" attribute value
	 * @param {String} className
	 * @returns {Array}
	 */
	function classNameRanges(className, offset) {
		offset = offset || 0;
		var result = [];
		/** @type StringStream */
		var stream = stringStream.create(className);
		
		// skip whitespace
		stream.eatSpace();
		stream.start = stream.pos;
		
		var ch;
		while ((ch = stream.next())) {
			if (/[\s\u00a0]/.test(ch)) {
				result.push(range(stream.start + offset, stream.pos - stream.start - 1));
				stream.eatSpace();
				stream.start = stream.pos;
			}
		}
		
		result.push(range(stream.start + offset, stream.pos - stream.start));
		return result;
	}
	
	/**
	 * Returns best HTML tag range match for current selection
	 * @param {String} tag Tag declaration
	 * @param {Number} offset Tag's position index inside content
	 * @param {Range} selRange Selection range
	 * @return {Range} Returns range if next item was found, <code>null</code> otherwise
	 */
	function getRangeForHTMLItem(tag, offset, selRange, isBackward) {
		var ranges = makePossibleRangesHTML(tag, xmlParser.parse(tag), offset);
		
		if (isBackward)
			ranges.reverse();
		
		// try to find selected range
		var curRange = utils.find(ranges, function(r) {
			return r.equal(selRange);
		});
		
		if (curRange) {
			var ix = ranges.indexOf(curRange);
			if (ix < ranges.length - 1)
				return ranges[ix + 1];
			
			return null;
		}
		
		// no selected range, find nearest one
		if (isBackward)
			// search backward
			return utils.find(ranges, function(r) {
				return r.start < selRange.start;
			});
		
		// search forward
		// to deal with overlapping ranges (like full attribute definition
		// and attribute value) let's find range under caret first
		if (!curRange) {
			var matchedRanges = ranges.filter(function(r) {
				return r.inside(selRange.end);
			});
			
			if (matchedRanges.length > 1)
				return matchedRanges[1];
		}
		
		
		return utils.find(ranges, function(r) {
			return r.end > selRange.end;
		});
	}
	
	/**
	 * Search for opening tag in content, starting at specified position
	 * @param {String} html Where to search tag
	 * @param {Number} pos Character index where to start searching
	 * @return {Range} Returns range if valid opening tag was found,
	 * <code>null</code> otherwise
	 */
	function findOpeningTagFromPosition(html, pos) {
		var tag;
		while (pos >= 0) {
			if ((tag = getOpeningTagFromPosition(html, pos)))
				return tag;
			pos--;
		}
		
		return null;
	}
	
	/**
	 * @param {String} html Where to search tag
	 * @param {Number} pos Character index where to start searching
	 * @return {Range} Returns range if valid opening tag was found,
	 * <code>null</code> otherwise
	 */
	function getOpeningTagFromPosition(html, pos) {
		var m;
		if (html.charAt(pos) == '<' && (m = html.substring(pos, html.length).match(startTag))) {
			return range(pos, m[0]);
		}
	}
	
	function isQuote(ch) {
		return ch == '"' || ch == "'";
	}

	/**
	 * Returns all ranges inside given rule, available for selection
	 * @param  {CSSEditContainer} rule
	 * @return {Array}
	 */
	function findInnerRanges(rule) {
		// rule selector
		var ranges = [rule.nameRange(true)];

		// find nested sections, keep selectors only
		var nestedSections = cssSections.nestedSectionsInRule(rule);
		nestedSections.forEach(function(section) {
			ranges.push(range.create2(section.start, section._selectorEnd));
		});

		// add full property ranges and values
		rule.list().forEach(function(property) {
			ranges = ranges.concat(makePossibleRangesCSS(property));
		});

		ranges = range.sort(ranges);

		// optimize result: remove empty ranges and duplicates
		ranges = ranges.filter(function(item) {
			return !!item.length();
		});
		return utils.unique(ranges, function(item) {
			return item.toString();
		});
	}
	
	/**
	 * Makes all possible selection ranges for specified CSS property
	 * @param {CSSProperty} property
	 * @returns {Array}
	 */
	function makePossibleRangesCSS(property) {
		// find all possible ranges, sorted by position and size
		var valueRange = property.valueRange(true);
		var result = [property.range(true), valueRange];
		
		// locate parts of complex values.
		// some examples:
		// – 1px solid red: 3 parts
		// – arial, sans-serif: enumeration, 2 parts
		// – url(image.png): function value part
		var value = property.value();
		property.valueParts().forEach(function(r) {
			// add absolute range
			var clone = r.clone();
			result.push(clone.shift(valueRange.start));
			
			/** @type StringStream */
			var stream = stringStream.create(r.substring(value));
			if (stream.match(/^[\w\-]+\(/, true)) {
				// we have a function, find values in it.
				// but first add function contents
				stream.start = stream.pos;
				stream.backUp(1);
				stream.skipToPair('(', ')');
				stream.backUp(1);
				var fnBody = stream.current();
				result.push(range(clone.start + stream.start, fnBody));
				
				// find parts
				cssEditTree.findParts(fnBody).forEach(function(part) {
					result.push(range(clone.start + stream.start + part.start, part.substring(fnBody)));
				});
			}
		});

		return result;
	}
	
	/**
	 * Tries to find matched CSS property and nearest range for selection
	 * @param {CSSRule} rule
	 * @param {Range} selRange
	 * @param {Boolean} isBackward
	 * @returns {Range}
	 */
	function matchedRangeForCSSProperty(rule, selRange, isBackward) {
		var ranges = findInnerRanges(rule);
		if (isBackward) {
			ranges.reverse();
		}
		
		// return next to selected range, if possible
		var r = utils.find(ranges, function(item) {
			return item.equal(selRange);
		});

		if (r) {
			return ranges[ranges.indexOf(r) + 1];
		}

		// find matched and (possibly) overlapping ranges
		var nested = ranges.filter(function(item) {
			return item.inside(selRange.end);
		});

		if (nested.length) {
			return nested.sort(function(a, b) {
				return a.length() - b.length();
			})[0];
		}

		// return range next to caret
		var test = 
		r = utils.find(ranges, isBackward 
			? function(item) {return item.end < selRange.start;}
			: function(item) {return item.end > selRange.start;}
		);

		if (!r) {
			// can’t find anything, just pick first one
			r = ranges[0];
		}

		return r;
	}
	
	function findNextCSSItem(editor) {
		return findItem(editor, false, cssSections.locateRule.bind(cssSections), getRangeForNextItemInCSS);
	}
	
	function findPrevCSSItem(editor) {
		return findItem(editor, true, cssSections.locateRule.bind(cssSections), getRangeForPrevItemInCSS);
	}
	
	/**
	 * Returns range for item to be selected in CSS after current caret 
	 * (selection) position
	 * @param {String} rule CSS rule declaration
	 * @param {Number} offset Rule's position index inside content
	 * @param {Range} selRange Selection range
	 * @return {Range} Returns range if next item was found, <code>null</code> otherwise
	 */
	function getRangeForNextItemInCSS(rule, offset, selRange) {
		var tree = cssEditTree.parse(rule, {
			offset: offset
		});

		return matchedRangeForCSSProperty(tree, selRange, false);
	}
	
	/**
	 * Returns range for item to be selected in CSS before current caret 
	 * (selection) position
	 * @param {String} rule CSS rule declaration
	 * @param {Number} offset Rule's position index inside content
	 * @param {Range} selRange Selection range
	 * @return {Range} Returns range if previous item was found, <code>null</code> otherwise
	 */
	function getRangeForPrevItemInCSS(rule, offset, selRange) {
		var tree = cssEditTree.parse(rule, {
			offset: offset
		});

		return matchedRangeForCSSProperty(tree, selRange, true);
	}

	return {
		selectNextItemAction: function(editor) {
			if (actionUtils.isSupportedCSS(editor.getSyntax())) {
				return findNextCSSItem(editor);
			} else {
				return findNextHTMLItem(editor);
			}
		},

		selectPreviousItemAction: function(editor) {
			if (actionUtils.isSupportedCSS(editor.getSyntax())) {
				return findPrevCSSItem(editor);
			} else {
				return findPrevHTMLItem(editor);
			}
		}
	};
});
},{"../assets/range":31,"../assets/stringStream":33,"../editTree/css":37,"../parser/xml":62,"../utils/action":70,"../utils/common":73,"../utils/cssSections":74,"../utils/editor":75}],18:[function(require,module,exports){
/**
 * Select current line (for simple editors like browser's &lt;textarea&gt;)
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	return {
		selectLineAction: function(editor) {
			var range = editor.getCurrentLineRange();
			editor.createSelection(range.start, range.end);
			return true;
		}
	};
});
},{}],19:[function(require,module,exports){
/**
 * Splits or joins tag, e.g. transforms it into a short notation and vice versa:<br>
 * &lt;div&gt;&lt;/div&gt; → &lt;div /&gt; : join<br>
 * &lt;div /&gt; → &lt;div&gt;&lt;/div&gt; : split
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var resources = require('../assets/resources');
	var matcher = require('../assets/htmlMatcher');
	var editorUtils = require('../utils/editor');
	var profile = require('../assets/profile');

	/**
	 * @param {IEmmetEditor} editor
	 * @param {Object} profile
	 * @param {Object} tag
	 */
	function joinTag(editor, profile, tag) {
		// empty closing slash is a nonsense for this action
		var slash = profile.selfClosing() || ' /';
		var content = tag.open.range.substring(tag.source).replace(/\s*>$/, slash + '>');
		
		var caretPos = editor.getCaretPos();
		
		// update caret position
		if (content.length + tag.outerRange.start < caretPos) {
			caretPos = content.length + tag.outerRange.start;
		}
		
		content = utils.escapeText(content);
		editor.replaceContent(content, tag.outerRange.start, tag.outerRange.end);
		editor.setCaretPos(caretPos);
		return true;
	}
	
	function splitTag(editor, profile, tag) {
		var caretPos = editor.getCaretPos();
		
		// define tag content depending on profile
		var tagContent = (profile.tag_nl === true) ? '\n\t\n' : '';
		var content = tag.outerContent().replace(/\s*\/>$/, '>');
		caretPos = tag.outerRange.start + content.length;
		content += tagContent + '</' + tag.open.name + '>';
		
		content = utils.escapeText(content);
		editor.replaceContent(content, tag.outerRange.start, tag.outerRange.end);
		editor.setCaretPos(caretPos);
		return true;
	}

	return {
		splitJoinTagAction: function(editor, profileName) {
			var info = editorUtils.outputInfo(editor, null, profileName);
			var curProfile = profile.get(info.profile);
			
			// find tag at current position
			var tag = matcher.tag(info.content, editor.getCaretPos());
			if (tag) {
				return tag.close 
					? joinTag(editor, curProfile, tag) 
					: splitTag(editor, curProfile, tag);
			}
			
			return false;
		}
	};
});
},{"../assets/htmlMatcher":27,"../assets/profile":30,"../assets/resources":32,"../utils/common":73,"../utils/editor":75}],20:[function(require,module,exports){
/**
 * Toggles HTML and CSS comments depending on current caret context. Unlike
 * the same action in most editors, this action toggles comment on currently
 * matched item—HTML tag or CSS selector—when nothing is selected.
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var prefs = require('../assets/preferences');
	var range = require('../assets/range');
	var utils = require('../utils/common');
	var actionUtils = require('../utils/action');
	var editorUtils = require('../utils/editor');
	var htmlMatcher = require('../assets/htmlMatcher');
	var cssEditTree = require('../editTree/css');

	/**
	 * Toggle HTML comment on current selection or tag
	 * @param {IEmmetEditor} editor
	 * @return {Boolean} Returns <code>true</code> if comment was toggled
	 */
	function toggleHTMLComment(editor) {
		/** @type Range */
		var r = range(editor.getSelectionRange());
		var info = editorUtils.outputInfo(editor);
			
		if (!r.length()) {
			// no selection, find matching tag
			var tag = htmlMatcher.tag(info.content, editor.getCaretPos());
			if (tag) { // found pair
				r = tag.outerRange;
			}
		}
		
		return genericCommentToggle(editor, '<!--', '-->', r);
	}

	/**
	 * Simple CSS commenting
	 * @param {IEmmetEditor} editor
	 * @return {Boolean} Returns <code>true</code> if comment was toggled
	 */
	function toggleCSSComment(editor) {
		/** @type Range */
		var rng = range(editor.getSelectionRange());
		var info = editorUtils.outputInfo(editor);
			
		if (!rng.length()) {
			// no selection, try to get current rule
			/** @type CSSRule */
			var rule = cssEditTree.parseFromPosition(info.content, editor.getCaretPos());
			if (rule) {
				var property = cssItemFromPosition(rule, editor.getCaretPos());
				rng = property 
					? property.range(true) 
					: range(rule.nameRange(true).start, rule.source);
			}
		}
		
		if (!rng.length()) {
			// still no selection, get current line
			rng = range(editor.getCurrentLineRange());
			utils.narrowToNonSpace(info.content, rng);
		}
		
		return genericCommentToggle(editor, '/*', '*/', rng);
	}
	
	/**
	 * Returns CSS property from <code>rule</code> that matches passed position
	 * @param {EditContainer} rule
	 * @param {Number} absPos
	 * @returns {EditElement}
	 */
	function cssItemFromPosition(rule, absPos) {
		// do not use default EditContainer.itemFromPosition() here, because
		// we need to make a few assumptions to make CSS commenting more reliable
		var relPos = absPos - (rule.options.offset || 0);
		var reSafeChar = /^[\s\n\r]/;
		return utils.find(rule.list(), function(item) {
			if (item.range().end === relPos) {
				// at the end of property, but outside of it
				// if there’s a space character at current position,
				// use current property
				return reSafeChar.test(rule.source.charAt(relPos));
			}
			
			return item.range().inside(relPos);
		});
	}

	/**
	 * Search for nearest comment in <code>str</code>, starting from index <code>from</code>
	 * @param {String} text Where to search
	 * @param {Number} from Search start index
	 * @param {String} start_token Comment start string
	 * @param {String} end_token Comment end string
	 * @return {Range} Returns null if comment wasn't found
	 */
	function searchComment(text, from, startToken, endToken) {
		var commentStart = -1;
		var commentEnd = -1;
		
		var hasMatch = function(str, start) {
			return text.substr(start, str.length) == str;
		};
			
		// search for comment start
		while (from--) {
			if (hasMatch(startToken, from)) {
				commentStart = from;
				break;
			}
		}
		
		if (commentStart != -1) {
			// search for comment end
			from = commentStart;
			var contentLen = text.length;
			while (contentLen >= from++) {
				if (hasMatch(endToken, from)) {
					commentEnd = from + endToken.length;
					break;
				}
			}
		}
		
		return (commentStart != -1 && commentEnd != -1) 
			? range(commentStart, commentEnd - commentStart) 
			: null;
	}

	/**
	 * Generic comment toggling routine
	 * @param {IEmmetEditor} editor
	 * @param {String} commentStart Comment start token
	 * @param {String} commentEnd Comment end token
	 * @param {Range} range Selection range
	 * @return {Boolean}
	 */
	function genericCommentToggle(editor, commentStart, commentEnd, range) {
		var content = editorUtils.outputInfo(editor).content;
		var caretPos = editor.getCaretPos();
		var newContent = null;
			
		/**
		 * Remove comment markers from string
		 * @param {Sting} str
		 * @return {String}
		 */
		function removeComment(str) {
			return str
				.replace(new RegExp('^' + utils.escapeForRegexp(commentStart) + '\\s*'), function(str){
					caretPos -= str.length;
					return '';
				}).replace(new RegExp('\\s*' + utils.escapeForRegexp(commentEnd) + '$'), '');
		}
		
		// first, we need to make sure that this substring is not inside 
		// comment
		var commentRange = searchComment(content, caretPos, commentStart, commentEnd);
		if (commentRange && commentRange.overlap(range)) {
			// we're inside comment, remove it
			range = commentRange;
			newContent = removeComment(range.substring(content));
		} else {
			// should add comment
			// make sure that there's no comment inside selection
			newContent = commentStart + ' ' +
				range.substring(content)
					.replace(new RegExp(utils.escapeForRegexp(commentStart) + '\\s*|\\s*' + utils.escapeForRegexp(commentEnd), 'g'), '') +
				' ' + commentEnd;
				
			// adjust caret position
			caretPos += commentStart.length + 1;
		}

		// replace editor content
		if (newContent !== null) {
			newContent = utils.escapeText(newContent);
			editor.setCaretPos(range.start);
			editor.replaceContent(editorUtils.unindent(editor, newContent), range.start, range.end);
			editor.setCaretPos(caretPos);
			return true;
		}
		
		return false;
	}
	
	return {
		/**
		 * Toggle comment on current editor's selection or HTML tag/CSS rule
		 * @param {IEmmetEditor} editor
		 */
		toggleCommentAction: function(editor) {
			var info = editorUtils.outputInfo(editor);
			if (actionUtils.isSupportedCSS(info.syntax)) {
				// in case our editor is good enough and can recognize syntax from 
				// current token, we have to make sure that cursor is not inside
				// 'style' attribute of html element
				var caretPos = editor.getCaretPos();
				var tag = htmlMatcher.tag(info.content, caretPos);
				if (tag && tag.open.range.inside(caretPos)) {
					info.syntax = 'html';
				}
			}
			
			var cssSyntaxes = prefs.getArray('css.syntaxes');
			if (~cssSyntaxes.indexOf(info.syntax)) {
				return toggleCSSComment(editor);
			}
			
			return toggleHTMLComment(editor);
		}
	};
});
},{"../assets/htmlMatcher":27,"../assets/preferences":29,"../assets/range":31,"../editTree/css":37,"../utils/action":70,"../utils/common":73,"../utils/editor":75}],21:[function(require,module,exports){
/**
 * Automatically updates image size attributes in HTML's &lt;img&gt; element or
 * CSS rule
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var xmlEditTree = require('../editTree/xml');
	var cssEditTree = require('../editTree/css');
	var base64 = require('../utils/base64');
	var file = require('../plugin/file');

	/**
	 * Updates image size of &lt;img src=""&gt; tag
	 * @param {IEmmetEditor} editor
	 */
	function updateImageSizeHTML(editor) {
		var offset = editor.getCaretPos();

		// find tag from current caret position
		var info = editorUtils.outputInfo(editor);
		var xmlElem = xmlEditTree.parseFromPosition(info.content, offset, true);
		if (xmlElem && (xmlElem.name() || '').toLowerCase() == 'img') {
			getImageSizeForSource(editor, xmlElem.value('src'), function(size) {
				if (size) {
					var compoundData = xmlElem.range(true);
					xmlElem.value('width', size.width);
					xmlElem.value('height', size.height, xmlElem.indexOf('width') + 1);

					actionUtils.compoundUpdate(editor, utils.extend(compoundData, {
						data: xmlElem.toString(),
						caret: offset
					}));
				}
			});
		}
	}

	/**
	 * Updates image size of CSS property
	 * @param {IEmmetEditor} editor
	 */
	function updateImageSizeCSS(editor) {
		var offset = editor.getCaretPos();

		// find tag from current caret position
		var info = editorUtils.outputInfo(editor);
		var cssRule = cssEditTree.parseFromPosition(info.content, offset, true);
		if (cssRule) {
			// check if there is property with image under caret
			var prop = cssRule.itemFromPosition(offset, true), m;
			if (prop && (m = /url\((["']?)(.+?)\1\)/i.exec(prop.value() || ''))) {
				getImageSizeForSource(editor, m[2], function(size) {
					if (size) {
						var compoundData = cssRule.range(true);
						cssRule.value('width', size.width + 'px');
						cssRule.value('height', size.height + 'px', cssRule.indexOf('width') + 1);

						actionUtils.compoundUpdate(editor, utils.extend(compoundData, {
							data: cssRule.toString(),
							caret: offset
						}));
					}
				});
			}
		}
	}

	/**
	 * Returns image dimensions for source
	 * @param {IEmmetEditor} editor
	 * @param {String} src Image source (path or data:url)
	 */
	function getImageSizeForSource(editor, src, callback) {
		var fileContent;
		if (src) {
			// check if it is data:url
			if (/^data:/.test(src)) {
				fileContent = base64.decode( src.replace(/^data\:.+?;.+?,/, '') );
				return callback(actionUtils.getImageSize(fileContent));
			}

			var filePath = editor.getFilePath();
			file.locateFile(filePath, src, function(absPath) {
				if (absPath === null) {
					throw "Can't find " + src + ' file';
				}

				file.read(absPath, function(err, content) {
					if (err) {
						throw 'Unable to read ' + absPath + ': ' + err;
					}

					content = String(content);
					callback(actionUtils.getImageSize(content));
				});
			});
		}
	}

	return {
		updateImageSizeAction: function(editor) {
			// this action will definitely won’t work in SASS dialect,
			// but may work in SCSS or LESS
			if (actionUtils.isSupportedCSS(editor.getSyntax())) {
				updateImageSizeCSS(editor);
			} else {
				updateImageSizeHTML(editor);
			}

			return true;
		}
	};
});
},{"../editTree/css":37,"../editTree/xml":38,"../plugin/file":63,"../utils/action":70,"../utils/base64":71,"../utils/common":73,"../utils/editor":75}],22:[function(require,module,exports){
/**
 * Update Tag action: allows users to update existing HTML tags and add/remove
 * attributes or even tag name
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var xmlEditTree = require('../editTree/xml');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var utils = require('../utils/common');
	var parser = require('../parser/abbreviation');

	function updateAttributes(tag, abbrNode, ix) {
		var classNames = (abbrNode.attribute('class') || '').split(/\s+/g);
		if (ix) {
			classNames.push('+' + abbrNode.name());
		}

		var r = function(str) {
			return utils.replaceCounter(str, abbrNode.counter);
		};

		// update class
		classNames.forEach(function(className) {
			if (!className) {
				return;
			}

			className = r(className);
			var ch = className.charAt(0);
			if (ch == '+') {
				tag.addClass(className.substr(1));
			} else if (ch == '-') {
				tag.removeClass(className.substr(1));
			} else {
				tag.value('class', className);
			}
		});

		// update attributes
		abbrNode.attributeList().forEach(function(attr) {
			if (attr.name.toLowerCase() == 'class') {
				return;
			}

			var ch = attr.name.charAt(0);
			if (ch == '+') {
				var attrName = attr.name.substr(1);
				var tagAttr = tag.get(attrName);
				if (tagAttr) {
					tagAttr.value(tagAttr.value() + r(attr.value));
				} else {
					tag.value(attrName, r(attr.value));
				}
			} else if (ch == '-') {
				tag.remove(attr.name.substr(1));
			} else {
				tag.value(attr.name, r(attr.value));
			}
		});
	}
	
	return {
		/**
		 * Matches HTML tag under caret and updates its definition
		 * according to given abbreviation
		 * @param {IEmmetEditor} Editor instance
		 * @param {String} abbr Abbreviation to update with
		 */
		updateTagAction: function(editor, abbr) {
			abbr = abbr || editor.prompt("Enter abbreviation");

			if (!abbr) {
				return false;
			}

			var content = editor.getContent();
			var ctx = actionUtils.captureContext(editor);
			var tag = this.getUpdatedTag(abbr, ctx, content);

			if (!tag) {
				// nothing to update
				return false;
			}

			// check if tag name was updated
			if (tag.name() != ctx.name && ctx.match.close) {
				editor.replaceContent('</' + tag.name() + '>', ctx.match.close.range.start, ctx.match.close.range.end, true);
			}

			editor.replaceContent(tag.source, ctx.match.open.range.start, ctx.match.open.range.end, true);
			return true;
		},

		/**
		 * Returns XMLEditContainer node with updated tag structure
		 * of existing tag context.
		 * This data can be used to modify existing tag
		 * @param  {String} abbr    Abbreviation
		 * @param  {Object} ctx     Tag to be updated (captured with `htmlMatcher`)
		 * @param  {String} content Original editor content
		 * @return {XMLEditContainer}
		 */
		getUpdatedTag: function(abbr, ctx, content, options) {
			if (!ctx) {
				// nothing to update
				return null;
			}

			var tree = parser.parse(abbr, options || {});

			// for this action some characters in abbreviation has special
			// meaning. For example, `.-c2` means “remove `c2` class from
			// element” and `.+c3` means “append class `c3` to exising one.
			// 
			// But `.+c3` abbreviation will actually produce two elements:
			// <div class=""> and <c3>. Thus, we have to walk on each element
			// of parsed tree and use their definitions to update current element
			var tag = xmlEditTree.parse(ctx.match.open.range.substring(content), {
				offset: ctx.match.outerRange.start
			});

			tree.children.forEach(function(node, i) {
				updateAttributes(tag, node, i);
			});

			// if tag name was resolved by implicit tag name resolver,
			// then user omitted it in abbreviation and wants to keep
			// original tag name
			var el = tree.children[0];
			if (!el.data('nameResolved')) {
				tag.name(el.name());
			}

			return tag;
		}
	};
});
},{"../editTree/xml":38,"../parser/abbreviation":55,"../utils/action":70,"../utils/common":73,"../utils/editor":75}],23:[function(require,module,exports){
/**
 * Action that wraps content with abbreviation. For convenience, action is 
 * defined as reusable module
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var range = require('../assets/range');
	var htmlMatcher = require('../assets/htmlMatcher');
	var utils = require('../utils/common');
	var editorUtils = require('../utils/editor');
	var actionUtils = require('../utils/action');
	var parser = require('../parser/abbreviation');
	
	return {
		/**
		 * Wraps content with abbreviation
		 * @param {IEmmetEditor} Editor instance
		 * @param {String} abbr Abbreviation to wrap with
		 * @param {String} syntax Syntax type (html, css, etc.)
		 * @param {String} profile Output profile name (html, xml, xhtml)
		 */
		wrapWithAbbreviationAction: function(editor, abbr, syntax, profile) {
			var info = editorUtils.outputInfo(editor, syntax, profile);
			abbr = abbr || editor.prompt("Enter abbreviation");
			
			if (!abbr) {
				return null;
			}
			
			abbr = String(abbr);
			
			var r = range(editor.getSelectionRange());
			
			if (!r.length()) {
				// no selection, find tag pair
				var match = htmlMatcher.tag(info.content, r.start);
				if (!match) {  // nothing to wrap
					return false;
				}
				
				r = utils.narrowToNonSpace(info.content, match.range);
			}
			
			var newContent = utils.escapeText(r.substring(info.content));
			var result = parser.expand(abbr, {
				pastedContent: editorUtils.unindent(editor, newContent),
				syntax: info.syntax,
				profile: info.profile,
				contextNode: actionUtils.captureContext(editor)
			});
			
			if (result) {
				editor.replaceContent(result, r.start, r.end);
				return true;
			}
			
			return false;
		}
	};
});
},{"../assets/htmlMatcher":27,"../assets/range":31,"../parser/abbreviation":55,"../utils/action":70,"../utils/common":73,"../utils/editor":75}],24:[function(require,module,exports){
/**
 * Parsed resources (snippets, abbreviations, variables, etc.) for Emmet.
 * Contains convenient method to get access for snippets with respect of
 * inheritance. Also provides ability to store data in different vocabularies
 * ('system' and 'user') for fast and safe resource update
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var prefs = require('./preferences');
	var utils = require('../utils/common');

	prefs.define('caniuse.enabled', true, 'Enable support of Can I Use database. When enabled,\
		CSS abbreviation resolver will look at Can I Use database first before detecting\
		CSS properties that should be resolved');

	prefs.define('caniuse.vendors', 'all', 'A comma-separated list vendor identifiers\
		(as described in Can I Use database) that should be supported\
		when resolving vendor-prefixed properties. Set value to <code>all</code>\
		to support all available properties');

	prefs.define('caniuse.era', 'e-2', 'Browser era, as defined in Can I Use database.\
		Examples: <code>e0</code> (current version), <code>e1</code> (near future)\
		<code>e-2</code> (2 versions back) and so on.');

	var cssSections = {
		'border-image': ['border-image'],
		'css-boxshadow': ['box-shadow'],
		'css3-boxsizing': ['box-sizing'],
		'multicolumn': ['column-width', 'column-count', 'columns', 'column-gap', 'column-rule-color', 'column-rule-style', 'column-rule-width', 'column-rule', 'column-span', 'column-fill'],
		'border-radius': ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
		'transforms2d': ['transform'],
		'css-hyphens': ['hyphens'],
		'css-transitions': ['transition', 'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
		'font-feature': ['font-feature-settings'],
		'css-animation': ['animation', 'animation-name', 'animation-duration', 'animation-timing-function', 'animation-iteration-count', 'animation-direction', 'animation-play-state', 'animation-delay', 'animation-fill-mode', '@keyframes'],
		'css-gradients': ['linear-gradient'],
		'css-masks': ['mask-image', 'mask-source-type', 'mask-repeat', 'mask-position', 'mask-clip', 'mask-origin', 'mask-size', 'mask', 'mask-type', 'mask-box-image-source', 'mask-box-image-slice', 'mask-box-image-width', 'mask-box-image-outset', 'mask-box-image-repeat', 'mask-box-image', 'clip-path', 'clip-rule'],
		'css-featurequeries': ['@supports'],
		'flexbox': ['flex', 'inline-flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'order', 'flex'],
		'calc': ['calc'],
		'object-fit': ['object-fit', 'object-position'],
		'css-grid': ['grid', 'inline-grid', 'grid-template-rows', 'grid-template-columns', 'grid-template-areas', 'grid-template', 'grid-auto-rows', 'grid-auto-columns', ' grid-auto-flow', 'grid-auto-position', 'grid', ' grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end', 'grid-column', 'grid-row', 'grid-area', 'justify-self', 'justify-items', 'align-self', 'align-items'],
		'css-repeating-gradients': ['repeating-linear-gradient'],
		'css-filters': ['filter'],
		'user-select-none': ['user-select'],
		'intrinsic-width': ['min-content', 'max-content', 'fit-content', 'fill-available'],
		'css3-tabsize': ['tab-size']
	};

	/** @type {Object} The Can I Use database for CSS */
	var cssDB = null;
	/** @type {Object} A list of available vendors (browsers) and their prefixes */
	var vendorsDB = null;
	var erasDB = null;

	function intersection(arr1, arr2) {
		var result = [];
		var smaller = arr1, larger = arr2;
		if (smaller.length > larger.length) {
			smaller = arr2;
			larger = arr1;
		}
		larger.forEach(function(item) {
			if (~smaller.indexOf(item)) {
				result.push(item);
			}
		});
		return result;
	}

	/**
	 * Parses raw Can I Use database for better lookups
	 * @param  {String} data Raw database
	 * @param  {Boolean} optimized Pass `true` if given `data` is already optimized
	 * @return {Object}
	 */
	function parseDB(data, optimized) {
		if (typeof data == 'string') {
			data = JSON.parse(data);
		}

		if (!optimized) {
			data = optimize(data);
		}

		vendorsDB = data.vendors;
		cssDB = data.css;
		erasDB = data.era;
	}

	/**
	 * Extract required data only from CIU database
	 * @param  {Object} data Raw Can I Use database
	 * @return {Object}      Optimized database
	 */
	function optimize(data) {
		if (typeof data == 'string') {
			data = JSON.parse(data);
		}

		return {
			vendors: parseVendors(data),
			css: parseCSS(data),
			era: parseEra(data)
		};
	}

	/**
	 * Parses vendor data
	 * @param  {Object} data
	 * @return {Object}
	 */
	function parseVendors(data) {
		var out = {};
		Object.keys(data.agents).forEach(function(name) {
			var agent = data.agents[name];
			out[name] = {
				prefix: agent.prefix,
				versions: agent.versions
			};
		});
		return out;
	}

	/**
	 * Parses CSS data from Can I Use raw database
	 * @param  {Object} data
	 * @return {Object}
	 */
	function parseCSS(data) {
		var out = {};
		var cssCategories = data.cats.CSS;
		Object.keys(data.data).forEach(function(name) {
			var section = data.data[name];
			if (name in cssSections) {
				cssSections[name].forEach(function(kw) {
					out[kw] = section.stats;
				});
			}
		});

		return out;
	}

	/**
	 * Parses era data from Can I Use raw database
	 * @param  {Object} data
	 * @return {Array}
	 */
	function parseEra(data) {
		// some runtimes (like Mozilla Rhino) does not preserves
		// key order so we have to sort values manually
		return Object.keys(data.eras).sort(function(a, b) {
			return parseInt(a.substr(1)) - parseInt(b.substr(1));
		});
	}

	/**
	 * Returs list of supported vendors, depending on user preferences
	 * @return {Array}
	 */
	function getVendorsList() {
		var allVendors = Object.keys(vendorsDB);
		var vendors = prefs.getArray('caniuse.vendors');
		if (!vendors || vendors[0] == 'all') {
			return allVendors;
		}

		return intersection(allVendors, vendors);
	}

	/**
	 * Returns size of version slice as defined by era identifier
	 * @return {Number}
	 */
	function getVersionSlice() {
		var era = prefs.get('caniuse.era');
		var ix = erasDB.indexOf(era);
		if (!~ix) {
			ix = erasDB.indexOf('e-2');
		}

		return ix;
	}

	// try to load caniuse database
	// hide it from Require.JS parser
	var db = null;
	(function(r) {
		if (typeof define === 'undefined' || !define.amd) {
			try {
				db = r('caniuse-db/data.json');
			} catch(e) {}
		}
	})(require);

	if (db) {
		parseDB(db);
	}

	return {
		load: parseDB,
		optimize: optimize,

		/**
		 * Resolves prefixes for given property
		 * @param {String} property A property to resolve. It can start with `@` symbol
		 * (CSS section, like `@keyframes`) or `:` (CSS value, like `flex`)
		 * @return {Array} Array of resolved prefixes or <code>null</code>
		 * if prefixes can't be resolved. Empty array means property has no vendor
		 * prefixes
		 */
		resolvePrefixes: function(property) {
			if (!prefs.get('caniuse.enabled') || !cssDB || !(property in cssDB)) {
				return null;
			}

			var prefixes = [];
			var propStats = cssDB[property];
			var versions = getVersionSlice();

			getVendorsList().forEach(function(vendor) {
				var vendorVesions = vendorsDB[vendor].versions.slice(versions);
				for (var i = 0, v; i < vendorVesions.length; i++) {
					v = vendorVesions[i];
					if (!v) {
						continue;
					}

					if (~propStats[vendor][v].indexOf('x')) {
						prefixes.push(vendorsDB[vendor].prefix);
						break;
					}
				}
			});

			return utils.unique(prefixes).sort(function(a, b) {
				return b.length - a.length;
			});
		}
	};
});

},{"../utils/common":73,"./preferences":29}],25:[function(require,module,exports){
/**
 * Module that contains factories for element types used by Emmet
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var factories = {};
	var reAttrs = /([@\!]?)([\w\-:]+)\s*=\s*(['"])(.*?)\3/g;

	// register resource references
	function commonFactory(value) {
		return {data: value};
	}

	module = module || {};
	module.exports = {
		/**
		 * Create new element factory
		 * @param {String} name Element identifier
		 * @param {Function} factory Function that produces element of specified 
		 * type. The object generated by this factory is automatically 
		 * augmented with <code>type</code> property pointing to element
		 * <code>name</code>
		 * @memberOf elements
		 */
		add: function(name, factory) {
			var that = this;
			factories[name] = function() {
				var elem = factory.apply(that, arguments);
				if (elem)
					elem.type = name;
				
				return elem;
			};
		},
		
		/**
		 * Returns factory for specified name
		 * @param {String} name
		 * @returns {Function}
		 */
		get: function(name) {
			return factories[name];
		},
		
		/**
		 * Creates new element with specified type
		 * @param {String} name
		 * @returns {Object}
		 */
		create: function(name) {
			var args = [].slice.call(arguments, 1);
			var factory = this.get(name);
			return factory ? factory.apply(this, args) : null;
		},
		
		/**
		 * Check if passed element is of specified type
		 * @param {Object} elem
		 * @param {String} type
		 * @returns {Boolean}
		 */
		is: function(elem, type) {
			return this.type(elem) === type;
		},

		/**
		 * Returns type of element
		 * @param  {Object} elem
		 * @return {String}
		 */
		type: function(elem) {
			return elem && elem.type;
		}
	};
	
	/**
	 * Element factory
	 * @param {String} elementName Name of output element
	 * @param {String} attrs Attributes definition. You may also pass
	 * <code>Array</code> where each contains object with <code>name</code> 
	 * and <code>value</code> properties, or <code>Object</code>
	 * @param {Boolean} isEmpty Is expanded element should be empty
	 */
	module.exports.add('element', function(elementName, attrs, isEmpty) {
		var ret = {
			name: elementName,
			is_empty: !!isEmpty
		};

		if (attrs) {
			ret.attributes = [];
			if (Array.isArray(attrs)) {
				ret.attributes = attrs;
			} else if (typeof attrs === 'string') {
				var m;
				while ((m = reAttrs.exec(attrs))) {
					ret.attributes.push({
						name: m[2],
						value: m[4],
						isDefault: m[1] == '@',
						isImplied: m[1] == '!'
					});
				}
			} else {
				ret.attributes = Object.keys(attrs).map(function(name) {
					return {
						name: name, 
						value: attrs[name]
					};
				});
			}
		}
		
		return ret;
	});
	
	module.exports.add('snippet', commonFactory);
	module.exports.add('reference', commonFactory);
	module.exports.add('empty', function() {
		return {};
	});
	
	return module.exports;
});
},{}],26:[function(require,module,exports){
/**
 * Utility module that provides ordered storage of function handlers. 
 * Many Emmet modules' functionality can be extended/overridden by custom
 * function. This modules provides unified storage of handler functions, their 
 * management and execution
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	
	/**
	 * @type HandlerList
	 * @constructor
	 */
	function HandlerList() {
		this._list = [];
	}
	
	HandlerList.prototype = {
		/**
		 * Adds function handler
		 * @param {Function} fn Handler
		 * @param {Object} options Handler options. Possible values are:<br><br>
		 * <b>order</b> : (<code>Number</code>) – order in handler list. Handlers
		 * with higher order value will be executed earlier.
		 */
		add: function(fn, options) {
			// TODO hack for stable sort, remove after fixing `list()`
			var order = this._list.length;
			if (options && 'order' in options) {
				order = options.order * 10000;
			}
			this._list.push(utils.extend({}, options, {order: order, fn: fn}));
		},
		
		/**
		 * Removes handler from list
		 * @param {Function} fn
		 */
		remove: function(fn) {
			var item = utils.find(this._list, function(item) {
				return item.fn === fn;
			});
			if (item) {
				this._list.splice(this._list.indexOf(item), 1);
			}
		},
		
		/**
		 * Returns ordered list of handlers. By default, handlers 
		 * with the same <code>order</code> option returned in reverse order, 
		 * i.e. the latter function was added into the handlers list, the higher 
		 * it will be in the returned array 
		 * @returns {Array}
		 */
		list: function() {
			// TODO make stable sort
			return this._list.sort(function(a, b) {
				return b.order - a.order;
			});
		},
		
		/**
		 * Returns ordered list of handler functions
		 * @returns {Array}
		 */
		listFn: function() {
			return this.list().map(function(item) {
				return item.fn;
			});
		},
		
		/**
		 * Executes handler functions in their designated order. If function
		 * returns <code>skipVal</code>, meaning that function was unable to 
		 * handle passed <code>args</code>, the next function will be executed
		 * and so on.
		 * @param {Object} skipValue If function returns this value, execute 
		 * next handler.
		 * @param {Array} args Arguments to pass to handler function
		 * @returns {Boolean} Whether any of registered handlers performed
		 * successfully  
		 */
		exec: function(skipValue, args) {
			args = args || [];
			var result = null;
			utils.find(this.list(), function(h) {
				result = h.fn.apply(h, args);
				if (result !== skipValue) {
					return true;
				}
			});
			
			return result;
		}
	};
	
	return {
		/**
		 * Factory method that produces <code>HandlerList</code> instance
		 * @returns {HandlerList}
		 * @memberOf handlerList
		 */
		create: function() {
			return new HandlerList();
		}
	};
});
},{"../utils/common":73}],27:[function(require,module,exports){
/**
 * HTML matcher: takes string and searches for HTML tag pairs for given position 
 * 
 * Unlike “classic” matchers, it parses content from the specified 
 * position, not from the start, so it may work even outside HTML documents
 * (for example, inside strings of programming languages like JavaScript, Python 
 * etc.)
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var range = require('./range');

	// Regular Expressions for parsing tags and attributes
	var reOpenTag = /^<([\w\:\-]+)((?:\s+[\w\-:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
	var reCloseTag = /^<\/([\w\:\-]+)[^>]*>/;

	function openTag(i, match) {
		return {
			name: match[1],
			selfClose: !!match[3],
			/** @type Range */
			range: range(i, match[0]),
			type: 'open'
		};
	}
	
	function closeTag(i, match) {
		return {
			name: match[1],
			/** @type Range */
			range: range(i, match[0]),
			type: 'close'
		};
	}
	
	function comment(i, match) {
		return {
			/** @type Range */
			range: range(i, typeof match == 'number' ? match - i : match[0]),
			type: 'comment'
		};
	}
	
	/**
	 * Creates new tag matcher session
	 * @param {String} text
	 */
	function createMatcher(text) {
		var memo = {}, m;
		return {
			/**
			 * Test if given position matches opening tag
			 * @param {Number} i
			 * @returns {Object} Matched tag object
			 */
			open: function(i) {
				var m = this.matches(i);
				return m && m.type == 'open' ? m : null;
			},
			
			/**
			 * Test if given position matches closing tag
			 * @param {Number} i
			 * @returns {Object} Matched tag object
			 */
			close: function(i) {
				var m = this.matches(i);
				return m && m.type == 'close' ? m : null;
			},
			
			/**
			 * Matches either opening or closing tag for given position
			 * @param i
			 * @returns
			 */
			matches: function(i) {
				var key = 'p' + i;
				
				if (!(key in memo)) {
					memo[key] = false;
					if (text.charAt(i) == '<') {
						var substr = text.slice(i);
						if ((m = substr.match(reOpenTag))) {
							memo[key] = openTag(i, m);
						} else if ((m = substr.match(reCloseTag))) {
							memo[key] = closeTag(i, m);
						}
					}
				}
				
				return memo[key];
			},
			
			/**
			 * Returns original text
			 * @returns {String}
			 */
			text: function() {
				return text;
			},

			clean: function() {
				memo = text = m = null;
			}
		};
	}
	
	function matches(text, pos, pattern) {
		return text.substring(pos, pos + pattern.length) == pattern;
	}
	
	/**
	 * Search for closing pair of opening tag
	 * @param {Object} open Open tag instance
	 * @param {Object} matcher Matcher instance
	 */
	function findClosingPair(open, matcher) {
		var stack = [], tag = null;
		var text = matcher.text();
		
		for (var pos = open.range.end, len = text.length; pos < len; pos++) {
			if (matches(text, pos, '<!--')) {
				// skip to end of comment
				for (var j = pos; j < len; j++) {
					if (matches(text, j, '-->')) {
						pos = j + 3;
						break;
					}
				}
			}
			
			if ((tag = matcher.matches(pos))) {
				if (tag.type == 'open' && !tag.selfClose) {
					stack.push(tag.name);
				} else if (tag.type == 'close') {
					if (!stack.length) { // found valid pair?
						return tag.name == open.name ? tag : null;
					}
					
					// check if current closing tag matches previously opened one
					if (stack[stack.length - 1] == tag.name) {
						stack.pop();
					} else {
						var found = false;
						while (stack.length && !found) {
							var last = stack.pop();
							if (last == tag.name) {
								found = true;
							}
						}
						
						if (!stack.length && !found) {
							return tag.name == open.name ? tag : null;
						}
					}
				}

				pos = tag.range.end - 1;
			}
		}
	}
	
	return {
		/**
		 * Main function: search for tag pair in <code>text</code> for given 
		 * position
		 * @memberOf htmlMatcher
		 * @param {String} text 
		 * @param {Number} pos
		 * @returns {Object}
		 */
		find: function(text, pos) {
			var matcher = createMatcher(text); 
			var open = null, close = null;
			var j, jl;
			
			for (var i = pos; i >= 0; i--) {
				if ((open = matcher.open(i))) {
					// found opening tag
					if (open.selfClose) {
						if (open.range.cmp(pos, 'lt', 'gt')) {
							// inside self-closing tag, found match
							break;
						}
						
						// outside self-closing tag, continue
						continue;
					}
					
					close = findClosingPair(open, matcher);
					if (close) {
						// found closing tag.
						var r = range.create2(open.range.start, close.range.end);
						if (r.contains(pos)) {
							break;
						}
					} else if (open.range.contains(pos)) {
						// we inside empty HTML tag like <br>
						break;
					}
					
					open = null;
				} else if (matches(text, i, '-->')) {
					// skip back to comment start
					for (j = i - 1; j >= 0; j--) {
						if (matches(text, j, '-->')) {
							// found another comment end, do nothing
							break;
						} else if (matches(text, j, '<!--')) {
							i = j;
							break;
						}
					}
				} else if (matches(text, i, '<!--')) {
					// we're inside comment, match it
					for (j = i + 4, jl = text.length; j < jl; j++) {
						if (matches(text, j, '-->')) {
							j += 3;
							break;
						}
					}
					
					open = comment(i, j);
					break;
				}
			}
			
			matcher.clean();

			if (open) {
				var outerRange = null;
				var innerRange = null;
				
				if (close) {
					outerRange = range.create2(open.range.start, close.range.end);
					innerRange = range.create2(open.range.end, close.range.start);
				} else {
					outerRange = innerRange = range.create2(open.range.start, open.range.end);
				}
				
				if (open.type == 'comment') {
					// adjust positions of inner range for comment
					var _c = outerRange.substring(text);
					innerRange.start += _c.length - _c.replace(/^<\!--\s*/, '').length;
					innerRange.end -= _c.length - _c.replace(/\s*-->$/, '').length;
				}
				
				return {
					open: open,
					close: close,
					type: open.type == 'comment' ? 'comment' : 'tag',
					innerRange: innerRange,
					innerContent: function() {
						return this.innerRange.substring(text);
					},
					outerRange: outerRange,
					outerContent: function() {
						return this.outerRange.substring(text);
					},
					range: !innerRange.length() || !innerRange.cmp(pos, 'lte', 'gte') ? outerRange : innerRange,
					content: function() {
						return this.range.substring(text);
					},
					source: text
				};
			}
		},
		
		/**
		 * The same as <code>find()</code> method, but restricts matched result 
		 * to <code>tag</code> type
		 * @param {String} text 
		 * @param {Number} pos
		 * @returns {Object}
		 */
		tag: function(text, pos) {
			var result = this.find(text, pos);
			if (result && result.type == 'tag') {
				return result;
			}
		}
	};
});
},{"./range":31}],28:[function(require,module,exports){
/**
 * Simple logger for Emmet
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	return {
		log: function() {
			if (typeof console != 'undefined' && console.log) {
				console.log.apply(console, arguments);
			}
		}
	}
})
},{}],29:[function(require,module,exports){
/**
 * Common module's preferences storage. This module 
 * provides general storage for all module preferences, their description and
 * default values.<br><br>
 * 
 * This module can also be used to list all available properties to create 
 * UI for updating properties
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');

	var preferences = {};
	var defaults = {};
	var _dbgDefaults = null;
	var _dbgPreferences = null;

	function toBoolean(val) {
		if (typeof val === 'string') {
			val = val.toLowerCase();
			return val == 'yes' || val == 'true' || val == '1';
		}

		return !!val;
	}
	
	function isValueObj(obj) {
		return typeof obj === 'object'
			&& !Array.isArray(obj) 
			&& 'value' in obj 
			&& Object.keys(obj).length < 3;
	}
	
	return {
		/**
		 * Creates new preference item with default value
		 * @param {String} name Preference name. You can also pass object
		 * with many options
		 * @param {Object} value Preference default value
		 * @param {String} description Item textual description
		 * @memberOf preferences
		 */
		define: function(name, value, description) {
			var prefs = name;
			if (typeof name === 'string') {
				prefs = {};
				prefs[name] = {
					value: value,
					description: description
				};
			}
			
			Object.keys(prefs).forEach(function(k) {
				var v = prefs[k];
				defaults[k] = isValueObj(v) ? v : {value: v};
			});
		},
		
		/**
		 * Updates preference item value. Preference value should be defined
		 * first with <code>define</code> method.
		 * @param {String} name Preference name. You can also pass object
		 * with many options
		 * @param {Object} value Preference default value
		 * @memberOf preferences
		 */
		set: function(name, value) {
			var prefs = name;
			if (typeof name === 'string') {
				prefs = {};
				prefs[name] = value;
			}
			
			Object.keys(prefs).forEach(function(k) {
				var v = prefs[k];
				if (!(k in defaults)) {
					throw new Error('Property "' + k + '" is not defined. You should define it first with `define` method of current module');
				}
				
				// do not set value if it equals to default value
				if (v !== defaults[k].value) {
					// make sure we have value of correct type
					switch (typeof defaults[k].value) {
						case 'boolean':
							v = toBoolean(v);
							break;
						case 'number':
							v = parseInt(v + '', 10) || 0;
							break;
						default: // convert to string
							if (v !== null) {
								v += '';
							}
					}

					preferences[k] = v;
				} else if (k in preferences) {
					delete preferences[k];
				}
			});
		},
		
		/**
		 * Returns preference value
		 * @param {String} name
		 * @returns {String} Returns <code>undefined</code> if preference is 
		 * not defined
		 */
		get: function(name) {
			if (name in preferences) {
				return preferences[name];
			}
			
			if (name in defaults) {
				return defaults[name].value;
			}
			
			return void 0;
		},
		
		/**
		 * Returns comma-separated preference value as array of values
		 * @param {String} name
		 * @returns {Array} Returns <code>undefined</code> if preference is 
		 * not defined, <code>null</code> if string cannot be converted to array
		 */
		getArray: function(name) {
			var val = this.get(name);
			if (typeof val === 'undefined' || val === null || val === '')  {
				return null;
			}

			val = val.split(',').map(utils.trim);
			if (!val.length) {
				return null;
			}
			
			return val;
		},
		
		/**
		 * Returns comma and colon-separated preference value as dictionary
		 * @param {String} name
		 * @returns {Object}
		 */
		getDict: function(name) {
			var result = {};
			this.getArray(name).forEach(function(val) {
				var parts = val.split(':');
				result[parts[0]] = parts[1];
			});
			
			return result;
		},
		
		/**
		 * Returns description of preference item
		 * @param {String} name Preference name
		 * @returns {Object}
		 */
		description: function(name) {
			return name in defaults ? defaults[name].description : void 0;
		},
		
		/**
		 * Completely removes specified preference(s)
		 * @param {String} name Preference name (or array of names)
		 */
		remove: function(name) {
			if (!Array.isArray(name)) {
				name = [name];
			}
			
			name.forEach(function(key) {
				if (key in preferences) {
					delete preferences[key];
				}
				
				if (key in defaults) {
					delete defaults[key];
				}
			});
		},
		
		/**
		 * Returns sorted list of all available properties
		 * @returns {Array}
		 */
		list: function() {
			return Object.keys(defaults).sort().map(function(key) {
				return {
					name: key,
					value: this.get(key),
					type: typeof defaults[key].value,
					description: defaults[key].description
				};
			}, this);
		},
		
		/**
		 * Loads user-defined preferences from JSON
		 * @param {Object} json
		 * @returns
		 */
		load: function(json) {
			Object.keys(json).forEach(function(key) {
				this.set(key, json[key]);
			}, this);
		},

		/**
		 * Returns hash of user-modified preferences
		 * @returns {Object}
		 */
		exportModified: function() {
			return utils.extend({}, preferences);
		},
		
		/**
		 * Reset to defaults
		 * @returns
		 */
		reset: function() {
			preferences = {};
		},
		
		/**
		 * For unit testing: use empty storage
		 */
		_startTest: function() {
			_dbgDefaults = defaults;
			_dbgPreferences = preferences;
			defaults = {};
			preferences = {};
		},
		
		/**
		 * For unit testing: restore original storage
		 */
		_stopTest: function() {
			defaults = _dbgDefaults;
			preferences = _dbgPreferences;
		}
	};
});
},{"../utils/common":73}],30:[function(require,module,exports){
/**
 * Output profile module.
 * Profile defines how XHTML output data should look like
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var resources = require('./resources');
	var prefs = require('./preferences');

	prefs.define('profile.allowCompactBoolean', true, 
		'This option can be used to globally disable compact form of boolean ' + 
		'attribues (attributes where name and value are equal). With compact' +
		'form enabled, HTML tags can be outputted as <code>&lt;div contenteditable&gt;</code> ' +
		'instead of <code>&lt;div contenteditable="contenteditable"&gt;</code>');

	prefs.define('profile.booleanAttributes', '^contenteditable|seamless|async|autofocus|autoplay|checked|controls|defer|disabled|formnovalidate|hidden|ismap|loop|multiple|muted|novalidate|readonly|required|reversed|selected|typemustmatch$', 
		'A regular expression for attributes that should be boolean by default.' + 
		'If attribute name matches this expression, you don’t have to write dot ' +
		'after attribute name in Emmet abbreviation to mark it as boolean.');

	var profiles = {};
	
	var defaultProfile = {
		tag_case: 'asis',
		attr_case: 'asis',
		attr_quotes: 'double',
		
		// Each tag on new line
		tag_nl: 'decide',
		
		// With tag_nl === true, defines if leaf node (e.g. node with no children)
		// should have formatted line breaks
		tag_nl_leaf: false,
		
		place_cursor: true,
		
		// Indent tags
		indent: true,
		
		// How many inline elements should be to force line break 
		// (set to 0 to disable)
		inline_break: 3,

		// Produce compact notation of boolean attribues:
		// attributes where name and value are equal.
		// With this option enabled, HTML filter will
		// produce <div contenteditable> instead of <div contenteditable="contenteditable">
		compact_bool: false,
		
		// Use self-closing style for writing empty elements, e.g. <br /> or <br>
		self_closing_tag: 'xhtml',
		
		// Profile-level output filters, re-defines syntax filters 
		filters: '',
		
		// Additional filters applied to abbreviation.
		// Unlike "filters", this preference doesn't override default filters
		// but add the instead every time given profile is chosen
		extraFilters: ''
	};
	
	/**
	 * @constructor
	 * @type OutputProfile
	 * @param {Object} options
	 */
	function OutputProfile(options) {
		utils.extend(this, defaultProfile, options);
	}
	
	OutputProfile.prototype = {
		/**
		 * Transforms tag name case depending on current profile settings
		 * @param {String} name String to transform
		 * @returns {String}
		 */
		tagName: function(name) {
			return stringCase(name, this.tag_case);
		},
		
		/**
		 * Transforms attribute name case depending on current profile settings 
		 * @param {String} name String to transform
		 * @returns {String}
		 */
		attributeName: function(name) {
			return stringCase(name, this.attr_case);
		},
		
		/**
		 * Returns quote character for current profile
		 * @returns {String}
		 */
		attributeQuote: function() {
			return this.attr_quotes == 'single' ? "'" : '"';
		},

		/**
		 * Returns self-closing tag symbol for current profile
		 * @returns {String}
		 */
		selfClosing: function() {
			if (this.self_closing_tag == 'xhtml')
				return ' /';
			
			if (this.self_closing_tag === true)
				return '/';
			
			return '';
		},
		
		/**
		 * Returns cursor token based on current profile settings
		 * @returns {String}
		 */
		cursor: function() {
			return this.place_cursor ? utils.getCaretPlaceholder() : '';
		},

		/**
		 * Check if attribute with given name is boolean,
		 * e.g. written as `contenteditable` instead of 
		 * `contenteditable="contenteditable"`
		 * @param  {String}  name Attribute name
		 * @return {Boolean}
		 */
		isBoolean: function(name, value) {
			if (name == value) {
				return true;
			}

			var boolAttrs = prefs.get('profile.booleanAttributes');
			if (!value && boolAttrs) {
				boolAttrs = new RegExp(boolAttrs, 'i');
				return boolAttrs.test(name);
			}

			return false;
		},

		/**
		 * Check if compact boolean attribute record is 
		 * allowed for current profile
		 * @return {Boolean}
		 */
		allowCompactBoolean: function() {
			return this.compact_bool && prefs.get('profile.allowCompactBoolean');
		}
	};
	
	/**
	 * Helper function that converts string case depending on 
	 * <code>caseValue</code> 
	 * @param {String} str String to transform
	 * @param {String} caseValue Case value: can be <i>lower</i>, 
	 * <i>upper</i> and <i>leave</i>
	 * @returns {String}
	 */
	function stringCase(str, caseValue) {
		switch (String(caseValue || '').toLowerCase()) {
			case 'lower':
				return str.toLowerCase();
			case 'upper':
				return str.toUpperCase();
		}
		
		return str;
	}
	
	/**
	 * Creates new output profile
	 * @param {String} name Profile name
	 * @param {Object} options Profile options
	 */
	function createProfile(name, options) {
		return profiles[name.toLowerCase()] = new OutputProfile(options);
	}
	
	function createDefaultProfiles() {
		createProfile('xhtml');
		createProfile('html', {self_closing_tag: false, compact_bool: true});
		createProfile('xml', {self_closing_tag: true, tag_nl: true});
		createProfile('plain', {tag_nl: false, indent: false, place_cursor: false});
		createProfile('line', {tag_nl: false, indent: false, extraFilters: 's'});
		createProfile('css', {tag_nl: true});
		createProfile('css_line', {tag_nl: false});
	}
	
	createDefaultProfiles();
	
	return  {
		/**
		 * Creates new output profile and adds it into internal dictionary
		 * @param {String} name Profile name
		 * @param {Object} options Profile options
		 * @memberOf emmet.profile
		 * @returns {Object} New profile
		 */
		create: function(name, options) {
			if (arguments.length == 2)
				return createProfile(name, options);
			else
				// create profile object only
				return new OutputProfile(utils.defaults(name || {}, defaultProfile));
		},
		
		/**
		 * Returns profile by its name. If profile wasn't found, returns
		 * 'plain' profile
		 * @param {String} name Profile name. Might be profile itself
		 * @param {String} syntax. Optional. Current editor syntax. If defined,
		 * profile is searched in resources first, then in predefined profiles
		 * @returns {Object}
		 */
		get: function(name, syntax) {
			if (!name && syntax) {
				// search in user resources first
				var profile = resources.findItem(syntax, 'profile');
				if (profile) {
					name = profile;
				}
			}
			
			if (!name) {
				return profiles.plain;
			}
			
			if (name instanceof OutputProfile) {
				return name;
			}
			
			if (typeof name === 'string' && name.toLowerCase() in profiles) {
				return profiles[name.toLowerCase()];
			}
			
			return this.create(name);
		},
		
		/**
		 * Deletes profile with specified name
		 * @param {String} name Profile name
		 */
		remove: function(name) {
			name = (name || '').toLowerCase();
			if (name in profiles)
				delete profiles[name];
		},
		
		/**
		 * Resets all user-defined profiles
		 */
		reset: function() {
			profiles = {};
			createDefaultProfiles();
		},
		
		/**
		 * Helper function that converts string case depending on 
		 * <code>caseValue</code> 
		 * @param {String} str String to transform
		 * @param {String} caseValue Case value: can be <i>lower</i>, 
		 * <i>upper</i> and <i>leave</i>
		 * @returns {String}
		 */
		stringCase: stringCase
	};
});

},{"../utils/common":73,"./preferences":29,"./resources":32}],31:[function(require,module,exports){
/**
 * Helper module to work with ranges
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	function cmp(a, b, op) {
		switch (op) {
			case 'eq':
			case '==':
				return a === b;
			case 'lt':
			case '<':
				return a < b;
			case 'lte':
			case '<=':
				return a <= b;
			case 'gt':
			case '>':
				return a > b;
			case 'gte':
			case '>=':
				return a >= b;
		}
	}
	
	
	/**
	 * @type Range
	 * @constructor
	 * @param {Object} start
	 * @param {Number} len
	 */
	function Range(start, len) {
		if (typeof start === 'object' && 'start' in start) {
			// create range from object stub
			this.start = Math.min(start.start, start.end);
			this.end = Math.max(start.start, start.end);
		} else if (Array.isArray(start)) {
			this.start = start[0];
			this.end = start[1];
		} else {
			len = typeof len === 'string' ? len.length : +len;
			this.start = start;
			this.end = start + len;
		}
	}
	
	Range.prototype = {
		length: function() {
			return Math.abs(this.end - this.start);
		},
		
		/**
		 * Returns <code>true</code> if passed range is equals to current one
		 * @param {Range} range
		 * @returns {Boolean}
		 */
		equal: function(range) {
			return this.cmp(range, 'eq', 'eq');
//			return this.start === range.start && this.end === range.end;
		},
		
		/**
		 * Shifts indexes position with passed <code>delta</code>
		 * @param {Number} delta
		 * @returns {Range} range itself
		 */
		shift: function(delta) {
			this.start += delta;
			this.end += delta;
			return this;
		},
		
		/**
		 * Check if two ranges are overlapped
		 * @param {Range} range
		 * @returns {Boolean}
		 */
		overlap: function(range) {
			return range.start <= this.end && range.end >= this.start;
		},
		
		/**
		 * Finds intersection of two ranges
		 * @param {Range} range
		 * @returns {Range} <code>null</code> if ranges does not overlap
		 */
		intersection: function(range) {
			if (this.overlap(range)) {
				var start = Math.max(range.start, this.start);
				var end = Math.min(range.end, this.end);
				return new Range(start, end - start);
			}
			
			return null;
		},
		
		/**
		 * Returns the union of the thow ranges.
		 * @param {Range} range
		 * @returns {Range} <code>null</code> if ranges are not overlapped
		 */
		union: function(range) {
			if (this.overlap(range)) {
				var start = Math.min(range.start, this.start);
				var end = Math.max(range.end, this.end);
				return new Range(start, end - start);
			}
			
			return null;
		},
		
		/**
		 * Returns a Boolean value that indicates whether a specified position 
		 * is in a given range.
		 * @param {Number} loc
		 */
		inside: function(loc) {
			return this.cmp(loc, 'lte', 'gt');
//			return this.start <= loc && this.end > loc;
		},
		
		/**
		 * Returns a Boolean value that indicates whether a specified position 
		 * is in a given range, but not equals bounds.
		 * @param {Number} loc
		 */
		contains: function(loc) {
			return this.cmp(loc, 'lt', 'gt');
		},
		
		/**
		 * Check if current range completely includes specified one
		 * @param {Range} r
		 * @returns {Boolean} 
		 */
		include: function(r) {
			return this.cmp(r, 'lte', 'gte');
//			return this.start <= r.start && this.end >= r.end;
		},
		
		/**
		 * Low-level comparision method
		 * @param {Number} loc
		 * @param {String} left Left comparison operator
		 * @param {String} right Right comaprison operator
		 */
		cmp: function(loc, left, right) {
			var a, b;
			if (loc instanceof Range) {
				a = loc.start;
				b = loc.end;
			} else {
				a = b = loc;
			}
			
			return cmp(this.start, a, left || '<=') && cmp(this.end, b, right || '>');
		},
		
		/**
		 * Returns substring of specified <code>str</code> for current range
		 * @param {String} str
		 * @returns {String}
		 */
		substring: function(str) {
			return this.length() > 0 
				? str.substring(this.start, this.end) 
				: '';
		},
		
		/**
		 * Creates copy of current range
		 * @returns {Range}
		 */
		clone: function() {
			return new Range(this.start, this.length());
		},
		
		/**
		 * @returns {Array}
		 */
		toArray: function() {
			return [this.start, this.end];
		},
		
		toString: function() {
			return this.valueOf();
		},

		valueOf: function() {
			return '{' + this.start + ', ' + this.length() + '}';
		}
	};

	/**
	 * Creates new range object instance
	 * @param {Object} start Range start or array with 'start' and 'end'
	 * as two first indexes or object with 'start' and 'end' properties
	 * @param {Number} len Range length or string to produce range from
	 * @returns {Range}
	 */
	module.exports = function(start, len) {
		if (typeof start == 'undefined' || start === null)
			return null;
			
		if (start instanceof Range)
			return start;
		
		if (typeof start == 'object' && 'start' in start && 'end' in start) {
			len = start.end - start.start;
			start = start.start;
		}
			
		return new Range(start, len);
	};

	module.exports.create = module.exports;

	module.exports.isRange = function(val) {
		return val instanceof Range;
	};

	/**
	 * <code>Range</code> object factory, the same as <code>this.create()</code>
	 * but last argument represents end of range, not length
	 * @returns {Range}
	 */
	module.exports.create2 = function(start, end) {
		if (typeof start === 'number' && typeof end === 'number') {
			end -= start;
		}
		
		return this.create(start, end);
	};

	/**
	 * Helper function that sorts ranges in order as they
	 * appear in text
	 * @param  {Array} ranges
	 * @return {Array}
	 */
	module.exports.sort = function(ranges, reverse) {
		ranges = ranges.sort(function(a, b) {
			if (a.start === b.start) {
				return b.end - a.end;
			}

			return a.start - b.start;
		});

		reverse && ranges.reverse();
		return ranges;
	};

	return module.exports;
});
},{}],32:[function(require,module,exports){
/**
 * Parsed resources (snippets, abbreviations, variables, etc.) for Emmet.
 * Contains convenient method to get access for snippets with respect of
 * inheritance. Also provides ability to store data in different vocabularies
 * ('system' and 'user') for fast and safe resource update
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var handlerList = require('./handlerList');
	var utils = require('../utils/common');
	var elements = require('./elements');
	var logger = require('../assets/logger');
	var stringScore = require('../vendor/stringScore');
	var cssResolver = require('../resolver/css');

	var VOC_SYSTEM = 'system';
	var VOC_USER = 'user';

	var cache = {};

	/** Regular expression for XML tag matching */
	var reTag = /^<(\w+\:?[\w\-]*)((?:\s+[@\!]?[\w\:\-]+\s*=\s*(['"]).*?\3)*)\s*(\/?)>/;

	var systemSettings = {};
	var userSettings = {};

	/** @type HandlerList List of registered abbreviation resolvers */
	var resolvers = handlerList.create();

	function each(obj, fn) {
		if (!obj) {
			return;
		}

		Object.keys(obj).forEach(function(key) {
			fn(obj[key], key);
		});
	}

	/**
	 * Normalizes caret plceholder in passed text: replaces | character with
	 * default caret placeholder
	 * @param {String} text
	 * @returns {String}
	 */
	function normalizeCaretPlaceholder(text) {
		return utils.replaceUnescapedSymbol(text, '|', utils.getCaretPlaceholder());
	}

	function parseItem(name, value, type) {
		value = normalizeCaretPlaceholder(value);

		if (type == 'snippets') {
			return elements.create('snippet', value);
		}

		if (type == 'abbreviations') {
			return parseAbbreviation(name, value);
		}
	}

	/**
	 * Parses single abbreviation
	 * @param {String} key Abbreviation name
	 * @param {String} value Abbreviation value
	 * @return {Object}
	 */
	function parseAbbreviation(key, value) {
		key = utils.trim(key);
		var m;
		if ((m = reTag.exec(value))) {
			return elements.create('element', m[1], m[2], m[4] == '/');
		} else {
			// assume it's reference to another abbreviation
			return elements.create('reference', value);
		}
	}

	/**
	 * Normalizes snippet key name for better fuzzy search
	 * @param {String} str
	 * @returns {String}
	 */
	function normalizeName(str) {
		return str.replace(/:$/, '').replace(/:/g, '-');
	}

	function expandSnippetsDefinition(snippets) {
		var out = {};
		each(snippets, function(val, key) {
			var items = key.split('|');
			// do not use iterators for better performance
			for (var i = items.length - 1; i >= 0; i--) {
				out[items[i]] = val;
			}
		});

		return out;
	}

	utils.extend(exports, {
		/**
		 * Sets new unparsed data for specified settings vocabulary
		 * @param {Object} data
		 * @param {String} type Vocabulary type ('system' or 'user')
		 * @memberOf resources
		 */
		setVocabulary: function(data, type) {
			cache = {};

			// sections like "snippets" and "abbreviations" could have
			// definitions like `"f|fs": "fieldset"` which is the same as distinct
			// "f" and "fs" keys both equals to "fieldset".
			// We should parse these definitions first
			var voc = {};
			each(data, function(section, syntax) {
				var _section = {};
				each(section, function(subsection, name) {
					if (name == 'abbreviations' || name == 'snippets') {
						subsection = expandSnippetsDefinition(subsection);
					}
					_section[name] = subsection;
				});

				voc[syntax] = _section;
			});


			if (type == VOC_SYSTEM) {
				systemSettings = voc;
			} else {
				userSettings = voc;
			}
		},

		/**
		 * Returns resource vocabulary by its name
		 * @param {String} name Vocabulary name ('system' or 'user')
		 * @return {Object}
		 */
		getVocabulary: function(name) {
			return name == VOC_SYSTEM ? systemSettings : userSettings;
		},

		/**
		 * Returns resource (abbreviation, snippet, etc.) matched for passed
		 * abbreviation
		 * @param {AbbreviationNode} node
		 * @param {String} syntax
		 * @returns {Object}
		 */
		getMatchedResource: function(node, syntax) {
			return resolvers.exec(null, utils.toArray(arguments))
				|| this.findSnippet(syntax, node.name());
		},

		/**
		 * Returns variable value
		 * @return {String}
		 */
		getVariable: function(name) {
			return (this.getSection('variables') || {})[name];
		},

		/**
		 * Store runtime variable in user storage
		 * @param {String} name Variable name
		 * @param {String} value Variable value
		 */
		setVariable: function(name, value){
			var voc = this.getVocabulary('user') || {};
			if (!('variables' in voc))
				voc.variables = {};

			voc.variables[name] = value;
			this.setVocabulary(voc, 'user');
		},

		/**
		 * Check if there are resources for specified syntax
		 * @param {String} syntax
		 * @return {Boolean}
		 */
		hasSyntax: function(syntax) {
			return syntax in this.getVocabulary(VOC_USER)
				|| syntax in this.getVocabulary(VOC_SYSTEM);
		},

		/**
		 * Registers new abbreviation resolver.
		 * @param {Function} fn Abbreviation resolver which will receive
		 * abbreviation as first argument and should return parsed abbreviation
		 * object if abbreviation has handled successfully, <code>null</code>
		 * otherwise
		 * @param {Object} options Options list as described in
		 * {@link HandlerList#add()} method
		 */
		addResolver: function(fn, options) {
			resolvers.add(fn, options);
		},

		removeResolver: function(fn) {
			resolvers.remove(fn);
		},

		/**
		 * Returns actual section data, merged from both
		 * system and user data
		 * @param {String} name Section name (syntax)
		 * @param {String} ...args Subsections
		 * @returns
		 */
		getSection: function(name) {
			if (!name)
				return null;

			if (!(name in cache)) {
				cache[name] = utils.deepMerge({}, systemSettings[name], userSettings[name]);
			}

			var data = cache[name], subsections = utils.toArray(arguments, 1), key;
			while (data && (key = subsections.shift())) {
				if (key in data) {
					data = data[key];
				} else {
					return null;
				}
			}

			return data;
		},

		/**
		 * Recursively searches for a item inside top level sections (syntaxes)
		 * with respect of `extends` attribute
		 * @param {String} topSection Top section name (syntax)
		 * @param {String} subsection Inner section name
		 * @returns {Object}
		 */
		findItem: function(topSection, subsection) {
			var data = this.getSection(topSection);
			while (data) {
				if (subsection in data)
					return data[subsection];

				data = this.getSection(data['extends']);
			}
		},

		/**
		 * Recursively searches for a snippet definition inside syntax section.
		 * Definition is searched inside `snippets` and `abbreviations`
		 * subsections
		 * @param {String} syntax Top-level section name (syntax)
		 * @param {String} name Snippet name
		 * @returns {Object}
		 */
		findSnippet: function(syntax, name, memo) {
			if (!syntax || !name)
				return null;

			memo = memo || [];

			var names = [name];
			// create automatic aliases to properties with colons,
			// e.g. pos-a == pos:a
			if (~name.indexOf('-')) {
				names.push(name.replace(/\-/g, ':'));
			}

			var data = this.getSection(syntax), matchedItem = null;
			['snippets', 'abbreviations'].some(function(sectionName) {
				var data = this.getSection(syntax, sectionName);
				if (data) {
					return names.some(function(n) {
						if (data[n]) {
							return matchedItem = parseItem(n, data[n], sectionName);
						}
					});
				}
			}, this);

			memo.push(syntax);
			if (!matchedItem && data['extends'] && !~memo.indexOf(data['extends'])) {
				// try to find item in parent syntax section
				return this.findSnippet(data['extends'], name, memo);
			}

			return matchedItem;
		},

		/**
		 * Performs fuzzy search of snippet definition
		 * @param {String} syntax Top-level section name (syntax)
		 * @param {String} name Snippet name
		 * @returns
		 */
		fuzzyFindSnippet: function(syntax, name, minScore) {
			var result = this.fuzzyFindMatches(syntax, name, minScore)[0];
			if (result) {
				return result.value.parsedValue;
			}
		},

		fuzzyFindMatches: function(syntax, name, minScore) {
			minScore = minScore || 0.3;
			name = normalizeName(name);
			var snippets = this.getAllSnippets(syntax);

			return Object.keys(snippets)
				.map(function(key) {
					var value = snippets[key];
					return {
						key: key,
						score: stringScore.score(value.nk, name, 0.1),
						value: value
					};
				})
				.filter(function(item) {
					return item.score >= minScore;
				})
				.sort(function(a, b) {
					return a.score - b.score;
				})
				.reverse();
		},

		/**
		 * Returns plain dictionary of all available abbreviations and snippets
		 * for specified syntax with respect of inheritance
		 * @param {String} syntax
		 * @returns {Object}
		 */
		getAllSnippets: function(syntax) {
			var cacheKey = 'all-' + syntax;
			if (!cache[cacheKey]) {
				var stack = [], sectionKey = syntax;
				var memo = [];

				do {
					var section = this.getSection(sectionKey);
					if (!section)
						break;

					['snippets', 'abbreviations'].forEach(function(sectionName) {
						var stackItem = {};
						each(section[sectionName] || null, function(v, k) {
							stackItem[k] = {
								nk: normalizeName(k),
								value: v,
								parsedValue: parseItem(k, v, sectionName),
								type: sectionName
							};
						});

						stack.push(stackItem);
					});

					memo.push(sectionKey);
					sectionKey = section['extends'];
				} while (sectionKey && !~memo.indexOf(sectionKey));


				cache[cacheKey] = utils.extend.apply(utils, stack.reverse());
			}

			return cache[cacheKey];
		},

		/**
		 * Returns newline character
		 * @returns {String}
		 */
		getNewline: function() {
			var nl = this.getVariable('newline');
			return typeof nl === 'string' ? nl : '\n';
		},

		/**
		 * Sets new newline character that will be used in output
		 * @param {String} str
		 */
		setNewline: function(str) {
			this.setVariable('newline', str);
			this.setVariable('nl', str);
		}
	});

	// XXX add default resolvers
	exports.addResolver(cssResolver.resolve.bind(cssResolver));

	// try to load snippets
	// hide it from Require.JS parser
	(function(r) {
		if (typeof define === 'undefined' || !define.amd) {
			try {
				exports.setVocabulary(r('../snippets.json'), VOC_SYSTEM);
			} catch (e) {}
		}
	})(require);


	return exports;
});

},{"../assets/logger":28,"../resolver/css":64,"../utils/common":73,"../vendor/stringScore":79,"./elements":25,"./handlerList":26}],33:[function(require,module,exports){
/**
 * A trimmed version of CodeMirror's StringStream module for string parsing
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	/**
	 * @type StringStream
	 * @constructor
	 * @param {String} string Assuming that bound string should be
	 * immutable
	 */
	function StringStream(string) {
		this.pos = this.start = 0;
		this.string = string;
		this._length = string.length;
	}
	
	StringStream.prototype = {
		/**
		 * Returns true only if the stream is at the end of the line.
		 * @returns {Boolean}
		 */
		eol: function() {
			return this.pos >= this._length;
		},
		
		/**
		 * Returns true only if the stream is at the start of the line
		 * @returns {Boolean}
		 */
		sol: function() {
			return this.pos === 0;
		},
		
		/**
		 * Returns the next character in the stream without advancing it. 
		 * Will return <code>undefined</code> at the end of the line.
		 * @returns {String}
		 */
		peek: function() {
			return this.string.charAt(this.pos);
		},
		
		/**
		 * Returns the next character in the stream and advances it.
		 * Also returns <code>undefined</code> when no more characters are available.
		 * @returns {String}
		 */
		next: function() {
			if (this.pos < this._length)
				return this.string.charAt(this.pos++);
		},
		
		/**
		 * match can be a character, a regular expression, or a function that
		 * takes a character and returns a boolean. If the next character in the
		 * stream 'matches' the given argument, it is consumed and returned.
		 * Otherwise, undefined is returned.
		 * @param {Object} match
		 * @returns {String}
		 */
		eat: function(match) {
			var ch = this.string.charAt(this.pos), ok;
			if (typeof match == "string")
				ok = ch == match;
			else
				ok = ch && (match.test ? match.test(ch) : match(ch));
			
			if (ok) {
				++this.pos;
				return ch;
			}
		},
		
		/**
		 * Repeatedly calls <code>eat</code> with the given argument, until it
		 * fails. Returns <code>true</code> if any characters were eaten.
		 * @param {Object} match
		 * @returns {Boolean}
		 */
		eatWhile: function(match) {
			var start = this.pos;
			while (this.eat(match)) {}
			return this.pos > start;
		},
		
		/**
		 * Shortcut for <code>eatWhile</code> when matching white-space.
		 * @returns {Boolean}
		 */
		eatSpace: function() {
			var start = this.pos;
			while (/[\s\u00a0]/.test(this.string.charAt(this.pos)))
				++this.pos;
			return this.pos > start;
		},
		
		/**
		 * Moves the position to the end of the line.
		 */
		skipToEnd: function() {
			this.pos = this._length;
		},
		
		/**
		 * Skips to the next occurrence of the given character, if found on the
		 * current line (doesn't advance the stream if the character does not
		 * occur on the line). Returns true if the character was found.
		 * @param {String} ch
		 * @returns {Boolean}
		 */
		skipTo: function(ch) {
			var found = this.string.indexOf(ch, this.pos);
			if (found > -1) {
				this.pos = found;
				return true;
			}
		},
		
		/**
		 * Skips to <code>close</code> character which is pair to <code>open</code>
		 * character, considering possible pair nesting. This function is used
		 * to consume pair of characters, like opening and closing braces
		 * @param {String} open
		 * @param {String} close
		 * @returns {Boolean} Returns <code>true</code> if pair was successfully
		 * consumed
		 */
		skipToPair: function(open, close, skipString) {
			var braceCount = 0, ch;
			var pos = this.pos, len = this._length;
			while (pos < len) {
				ch = this.string.charAt(pos++);
				if (ch == open) {
					braceCount++;
				} else if (ch == close) {
					braceCount--;
					if (braceCount < 1) {
						this.pos = pos;
						return true;
					}
				} else if (skipString && (ch == '"' || ch == "'")) {
					this.skipString(ch);
				}
			}
			
			return false;
		},

		/**
		 * A helper function which, in case of either single or
		 * double quote was found in current position, skips entire
		 * string (quoted value)
		 * @return {Boolean} Wether quoted string was skipped
		 */
		skipQuoted: function(noBackup) {
			var ch = this.string.charAt(noBackup ? this.pos : this.pos - 1);
			if (ch === '"' || ch === "'") {
				if (noBackup) {
					this.pos++;
				}
				return this.skipString(ch);
			}
		},

		/**
		 * A custom function to skip string literal, e.g. a "double-quoted"
		 * or 'single-quoted' value
		 * @param  {String} quote An opening quote
		 * @return {Boolean}
		 */
		skipString: function(quote) {
			var pos = this.pos, len = this._length, ch;
			while (pos < len) {
				ch = this.string.charAt(pos++);
				if (ch == '\\') {
					continue;
				} else if (ch == quote) {
					this.pos = pos;
					return true;
				}
			}

			return false;
		},
		
		/**
		 * Backs up the stream n characters. Backing it up further than the
		 * start of the current token will cause things to break, so be careful.
		 * @param {Number} n
		 */
		backUp : function(n) {
			this.pos -= n;
		},
		
		/**
		 * Act like a multi-character <code>eat</code>—if <code>consume</code> is true or
		 * not given—or a look-ahead that doesn't update the stream position—if
		 * it is false. <code>pattern</code> can be either a string or a
		 * regular expression starting with ^. When it is a string,
		 * <code>caseInsensitive</code> can be set to true to make the match
		 * case-insensitive. When successfully matching a regular expression,
		 * the returned value will be the array returned by <code>match</code>,
		 * in case you need to extract matched groups.
		 * 
		 * @param {RegExp} pattern
		 * @param {Boolean} consume
		 * @param {Boolean} caseInsensitive
		 * @returns
		 */
		match: function(pattern, consume, caseInsensitive) {
			if (typeof pattern == "string") {
				var cased = caseInsensitive
					? function(str) {return str.toLowerCase();}
					: function(str) {return str;};
				
				if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
					if (consume !== false)
						this.pos += pattern.length;
					return true;
				}
			} else {
				var match = this.string.slice(this.pos).match(pattern);
				if (match && consume !== false)
					this.pos += match[0].length;
				return match;
			}
		},
		
		/**
		 * Get the string between the start of the current token and the 
		 * current stream position.
		 * @returns {String}
		 */
		current: function(backUp) {
			return this.string.slice(this.start, this.pos - (backUp ? 1 : 0));
		}
	};

	module.exports = function(string) {
		return new StringStream(string);
	};

	/** @deprecated */
	module.exports.create = module.exports;
	return module.exports;
});
},{}],34:[function(require,module,exports){
/**
 * Utility module for handling tabstops tokens generated by Emmet's 
 * "Expand Abbreviation" action. The main <code>extract</code> method will take
 * raw text (for example: <i>${0} some ${1:text}</i>), find all tabstops 
 * occurrences, replace them with tokens suitable for your editor of choice and 
 * return object with processed text and list of found tabstops and their ranges.
 * For sake of portability (Objective-C/Java) the tabstops list is a plain 
 * sorted array with plain objects.
 * 
 * Placeholders with the same are meant to be <i>linked</i> in your editor.
 */
if (typeof module === 'object' && typeof define !== 'function') {
	var define = function (factory) {
		module.exports = factory(require, exports, module);
	};
}

define(function(require, exports, module) {
	var utils = require('../utils/common');
	var stringStream = require('./stringStream');
	var resources = require('./resources');

	/**
	 * Global placeholder value, automatically incremented by 
	 * <code>variablesResolver()</code> function
	 */
	var startPlaceholderNum = 100;
	var tabstopIndex = 0;
	
	var defaultOptions = {
		replaceCarets: false,
		escape: function(ch) {
			return '\\' + ch;
		},
		tabstop: function(data) {
			return data.token;
		},
		variable: function(data) {
			return data.token;
		}
	};
	
	return {
		/**
		 * Main function that looks for a tabstops in provided <code>text</code>
		 * and returns a processed version of <code>text</code> with expanded 
		 * placeholders and list of tabstops found.
		 * @param {String} text Text to process
		 * @param {Object} options List of processor options:<br>
		 * 
		 * <b>replaceCarets</b> : <code>Boolean</code> — replace all default
		 * caret placeholders (like <i>{%::emmet-caret::%}</i>) with <i>${0:caret}</i><br>
		 * 
		 * <b>escape</b> : <code>Function</code> — function that handle escaped
		 * characters (mostly '$'). By default, it returns the character itself 
		 * to be displayed as is in output, but sometimes you will use 
		 * <code>extract</code> method as intermediate solution for further 
		 * processing and want to keep character escaped. Thus, you should override
		 * <code>escape</code> method to return escaped symbol (e.g. '\\$')<br>
		 * 
		 * <b>tabstop</b> : <code>Function</code> – a tabstop handler. Receives 
		 * a single argument – an object describing token: its position, number 
		 * group, placeholder and token itself. Should return a replacement 
		 * string that will appear in final output
		 * 
		 * <b>variable</b> : <code>Function</code> – variable handler. Receives 
		 * a single argument – an object describing token: its position, name 
		 * and original token itself. Should return a replacement 
		 * string that will appear in final output
		 * 
		 * @returns {Object} Object with processed <code>text</code> property
		 * and array of <code>tabstops</code> found
		 * @memberOf tabStops
		 */
		extract: function(text, options) {
			// prepare defaults
			var placeholders = {carets: ''};
			var marks = [];
			
			options = utils.extend({}, defaultOptions, options, {
				tabstop: function(data) {
					var token = data.token;
					var ret = '';
					if (data.placeholder == 'cursor') {
						marks.push({
							start: data.start,
							end: data.start + token.length,
							group: 'carets',
							value: ''
						});
					} else {
						// unify placeholder value for single group
						if ('placeholder' in data)
							placeholders[data.group] = data.placeholder;
						
						if (data.group in placeholders)
							ret = placeholders[data.group];
						
						marks.push({
							start: data.start,
							end: data.start + token.length,
							group: data.group,
							value: ret
						});
					}
					
					return token;
				}
			});
			
			if (options.replaceCarets) {
				text = text.replace(new RegExp( utils.escapeForRegexp( utils.getCaretPlaceholder() ), 'g'), '${0:cursor}');
			}
			
			// locate tabstops and unify group's placeholders
			text = this.processText(text, options);
			
			// now, replace all tabstops with placeholders
			var buf = '', lastIx = 0;
			var tabStops = marks.map(function(mark) {
				buf += text.substring(lastIx, mark.start);
				
				var pos = buf.length;
				var ph = placeholders[mark.group] || '';
				
				buf += ph;
				lastIx = mark.end;
				
				return {
					group: mark.group,
					start: pos,
					end:  pos + ph.length
				};
			});
			
			buf += text.substring(lastIx);
			
			return {
				text: buf,
				tabstops: tabStops.sort(function(a, b) {
					return a.start - b.start;
				})
			};
		},
		
		/**
		 * Text processing routine. Locates escaped characters and tabstops and
		 * replaces them with values returned by handlers defined in 
		 * <code>options</code>
		 * @param {String} text
		 * @param {Object} options See <code>extract</code> method options 
		 * description
		 * @returns {String}
		 */
		processText: function(text, options) {
			options = utils.extend({}, defaultOptions, options);
			
			var buf = '';
			/** @type StringStream */
			var stream = stringStream.create(text);
			var ch, m, a;
			
			while ((ch = stream.next())) {
				if (ch == '\\' && !stream.eol()) {
					// handle escaped character
					buf += options.escape(stream.next());
					continue;
				}
				
				a = ch;
				
				if (ch == '$') {
					// looks like a tabstop
					stream.start = stream.pos - 1;
					
					if ((m = stream.match(/^[0-9]+/))) {
						// it's $N
						a = options.tabstop({
							start: buf.length, 
							group: stream.current().substr(1),
							token: stream.current()
						});
					} else if ((m = stream.match(/^\{([a-z_\-][\w\-]*)\}/))) {
						// ${variable}
						a = options.variable({
							start: buf.length, 
							name: m[1],
							token: stream.current()
						});
					} else if ((m = stream.match(/^\{([0-9]+)(:.+?)?\}/, false))) {
						// ${N:value} or ${N} placeholder
						// parse placeholder, including nested ones
						stream.skipToPair('{', '}');
						
						var obj = {
							start: buf.length, 
							group: m[1],
							token: stream.current()
						};
						
						var placeholder = obj.token.substring(obj.group.length + 2, obj.token.length - 1);
						
						if (placeholder) {
							obj.placeholder = placeholder.substr(1);
						}
						
						a = options.tabstop(obj);
					}
				}
				
				buf += a;
			}
			
			return buf;
		},
		
		/**
		 * Upgrades tabstops in output node in order to prevent naming conflicts
		 * @param {AbbreviationNode} node
		 * @param {Number} offset Tab index offset
		 */
						
			