// shader.vert
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  // p5.js automatically passes these uniforms so that
  // a call like rect(-width/2, -height/2, width, height) fills the canvas.
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
