AFRAME.registerComponent('manual', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {  
      //AFRAME.XRF.navigator.to("https://coderofsalvation.github.io/xrsh-media/assets/background.glb")
  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",     // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",        // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",          // deadsimple windows: https://nextapps-de.github.io/winbox
    xrfragments: "https://xrfragment.org/dist/xrfragment.aframe.js",
  },

  dom: {
    scale:   3,
    events:  ['click','keydown'],
    html:    (me) => `<div>

                  <h1>Welcome to XRSHell</h1>
                  <br>
                  <!-- <img src="https://i.imgur.com/BW22wrb.png"/> -->
                  <br><br>
                  The <b>xrsh</b> (xrshell) brings the <a href="https://en.wikipedia.org/wiki/Free_and_open-source_software" target="_blank">FOSS</a>- and <a href="https://en.wikipedia.org/wiki/Linux" target="_blank">Linux</a>-soul to <a href="https://en.wikipedia.org/wiki/WebXR" target="_blank">WebXR</a>, promoting the use of (interactive text) terminal and user-provided operating systems inside WebXR.
                  <br><br>Technically, <b>xrsh</b> is a bundle of freshly created re-usable FOSS WebXR components.<br>These provide a common filesystem interface for interacting with WebXR, offering the well-known linux/unix toolchain including a commandline to invoke, store, edit and run WebXR utilities - regardless of their implementation.
                  <br><br>Think of it as termux for the VR/AR headset browser, which can be used to e.g. livecode (using terminal auto-completion!) for XR component (registries).                

                  <br>
                  <ul>
                    <li><a href="https://forgejo.isvery.ninja/xrsh" target="_blank">source xrsh</a></li>
                    <li><a href="https://forgejo.isvery.ninja/xrsh-apps" target="_blank">source xrsh apps</a></li>
                    <li><a href="https://forgejo.isvery.ninja/xrsh-media" target="_blank">roadmap meeting recordings</a></li>
                  </ul>

                      </div>`,
    css:     `.manual {
                div {
                  padding:11px;
                }
              }
              `,
  },

  events:{

    // component events
    html:     function( ){ console.log("html-mesh requirement mounted") },
    stylis:   function( ){ console.log("stylis    requirement mounted") },

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, // 
    keydown: function(e){ }, // 

    // reactive events for this.data updates 
    myvalue: function(e){ this.el.dom.querySelector('b').innerText = this.data.myvalue },

    // requires are loaded
    ready: function(e){

      setTimeout( () => {
        new WinBox("XRSH manual",{ 
          width:300,
          height:300,
          x:"center",
          y:"center",
          id:  this.el.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: this.el.dom 
        });
      }, 500 )

      this.el.setAttribute("xrf","https://coderofsalvation.github.io/xrsh-media/assets/background.glb")
      // navigate with: AFRAME.XRF.navigator.to("https://xrfragment.org/index.glb")
    },

    DOMready: function( ){ 
      console.log("this.el.dom has been added to DOM")
      this.data.myvalue = 1
      setInterval( () => this.data.myvalue++, 100 )
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "/images/icons-vector.svg",
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

