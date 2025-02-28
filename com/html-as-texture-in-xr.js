/**
 * ## [html-as-texture-in-xr](com/html-as-texture-in-xr.js)
 *
 * shows domid **only** in immersive mode 
 * (wrapper around [aframe-htmlmesh](https://ada.is/aframe-htmlmesh/)
 *
 * It also sets class 'XR' to the (HTML) body-element in immersive mode.
 * This allows CSS (in [dom component](com/dom.js)) to visually update accordingly.
 *
 * > depends on [AFRAME.utils.require](com/require.js)
 *
 * ```html 
 *  <style type="text/css">
 *    .XR #foo { color:red; }
 *  </style>
 *
 *  <a-entity html-as-texture-in-xr="domid: #foo">
 *    <b id="foo">hello</b>
 *  </a-entitiy>
 * ```
 *
 * | property     | type               |
 * |--------------|--------------------|
 * | `domid`      | `string`           |
 *
 * | event        | target     | info                                 |
 * |--------------|------------|--------------------------------------|
 * | `3D`         | a-scene    | fired when going into immersive mode |
 * | `2D`         | a-scene    | fired when leaving immersive mode    |
 *
 */

if( !AFRAME.components['html-as-texture-in-xr'] ){

  AFRAME.registerComponent('html-as-texture-in-xr', {
    schema: {
      domid:       { type:"string"},
      doublesided: {type: "boolean", default: true},
      faceuser:    { type: "boolean", default: false}
    },

    dependencies:{
      html:          "com/lib/aframe-html.js"
    },

    init: async function () { 
      let el = document.querySelector(this.data.domid)
      if( ! el ){
        return console.error("html-as-texture-in-xr: cannot get dom element "+this.data.domid)
      }
      let s = await AFRAME.utils.require(this.dependencies)

      this.forwardClickToMesh();

      this.el.sceneEl.addEventListener('enter-vr', () => this.enableDoubleSided() )

      this.el.setAttribute("html",`html: ${this.data.domid}; cursor:#cursor; `)
      this.el.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      if( this.data.faceuser ){
        this.el.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.4) )
      }
    },

    forwardClickToMesh: function(){
      // monkeypatch: forward click to mesh
      const handle = AFRAME.components['html'].Component.prototype.handle
      AFRAME.components['html'].Component.prototype.handle = function(type,evt){

        if( !this.el.sceneEl.renderer.xr.isPresenting                        ) return // ignore events in desktop mode 
        if( this.el.sceneEl.renderer.xr.isPresenting && type.match(/^mouse/) ) return // ignore mouse-events in XR

        if( type == 'click' && evt.detail.length && evt.detail[0].uv ){
          const mesh = this.el.object3D.children[0] 
          const uv = evt.detail[0].uv;
          const _pointer = new THREE.Vector2();
          const _event = { type: '', data: _pointer };
          _event.type = type;
          _event.data.set( uv.x, 1 - uv.y );
          mesh.dispatchEvent( _event );
        }
        return handle.apply(this,[type,evt])
      }

    },

    enableDoubleSided: function(){
      // enable doubleside
      this.el.object3D.traverse( (o) => {
        if( o.constructor && String(o.constructor).match(/HTMLMesh/) ){
          o.material.side = THREE.DoubleSide
        }
      })
    }

  });

  AFRAME.utils.XD = function(){
    return document.body.classList.contains('XR') ? '3D' : '2D'
  }

  AFRAME.utils.XD.toggle = function(state){
      state = state != undefined ? state : state || !document.body.className.match(/XR/)
      document.body.classList[ state ? 'add' : 'remove'](['XR'])
      AFRAME.scenes[0].emit( state ? '3D' : '2D')
    }

  AFRAME.utils.XD.getPositionInFrontOfCamera = function(distance){
    const camera = AFRAME.scenes[0].camera;
    let pos = new THREE.Vector3()
    let direction = new THREE.Vector3();
    // Get camera's forward direction (without rotation)
    camera.getWorldDirection(direction);
    camera.getWorldPosition(pos)
    direction.normalize();
    // Scale the direction by 1 meter
    if( !distance ) distance = 1.5
    direction.multiplyScalar(distance);
    // Add the camera's position to the scaled direction to get the target point
    pos.add(direction);
    return pos
  }

  AFRAME.registerSystem('html-as-texture-in-xr',{

    init: function(){
      this.sceneEl.addEventListener('enter-vr',() => AFRAME.utils.XD.toggle(true) )
      this.sceneEl.addEventListener('exit-vr', () => AFRAME.utils.XD.toggle(false) )
      this.sceneEl.addEventListener('2D', () => this.showElements(false) )
      this.sceneEl.addEventListener('3D', () => this.showElements(true) )

      document.head.innerHTML += `<style type="text/css">
        .XR #toggle_overlay{
          background: transparent;
          color: #3aacff;
        }

        /*
        .XR #overlay{
          visibility: hidden;
        }
        */
      </style>`

    },

    showElements: function(state){
      let els = [...document.querySelectorAll('[html-as-texture-in-xr]')]
      els     = els.filter( (el) => el != this.el ? el : null ) // filter out self
      els.map( (el) => el.setAttribute("visible", state ? true : false  ) )
    }

  })

}
