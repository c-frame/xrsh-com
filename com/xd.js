AFRAME.registerComponent('xd', {
  schema: {
    foo: { type:"string"}
  },

  init: function () {
    if( Object.keys(this.el.components).length > 1 ) return // we collect a-entities which wish to be toggled in this.showElements()

    this.el.sceneEl.addEventListener('enter-vr',() => this.toggle(true) )
    this.el.sceneEl.addEventListener('exit-vr', () => this.toggle(false) )
    this.el.sceneEl.addEventListener('2D', () => this.showElements(false) )
    this.el.sceneEl.addEventListener('3D', () => this.showElements(true) )

    // toggle immersive with ESCAPE
    document.body.addEventListener('keydown', (e) => e.key == 'Escape' && this.toggle() )

    document.head.innerHTML += `<style type="text/css">
      .XR #toggle_overlay{
        background: transparent;
        color: #3aacff;
      }

      .XR #overlay{
        visibility: hidden;
      }
    </style>`

    this.events.launcher = () => this.toggle()
  },

  showElements: function(state){
    let els = [...document.querySelectorAll('[xd]')]
    els     = els.filter( (el) => el != this.el ? el : null ) // filter out self
    els.map( (el) => el.setAttribute("visible", state ? "true" : false  ) )
  },

  // draw a button so we can toggle apps between 2D / XR
  toggle: function(state){
    state = state != undefined ? state : state || !document.body.className.match(/XR/)
    document.body.classList[ state ? 'add' : 'remove'](['XR'])
    AFRAME.scenes[0].emit( state ? '3D' : '2D')
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "XD",
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

This is a help file which describes the application.
It will be rendered thru troika text, and will contain
headers based on non-punctualized lines separated by linebreaks,
in above's case "\nHelloworld application\n" will qualify as header.
    `
  }

});

AFRAME.utils.XD = function(){
  return document.body.classList.contains('XR') ? '3D' : '2D'
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
