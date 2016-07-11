/// <reference path="Sphere.ts" />

class Light extends Sphere { 
	constructor( center, radius, color) {
    	super(center, radius, true, new mat.Emit( new mat.Absorb(), 
    		vec3.fromValues( 25, 25, 25 ), true, color ), false);
  	}
  	public getColor() {
  		return (<mat.Emit>this.material).color;
  	}
  	public setColor(color) {
  		(<mat.Emit>this.material).setColor(vec3.fromValues(color.r, color.g, color.b));
  	}
  	public setIntensity(intensity) {
  		(<mat.Emit>this.material).emission = new Float32Array([intensity, intensity, intensity]);
  	}
	public update(program) {
		gl.uniform3fv( program.uniformLocations[this.centerName], this.center );
		gl.uniform1f( program.uniformLocations[this.radiusName], this.radius );
	}
	public refresh() {
		this.radiusValue = this.radiusName;
		this.centerValue = this.centerName;
		this.uniforms = [this.radiusName, this.centerName];
	}
}