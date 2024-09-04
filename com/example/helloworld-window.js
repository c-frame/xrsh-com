AFRAME.registerComponent('helloworld-window', {
  schema: { 
    foo: { type:"string", "default":"foo"}
  },

  requires:     {
    dom:         "./com/dom.js",                                                  // interpret .dom object
    xrtexture:   "./com/html-as-texture-in-xr.js",                                // allow switching between 3D/3D 
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
  },

  init: function(){ },

  dom: {
    scale:   0.8,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <div class="pad"> <span>${me.data.foo}</span> <b>${me.data.myvalue}</b></span>
                      </div>`,

    css:    (me) =>  `.helloworld-window div.pad { padding:11px; }`
  },

  events:{

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, // 
    keydown: function(e){ }, // 

    // reactive events for this.data updates (data2event.js)
    myvalue: function(e){ this.el.dom.querySelector('b').innerText    = this.data.myvalue },
    foo:     function(e){ this.el.dom.querySelector('span').innerText = this.data.foo },

    launcher: async function(){
      let s = await AFRAME.utils.require(this.requires)

      // instance this component
      const instance = this.el.cloneNode(false)
      this.el.sceneEl.appendChild( instance )
      instance.setAttribute("dom",             "")
      instance.setAttribute("grabbable","")
      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera

      const setupWindow = () => {
        const com = instance.components['helloworld-window']
        instance.dom.style.display = 'none'

        new WinBox("Hello World",{ 
          width: 250,
          height: 150,
          x:"center",
          y:"center",
          id:  instance.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: instance.dom,
          onclose: () => { instance.dom.style.display = 'none'; return false; },
          oncreate: () => {
            instance.setAttribute("show-texture-in-xr",`domid: #${instance.uid}`) // only show aframe-html texture in xr mode
          }
        });
        instance.dom.style.display = '' // show

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

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "window",
    "name": "Hello world window",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
        "src": "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBkPSJNNCA4QzQuNTUyMjggOCA1IDcuNTUyMjggNSA3QzUgNi40NDc3MiA0LjU1MjI4IDYgNCA2QzMuNDQ3NzIgNiAzIDYuNDQ3NzIgMyA3QzMgNy41NTIyOCAzLjQ0NzcyIDggNCA4WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBkPSJNOCA3QzggNy41NTIyOCA3LjU1MjI4IDggNyA4QzYuNDQ3NzIgOCA2IDcuNTUyMjggNiA3QzYgNi40NDc3MiA2LjQ0NzcyIDYgNyA2QzcuNTUyMjggNiA4IDYuNDQ3NzIgOCA3WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBkPSJNMTAgOEMxMC41NTIzIDggMTEgNy41NTIyOCAxMSA3QzExIDYuNDQ3NzIgMTAuNTUyMyA2IDEwIDZDOS40NDc3MSA2IDkgNi40NDc3MiA5IDdDOSA3LjU1MjI4IDkuNDQ3NzEgOCAxMCA4WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBmaWxsLXJ1bGU9ImV2ZW5vZGQiCiAgICBjbGlwLXJ1bGU9ImV2ZW5vZGQiCiAgICBkPSJNMyAzQzEuMzQzMTUgMyAwIDQuMzQzMTUgMCA2VjE4QzAgMTkuNjU2OSAxLjM0MzE1IDIxIDMgMjFIMjFDMjIuNjU2OSAyMSAyNCAxOS42NTY5IDI0IDE4VjZDMjQgNC4zNDMxNSAyMi42NTY5IDMgMjEgM0gzWk0yMSA1SDNDMi40NDc3MiA1IDIgNS40NDc3MiAyIDZWOUgyMlY2QzIyIDUuNDQ3NzIgMjEuNTUyMyA1IDIxIDVaTTIgMThWMTFIMjJWMThDMjIgMTguNTUyMyAyMS41NTIzIDE5IDIxIDE5SDNDMi40NDc3MiAxOSAyIDE4LjU1MjMgMiAxOFoiCiAgICBmaWxsPSJjdXJyZW50Q29sb3IiCiAgLz4KPC9zdmc+",
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
    "description": "Hello world information",
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

