AFRAME.registerComponent('helloworld-window', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {  

  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // deadsimple windows: https://nextapps-de.github.io/winbox
    stylis:      "https://unpkg.com/stylis@4.3.1/dist/umd/stylis.js",             // modern CSS (https://stylis.js.org)
  },

  dom: {
    scale:   3,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <div class="pad"> ${me.data.foo} <b>${me.data.myvalue}</b></span>
                      </div>`,
    css:     `.helloworld-window {
                div {
                  .pad { padding:11px; }
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
        new WinBox("Hello World",{ 
          width: 250,
          height: 150,
          x:"center",
          y:"center",
          id:  this.el.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: this.el.dom 
        });
      }, 500 )

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

