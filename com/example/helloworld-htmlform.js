AFRAME.registerComponent('helloworld-htmlform', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {},

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // deadsimple windows: https://nextapps-de.github.io/winbox
  },

  dom: {
    scale:   1,
    events:  ['click','input'],
    html:    (me) => `<div class="htmlform">
                        <fieldset>
                          <legend>Colour</legend>
                          <input type="radio" id="color-red" name="color" value="red" checked><label for="color-red"> Red</label><br>
                          <input type="radio" id="color-blue" name="color" value="blue"><label for="color-blue"> Blue</label><br>
                        </fieldset>
                        <fieldset>
                          <legend>Material:</legend>
                          <input id="material-wireframe" type="checkbox" name="wireframe"><label for="material-wireframe"> Wireframe</label><br>
                        </fieldset>
                        <fieldset>
                          <legend>Size</legend>
                          <input type="range" min="0.1" max="2" value="1" step="0.01" id="myRange" style="background-color: transparent;">
                        </fieldset>
                        <button>hello <span id="myvalue"></span></button>
                      </div>`,

    css:     (me) => `.htmlform { padding:11px; }`

  },

  events:{

    // component events
    html:     function( ){ console.log("html-mesh requirement mounted") },

    // combined AFRAME+DOM reactive events
    click: function(e){ }, // 
    input: function(e){
      if( !e.detail.target                 ) return
      if(  e.detail.target.id == 'myRange' ) this.data.myvalue = e.detail.target.value // reactive demonstration
    },

    // reactive events for this.data updates 
    myvalue: function(e){ this.el.dom.querySelector('#myvalue').innerText = this.data.myvalue },

    launcher: async function(){
      let s = await AFRAME.utils.require(this.requires)

      // instance this component
      const instance = this.el.cloneNode(false)
      this.el.sceneEl.appendChild( instance )
      instance.setAttribute("dom",      "")
      instance.setAttribute("xd",       "")  // allows flipping between DOM/WebGL when toggling XD-button
      instance.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      instance.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.5) )
      instance.setAttribute("grabbable","")
      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera

      const setupWindow = () => {
        const com = instance.components['helloworld-htmlform']
        instance.dom.style.display = 'none'
        new WinBox("Hello World",{ 
          width: 250,
          height: 340,
          x:"center",
          y:"center",
          id:  instance.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: instance.dom,
          onclose: () => { instance.dom.style.display = 'none'; return false; },
          oncreate: () => instance.setAttribute("html",`html:#${instance.uid}; cursor:#cursor`)
        });
        instance.dom.style.display = AFRAME.utils.XD() == '3D' ? 'none' : '' // show/hide

        // hint grabbable's obb-collider to track the window-object 
        instance.components['obb-collider'].data.trackedObject3D = 'components.html.el.object3D.children.0'
        instance.components['obb-collider'].update() 

        // data2event demo
        instance.setAttribute("data2event","")
        com.data.myvalue = 1
        com.data.foo     = `instance ${instance.uid}: `
        setInterval( () => com.data.myvalue++, 500 )
      }

      setTimeout( () => setupWindow(), 10 ) // give new components time to init
    },

    ready: function( ){ 
      this.el.dom.style.display = 'none'
      console.log("this.el.dom has been added to DOM")
      this.data.myvalue = 1
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world htmlform",
    "name": "Hello world htmlform",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
        "type": "image/svg+xml",
        "sizes": "512x512"
      }
    ],
    "id": "/?source=pwa",
    "start_url": "/?source=pwa",
    "background_color": "#3367D6",
    "display": "standalone",
    "scope": "/",
    "theme_color": "#3367D6",
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
    "description": "Hello world htmlform",
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

