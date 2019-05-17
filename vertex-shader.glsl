attribute vec2 aVertexPosition;
attribute vec4 aVertexColor;

uniform vec4 offsetRotScale;//offset x, offset y, rotate, scale

varying highp vec4 vColor;

void main() {
  //gl_Position = aVertexPosition;// + vec4(offsetRotScale.x, offsetRotScale.y, 0.0, 0.0);
  //gl_Position = vec4(aVertexPosition.x + 123.0, aVertexPosition.y - 47.0, 0.0, 1.0);
  //gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position = vec4((aVertexPosition + offsetRotScale.xy), 0.0, 1.0 / pow(2.0, offsetRotScale.w));
  vColor = aVertexColor;
}