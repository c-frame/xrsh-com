AFRAME.registerComponent('isoterminal', {
  schema: {
    cols: { type: 'number', default: 120 },
    rows: { type: 'number', default: 50 },
    transparent: { type:'boolean', default:false } // need good gpu
  },

  init: function(){
    this.el.object3D.visible = false
  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       //
    xtermcss:    "https://unpkg.com/xterm@3.12.0/dist/xterm.css",
    xtermjs:     "https://unpkg.com/xterm@3.12.0/dist/xterm.js",
    v86:         "com/isoterminal/libv86.js"
    //axterm:      "https://unpkg.com/aframe-xterm-component/aframe-xterm-component.js"
  },

  dom: {
    scale:   3,
    events:  ['click','keydown'],
    html:    (me) => `<div></div>`,

    css:     (me) => `.isoterminal{
                overflow:hidden;
              }`
  },

  createTerminal: async function(instance){
    const dom = instance.dom
    let s = await AFRAME.utils.require(this.requires)
    //this.el.object3D.visible = true

    const term = this.term = new Terminal({
      allowTransparency: this.data.transparent,
      cursorBlink: true,
      disableStdin: false,
      rows: this.data.rows,
      cols: this.data.cols,
      fontSize: 16
    })

    term.open(dom)
    this.canvas = dom.querySelector('.xterm-text-layer')
    this.canvas.id = 'terminal-' + instance.uid 
    this.canvasContext = this.canvas.getContext('2d')

    this.cursorCanvas = dom.querySelector('.xterm-cursor-layer')

    //this.el.setAttribute('material', `transparent: ${this.data.transparent?'true':'false'}; src: #${this.canvas.id}` )

    term.on('refresh', () => {
      console.log("refresh")
    })

    term.on('data', (data) => {
      this.el.emit('xterm-data', data)
    })

    this.el.addEventListener('click', () => {
      term.focus()
    })

    const message = 'Hello from \x1B[1;3;31mWebVR\x1B[0m !\r\n$ '
    term.write(message)

    this.runISO()
  },

  runISO: function(){
    console.dir(this.canvas)
    var emulator = window.emulator = new V86({
      wasm_path: "com/isoterminal/v86.wasm",
      memory_size: 32 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      screen_container: this.canvas, 
      bios: {
        url: "com/isoterminal/bios/seabios.bin",
      },
      vga_bios: {
        url: "com/isoterminal/bios/vgabios.bin",
      },
      cdrom: {
        url: "com/isoterminal/xrsh.iso",
      },
      autostart: true,
    });
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
        this.createTerminal(instance)
        const com = instance.components['isoterminal']
        instance.dom.style.display = 'none'
        new WinBox("Hello World",{ 
          width: window.innerWidth*0.5, 
          height: window.innerHeight*0.5,
          x:"center",
          y:"center",
          id:  instance.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: instance.dom,
          onclose: () => {
            if( !confirm('do you want to kill this virtual machine and all its processes?') ) return true
            instance.dom.style.display = 'none';
            return false
          },
          oncreate: () => instance.setAttribute("html",`html:#${instance.uid}; cursor:#cursor`)
        });
        instance.dom.style.display = '' // show

        // hint grabbable's obb-collider to track the window-object 
        instance.components['obb-collider'].data.trackedObject3D = 'components.html.el.object3D.children.0'
        instance.components['obb-collider'].update() 

        // data2event demo
        //instance.setAttribute("data2event","")
        //com.data.myvalue = 1
        //com.data.foo     = `instance ${instance.uid}: `
        //setInterval( () => com.data.myvalue++, 500 )
      }

      setTimeout( () => setupWindow(), 10 ) // give new components time to init

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
