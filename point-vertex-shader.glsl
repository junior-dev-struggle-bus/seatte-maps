#version 300 es

in vec2 aVertexPosition;
in vec4 aVertexColor;

uniform vec4 offsetRotScale;//offset x, offset y, rotate, scale

out highp vec4 vColor;

void main() {
  gl_Position = vec4((aVertexPosition + offsetRotScale.xy), 0.0, 1.0 / pow(2.0, offsetRotScale.w));
  gl_PointSize = 10.0;
  vColor = aVertexColor;
}