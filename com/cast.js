AFRAME.registerComponent('cast', {
  schema:{
    comps: {type:"array"}
  },

  requires:     {
    dom:         "./com/dom.js",                                                  // interpret .dom object
    xd:          "./com/xd.js",                                                   // allow switching between 2D/3D 
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
  },

  dom: {
    scale:   0.8,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <video id="video" autoplay playsinline style="width:100%"></video>
                      </div>`,

    css:    (me) =>  `.helloworld-window div.pad { padding:11px; }`
  },

  init: function () { },

  getInstallables: function(){
    const installed   = document.querySelector('[launcher]').components.launcher.system.getLaunchables() 
    return this.data.comps.map( (c) => {
      return installed[c] ? null : c
    })
    .filter( (c) => c ) // filters out null elements
  },

  events:{

    launcher: async function(){
      if( this.el.sceneEl.renderer.xr.isPresenting ){
        this.el.sceneEl.exitVR() // *FIXME* we need a gui 
      }
      const el = document.querySelector('body');
      const cropTarget = await CropTarget.fromElement(el);
      const stream = await navigator.mediaDevices.getDisplayMedia();
      const [track] = stream.getVideoTracks();
      this.track = track
      this.stream = stream
      this.createWindow()
    }
  },

  createWindow: async function(){
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
    instance.track = this.track
    instance.stream = this.stream 

    const setupWindow = () => {
      instance.dom.style.display = 'none'

      const video = instance.dom.querySelector('video')
      video.addEventListener( "loadedmetadata", function () {
        let width  = Math.round(window.innerWidth*0.4) 
        let factor = width / this.videoWidth
        let height = Math.round(this.videoHeight * factor)
        new WinBox("Casting Tab",{ 
          width, 
          height,
          x:"center",
          y:"center",
          id:  instance.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: instance.dom,
          onclose: () => { instance.dom.style.display = 'none'; return false; },
          oncreate: () => {

  //          instance.setAttribute("html",`html:#${instance.uid}; cursor:#cursor`)
          }
        });
        instance.dom.style.display = '' // show

        // hint grabbable's obb-collider to track the window-object 
        instance.components['obb-collider'].data.trackedObject3D = 'components.html.el.object3D.children.0'
        instance.components['obb-collider'].update() 
      })
      video.srcObject = instance.stream 
      video.play()

      this.createVideoTexture.apply(instance)
    }
    setTimeout( () => setupWindow(), 10 ) // give new components time to init
  },

  createVideoTexture: function(){
    console.dir(this)
    const texture = new THREE.VideoTexture( video );
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.PlaneGeometry( 16, 9 );
    geometry.scale( 0.2, 0.2, 0.2 );
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.lookAt( this.sceneEl.camera.position );
    this.object3D.add(mesh)
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "tab",
    "name": "Browser Tab",
    "icons": [
      {
        "src": "https://css.gg/cast.svg",
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
    "description": "adds item to menu",
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

