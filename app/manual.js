AFRAME.registerComponent('manual', {
  schema: { 
    foo: { type:"string"}
  },

  requires:{},

  dom: {
    events:  ['click'],
    html:    (me) => `
              <div id="manual">
                <h1>Welcome to XRSHell</h1>
                <br>
                <img src="https://i.imgur.com/BW22wrb.png"/>
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
    css:     `
              #manual {
                padding:15px;
              }
              #manual img{
                width: 100%;
                max-width: 550px;
                border-radius: 7px;
              }

             `
  },

  events:{
    DOMready: function(e){},
    click:    function(e){}, // click was detected on this.el.dom or AFRAME entity
  },

  init: function () {  
    this.require( this.requires )
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "XRSH Manual",
    "name": "XRSH Manual",
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
          "usage":  "man xrsh",
          "example": "",
          "args":{
            "topic": {type:"string"}
          }
        },
        "short_name": "Today",
        "description": "View weather information for today",
        "url": "/today?source=pwa",
        "icons": [{ "src": "/images/today.png", "sizes": "192x192" }]
      }
    ],
    "description": "XRSH Manual information",
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

