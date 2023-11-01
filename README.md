# WebXROS apps

<img src='https://github.com/coderofsalvation/webxros/raw/main/src/assets/webxros.svg' width="25%"/>

This is a library of useful AFRAME components which can be used in any AFRAME app, but also are exposed as 'apps' in [webxros](https://github.com/coderofsalvation/webxros):

# Usage

```html
<a-entity helloworld="foo:1" class="cubes" name="box">  
```

In [webxros](https://github.com/coderofsalvation/webxros) these components can be applied to entities using controllers/gestures, or via a webxros terminal:

```bash
$ open foo.gltf 
scene/box
scene/pyramid

$ component helloworld
> enter value for foo: 1

$ export --html > scene.html
$ export --gltf > scene.gltf
```
