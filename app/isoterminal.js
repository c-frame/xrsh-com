AFRAME.registerComponent('isoterminal', {
  schema: { 
    foo: { type:"string"}
  },

  init: function(){},

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
  },

  dom: {
    scale:   3,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <div class="pad">to be implemented</span>
                      </div>`,

    css:     `.helloworld-window div.pad { padding:11px; }`
  },

  events:{

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, // 
    keydown: function(e){ }, // 

    // reactive events for this.data updates 
    myvalue: function(e){ this.el.dom.querySelector('b').innerText = this.data.myvalue },

    ready: function( ){ 
      this.el.dom.style.display = 'none'
    },

    launcher:  function(){
      new WinBox( this.manifest.iso + ' ' + this.manifest.name, { 
        width: '70%',
        height: '80%',
        x:"center",
        y:"center",
        id:  this.el.uid, // important hint for html-mesh  
        root: document.querySelector("#overlay"),
        mount: this.el.dom,
        onclose: () => { 
          if( !confirm('do you want to kill this virtual machine and all its processes?') ) return true 
          this.el.dom.style.display = 'none'
          return false
        }
      });
      this.el.dom.style.display = ''
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "iso": "linux-x64-4.15.iso",
    "short_name": "ISOTerm",
    "name": "terminal",
    "icons": [
      {
        "src": "https://css.gg/terminal.svg",
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

