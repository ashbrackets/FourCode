#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_bgColor;
uniform vec3 u_fgColor;
uniform float u_noiseScale;

varying vec2 vTexCoord;

// --- Simplex Noise (3D) Implementation ---
// The following noise function is adapted from Inigo Quilez’s work.

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0/289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0/289.0)) * 289.0;
}
vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}
vec4 taylorInvSqrt(vec4 r){
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, vec3(C.y)) );
  vec3 x0 = v - i + dot(i, vec3(C.x));

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  // x0, x1, x2, x3
  vec3 x1 = x0 - i1 + C.x;
  vec3 x2 = x0 - i2 + 2.0 * C.x;
  vec3 x3 = x0 - 1.0 + 3.0 * C.x;

  // Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.y;
  vec4 y = y_ *ns.x + ns.y;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.x, a0.y, h.x);
  vec3 p1 = vec3(a0.z, a0.w, h.y);
  vec3 p2 = vec3(a1.x, a1.y, h.z);
  vec3 p3 = vec3(a1.z, a1.w, h.w);

  // Normalize gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  // Compute aspect ratio correction factor
  float aspect = u_resolution.x / u_resolution.y;
  
  // Normalize pixel coordinates with aspect correction
  vec2 st = gl_FragCoord.xy / u_resolution;
  st.x *= aspect; // Scale X to maintain proportions

  // Create a 3D position: scaled 2D coordinate + time offset
  vec3 pos = vec3(st * u_noiseScale, u_time * 0.3);
  
  // Generate noise; snoise() returns roughly in [-1,1]
  float n = snoise(pos);
  
  // Normalize to [0,1] and apply extra scaling
  n = clamp((n + 1.0) / 2.0 * 0.9, 0.0, 1.0);
  
  // Linearly interpolate between background and foreground colors
  vec3 color = mix(u_bgColor, u_fgColor, n);
  
  gl_FragColor = vec4(color, 1.0);
}
