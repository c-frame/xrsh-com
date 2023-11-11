# XRshell apps & components

<img src='https://github.com/coderofsalvation/xrshell/raw/main/src/assets/logo.svg' width="25%"/>

This is a library of useful AFRAME components which can be used in any AFRAME app, but also are exposed as 'apps' in [xrshell](https://github.com/coderofsalvation/xrshell):

# Usage

```html
<script src="https://coderofsalvation.github.io/xrshell-apps/helloworld.js"/>

<a-entity helloworld="foo:1" class="cubes" name="box">  
```

In [xrshell](https://github.com/coderofsalvation/xrshell) these components can be applied to entities using controllers/gestures, or via a xrshell terminal:

```bash
$ open foo.gltf 
scene/box
scene/pyramid

$ component helloworld
> enter value for foo: 1

$ export --html > scene.html
$ export --gltf > scene.gltf
```
