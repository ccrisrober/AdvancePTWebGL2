"use strict";
var kKeys = {
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,
    Space: 32,
    Zero: 48,
    One: 49,
    Two: 50,
    Three: 51,
    Four: 52,
    Five: 53,
    Six: 54,
    Seven: 55,
    Eight: 56,
    Nine: 57,
    A: 65,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    Q: 81,
    R: 82,
    S: 83,
    W: 87,
    LastKeyCode: 222
};
var Input = (function () {
    function Input() {
        this.mKeyPreviousState = new Array(kKeys.LastKeyCode);
        this.mIsKeyPressed = new Array(kKeys.LastKeyCode);
        this.mIsKeyClicked = new Array(kKeys.LastKeyCode);
        if (!Input._instance) {
        }
        Input._instance = this;
    }
    Input.getInstance = function () {
        return Input._instance;
    };
    Input.prototype.initialize = function () {
        var i;
        for (i = 0; i < kKeys.LastKeyCode; i++) {
            this.mIsKeyPressed[i] = false;
            this.mKeyPreviousState[i] = false;
            this.mIsKeyClicked[i] = false;
        }
        window.addEventListener("keyup", this._onKeyUp);
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("onmousedown", this._onMouseDown);
        window.addEventListener("onmouseup", this._onMouseUp);
    };
    Input.prototype._onKeyUp = function (ev) {
        Input._instance.mIsKeyPressed[ev.keyCode] = false;
    };
    Input.prototype._onKeyDown = function (ev) {
        Input._instance.mIsKeyPressed[ev.keyCode] = true;
    };
    Input.prototype._onMouseDown = function (ev) {
    };
    Input.prototype._onMouseUp = function (ev) {
    };
    Input.prototype.update = function () {
        var i;
        for (i = 0; i < kKeys.LastKeyCode; i++) {
            this.mIsKeyClicked[i] = (!this.mKeyPreviousState[i]) && this.mIsKeyPressed[i];
            this.mKeyPreviousState[i] = this.mIsKeyPressed[i];
        }
    };
    Input.prototype.isKeyPressed = function (key) {
        return this.mIsKeyPressed[key];
    };
    Input.prototype.isKeyClicked = function (key) {
        return this.mIsKeyClicked[key];
    };
    Input._instance = new Input();
    return Input;
}());
//# sourceMappingURL=input.js.map