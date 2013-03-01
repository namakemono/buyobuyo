/**
 *
 */
var KeyCode = {};
KeyCode.Left = 37;
KeyCode.Up = 38;
KeyCode.Right = 39;
KeyCode.Down = 40;
KeyCode.Shift = 16;

KeyCode.X = 88;
KeyCode.Z = 90;

var Input = {};
Input._input_keys = {};
/**
 * Returns true while the user holds down the key identified by name. Think auto fire.
 */
Input.onPressed = function(key_code) { return this._input_keys[key_code]; };
Input.press = function(key_code) { this._input_keys[key_code] = true; };
Input.release = function(key_code) { this._input_keys[key_code] = false; };

window.document.onkeydown = function(event) { Input.press(event.keyCode); };
window.document.onkeyup = function(event) { Input.release(event.keyCode);};


