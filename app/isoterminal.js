AFRAME.registerComponent('isoterminal', {
  schema: { 
    foo: { type:"string"}
  },

  init: function(){},

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
    xtermcss:    "https://unpkg.com/xterm@3.12.0/dist/xterm.css",
    xtermjs:     "https://unpkg.com/xterm@3.12.0/dist/xterm.js",
    axterm:      "https://unpkg.com/aframe-xterm-component/aframe-xterm-component.js"
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
      this.el.dom.style.display = ''
      this.el.innerHTML += `
        <a-curvedimage
          class="terminal"
          xterm-shell
          theta-length="60"
          radius="6"
          height="4"
          rotation="0 150 0"
          position="0 2 -2"
        ></a-curvedimage>
      `
      setTimeout( () => {
        let el = this.el.querySelector('a-curvedimage')

        el.object3D.children[0].material.transparent = false

        const message = 'Hello from \x1B[1;3;31mWebVR\x1B[0m !\r\n$ '
        const xterm = el.components['xterm']
        xterm.write(message)

        this.el.addEventListener('xterm-data', ({detail}) => {
          console.log('Got input from terminal', detail)
        })

        //new WinBox( this.manifest.iso + ' ' + this.manifest.name, { 
        //  width: '70%',
        //  height: '80%',
        //  x:"center",
        //  y:"center",
        //  id:  this.el.uid, // important hint for html-mesh  
        //  root: document.querySelector("#overlay"),
        //  mount: this.el.dom,
        //  onclose: () => { 
        //    if( !confirm('do you want to kill this virtual machine and all its processes?') ) return true 
        //    this.el.dom.style.display = 'none'
        //    return false
        //  }
        //});
      },500)
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

AFRAME.registerComponent('xterm-shell', {
  dependencies: ['xterm'],
  init: function() {
    const message = 'Run \x1B[1;3;31m\'node server.js\'\x1B[0m to open a shell\r\n'
    const xterm = this.el.components['xterm']

    xterm.write(message)

    const socket = new WebSocket('ws://localhost:8080/')

    // Listen on data, write it to the terminal
    socket.onmessage = ({data}) => {
      xterm.write(data)
    }

    socket.onclose = () => {
      xterm.write('\r\nConnection closed.\r\n')
    }

    // Listen on user input, send it to the connection
    this.el.addEventListener('xterm-data', ({detail}) => {
      socket.send(detail)
    })
  }
})
