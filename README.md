
# Brush renderer

[Demo available here!](https://madblade.github.io/brush-renderer/)

![](https://raw.githubusercontent.com/madblade/brush-renderer/master/img/capture2.jpg)
![](https://raw.githubusercontent.com/madblade/brush-renderer/master/img/capture3.jpg)
![](https://raw.githubusercontent.com/madblade/brush-renderer/master/img/capture4.jpg)

## About

This is an artistic, painterly effect based on particles, running real time on the browser thanks to
[three.js](http://threejs.org/).

Inspired by Barbara Meier’s seminal Disney paper, _“Painterly Rendering for Animation”_ (SIGGRAPH ’96).

## Approach

0. Generate a static particle set (transparent, max blending).
1. Render the 3D scene onto a color buffer **CB** and a (log) depth buffer **DB**.
2. Render the 3D scene with a unique material that stores one of the UV components (u or v) onto a buffer **UVB**.
3. For each particle (vertex shader):
    - compute the particle color from **CB**
    - compute the particle size from **DB**
    - compute **G** the gradient of **UVB** (e.g. with a Sobel kernel)
    - compute the particle orientation from **G**
4. Rotate particles (fragment shader)

## Improvements

- Render ontop of the pre-rendered scene to remove holes.
- Dynamic particle distribution?
- Better adaptive particle orientations?
