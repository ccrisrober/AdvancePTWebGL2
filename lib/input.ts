// Path tracer in WebGL2
// Copyright (C) <2016> 
//	- Cristian Rodríguez Bernal (maldicion069)
//	- Juan Guerrero Martín (hire33)
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

"use strict";

// http://www.ascii-code.com/

var kKeys = {
	// arrows
	Left: 37,
	Up: 38,
	Right: 39,
	Down: 40,

	// space bar
	Space: 32,

	// numbers
	Zero: 48,
	One: 49,
	Two: 50,
	Three: 51,
	Four: 52,
	Five : 53,
	Six : 54,
	Seven : 55,
	Eight : 56,
	Nine : 57,

	// Alphabets
	A : 65,
	D : 68,
	E : 69,
	F : 70,
	G : 71,
	I : 73,
	J : 74,
	K : 75,
	L : 76,
	Q : 81,
	R : 82,
	S : 83,
	W : 87,
	LastKeyCode : 222
};

class Input {
	// Previous key state
	private mKeyPreviousState: boolean[] = new Array(kKeys.LastKeyCode);
	// The pressed keys.
	private mIsKeyPressed: boolean[] = new Array(kKeys.LastKeyCode);
	// Click events: once an event is set, it will remain there until polled
	private mIsKeyClicked: boolean[] = new Array(kKeys.LastKeyCode);
	private static _instance: Input = new Input();
	
	constructor() {
		if(!Input._instance) {
			// error
		}
		Input._instance = this;
	}
	public static getInstance():Input {
		return Input._instance;
	}
	public initialize() {
		var i;
		for(i = 0; i < kKeys.LastKeyCode; i++) {
			this.mIsKeyPressed[i] = false;
			this.mKeyPreviousState[i] = false;
			this.mIsKeyClicked[i] = false;
		}
		
		window.addEventListener("keyup", this._onKeyUp);
		window.addEventListener("keydown", this._onKeyDown);
		window.addEventListener("onmousedown", this._onMouseDown);
		window.addEventListener("onmouseup", this._onMouseUp);
	}
	private _onKeyUp(ev) {
		//console.log("PULSADO " + ev.keyCode);
		Input._instance.mIsKeyPressed[ev.keyCode] = false;
	}
	private _onKeyDown(ev) {
		//console.log("SOLTADO " + ev.keyCode);
		Input._instance.mIsKeyPressed[ev.keyCode] = true;
	}
	private _onMouseDown(ev) {
		//console.log("PULSADO " + ev.keyCode);
	}
	private _onMouseUp(ev) {
		//console.log("SOLTADO " + ev.keyCode);
	}
	public update() {
		//for(key in this.mKe)
        var i;
		for (i = 0; i < kKeys.LastKeyCode; i++) {
            this.mIsKeyClicked[i] = (!this.mKeyPreviousState[i]) && this.mIsKeyPressed[i];
            this.mKeyPreviousState[i] = this.mIsKeyPressed[i];
        }
	}
	
	public isKeyPressed(key) {
		return this.mIsKeyPressed[key];
	}
	public isKeyClicked(key) {
		return this.mIsKeyClicked[key];
	}
}