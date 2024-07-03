AFRAME.registerComponent('isoterminal', {
  schema: {
    iso:  { type:"string", "default":"com/isoterminal/xrsh.iso" },
    cols: { type: 'number', default: 120 },
    rows: { type: 'number', default: 30 },
    transparent: { type:'boolean', default:false } // need good gpu
  },

  init: function(){
    this.el.object3D.visible = false
  },

  requires:{
    'window':    "com/window.js",
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       //
    xtermcss:    "https://unpkg.com/xterm@3.12.0/dist/xterm.css",
    xtermjs:     "https://unpkg.com/xterm@3.12.0/dist/xterm.js",
    v86:         "com/isoterminal/libv86.js"
    //axterm:      "https://unpkg.com/aframe-xterm-component/aframe-xterm-component.js"
  },

  dom: {
    scale:   0.7,
    events:  ['click','keydown'],
    html:    (me) => `<div class="isoterminal">
                        <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
                        <canvas></canvas>
                      </div>`,

    css:     (me) => `.isoterminal{
                        background:#000;
                        padding:15px;
                        /*overflow:hidden; */
                      }
                      .isoterminal *{
                         white-space: pre;
                         font-size: 14px;
                         font-family: Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                         display: block;
                         font-weight:700;
                      }
                      .terminal{
                        padding:15px;
                      }`
  },

  runISO: function(dom){
    var emulator = window.emulator = new V86({
      wasm_path:        "com/isoterminal/v86.wasm",
      memory_size:      32 * 1024 * 1024,
      vga_memory_size:  2 * 1024 * 1024,
      screen_container: dom, //this.canvas.parentElement,
      bios: {
        url: "com/isoterminal/bios/seabios.bin",
      },
      vga_bios: {
        url: "com/isoterminal/bios/vgabios.bin",
      },
      network_relay_url: "wss://relay.widgetry.org/",
      cdrom: {
        url: this.data.iso,
      },
      network_relay_url: "<UNUSED>",
      cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on",
      //bzimage:{
      //  url: "com/isoterminal/images/buildroot-bzimage.bin"
      //},
      //bzimage_initrd_from_filesystem: true,
      //filesystem: {
      //          baseurl: "com/isoterminal/v86/images/alpine-rootfs-flat",
      //          basefs:  "com/isoterminal/v86/images/alpine-fs.json",
      //      },
      screen_dummy: true,
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

      instance.addEventListener('DOMready', () => {
        this.runISO(instance.dom)
        instance.setAttribute("window",   `title: ${this.data.iso}; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}`)
      })

      instance.addEventListener('window.onclose', (e) => {
        if( !confirm('do you want to kill this virtual machine and all its processes?') ) e.halt = true
      })

      instance.setAttribute("dom",      "")
      instance.setAttribute("xd",       "")  // allows flipping between DOM/WebGL when toggling XD-button
      instance.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      instance.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.5) )
      instance.setAttribute("grabbable","")

      this.el.sceneEl.addEventListener('enter-vr', function(){
        instance.dom.focus()
        console.log("focusing terminal")
      })

      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
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
