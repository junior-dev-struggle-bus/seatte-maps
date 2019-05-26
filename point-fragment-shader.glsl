#version 300 es

in highp vec4 vColor;
precision mediump float;

out vec4 outColor;

void main() {
  float alpha = 1.0;
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  float r = dot(cxy, cxy);
  float delta = fwidth(r);
  alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

  outColor = vec4(vColor.rgb, alpha);
}