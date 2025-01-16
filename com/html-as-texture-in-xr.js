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
      domid: { type:"string"},
      faceuser: { type: "boolean", default: false}
    },

    dependencies:{
      html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
      //html:          "https://coderofsalvation.github.io/aframe-htmlmesh/build/aframe-html.js"
      //html:          "com/aframe-html.js"
    },

    init: async function () { 
      let el = document.querySelector(this.data.domid)
      if( ! el ){
        return console.error("html-as-texture-in-xr: cannot get dom element "+this.data.dom.id)
      }
      let s = await AFRAME.utils.require(this.dependencies)
      this.el.setAttribute("html",`html: ${this.data.domid}; cursor:#cursor; xrlayer: true`)
      this.el.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      if( this.data.faceuser ){
        this.el.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.4) )
      }
    },

    manifest: { // HTML5 manifest to identify app to xrsh
      "short_name": "show-texture-in-xr",
      "name": "2D/3D switcher",
      "icons": [],
      "id": "/?source=pwa",
      "start_url": "/?source=pwa",
      "background_color": "#3367D6",
      "display": "standalone",
      "scope": "/",
      "theme_color": "#3367D6",
      "category":"system",
      "shortcuts": [
        {
          "name": "What is the latest news?",
          "cli":{
            "usage":  "helloworld <type> [options]",
            "example": "helloworld news",
            "args":{
              "--latest": {type:"string"}
            }
          },
          "short_name": "Today",
          "description": "View weather information for today",
          "url": "/today?source=pwa",
          "icons": [{ "src": "/images/today.png", "sizes": "192x192" }]
        }
      ],
      "description": "use ESC-key to toggle between 2D / 3D",
      "screenshots": [
        {
          "src": "/images/screenshot1.png",
          "type": "image/png",
          "sizes": "540x720",
          "form_factor": "narrow"
        }
      ],
      "help":`
  Helloworld application

      `
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
