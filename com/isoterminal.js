AFRAME.registerComponent('isoterminal', {
  schema: {
    iso:    { type:"string", "default":"com/isoterminal/xrsh.iso" },
    cols:   { type: 'number',"default": 120 },
    rows:   { type: 'number',"default": 30 },
    padding:{ type: 'number',"default": 15 },
    transparent: { type:'boolean', "default":false } // need good gpu
  },

  init: function(){
    this.el.object3D.visible = false
  },

  requires:{
    'window':    "com/window.js",
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
                        padding: ${me.com.data.padding}px;
                        /*overflow:hidden; */
                      }
                      .isoterminal *{
                         white-space: pre;
                         font-size: 14px;
                         font-family: Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                         font-weight:700;
                         display:inline;
                         overflow: hidden;
                      }
                      .wb-body:has(> .isoterminal){ background: #000; }
                      .isoterminal div{ display:block; }
                      .isoterminal span{ display: inline }

                      @keyframes fade {
                          from { opacity: 1.0; }
                          50% { opacity: 0.5; }
                          to { opacity: 1.0; }
                      }                                                                                                                                                                                                                                  

                      @-webkit-keyframes fade {
                          from { opacity: 1.0; }
                          50% { opacity: 0.5; }
                          to { opacity: 1.0; }
                      }

                      .blink {
                        animation:fade 1000ms infinite;
                        -webkit-animation:fade 1000ms infinite;
                      }
                      `
  },

  toUint8Array: function(str) {
    // Create a new Uint8Array with the same length as the input string
    const uint8Array = new Uint8Array(str.length);
    
    // Iterate over the string and populate the Uint8Array
    for (let i = 0; i < str.length; i++) {
        uint8Array[i] = str.charCodeAt(i);
    }
    return uint8Array;
  },

  runISO: function(dom){
    var emulator = window.emulator = dom.emulator = new V86({
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
      cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on init=/bin/date",
      //bzimage:{
      //  url: "com/isoterminal/images/buildroot-bzimage.bin"
      //},
      //bzimage_initrd_from_filesystem: true,
      //filesystem: {
      //          baseurl: "com/isoterminal/v86/images/alpine-rootfs-flat",
      //          basefs:  "com/isoterminal/v86/images/alpine-fs.json",
      //      },
      //screen_dummy: true,
      //disable_jit: false,
      filesystem: {},
      autostart: true,
    });

    emulator.bus.register("emulator-started", () => {
      emulator.create_file("motd", this.toUint8Array(`
[38;5;57m        ____  _____________  _________ ___ ___  
[38;5;93m        \   \/  /\______   \/   _____//   |   \ 
[38;5;93m         \     /  |       _/\_____  \/    ~    \
[38;5;129m        /     \  |    |   \/        \    Y    /
[38;5;165m       /___/\  \ |____|_  /_______  /\___|_  / 
[38;5;201m             \_/        \/        \/       \/  

      `+ "\033[0m" ))

      emulator.create_file("js", this.toUint8Array(`#!/bin/sh
        cat /mnt/motd 
        cat > /dev/null 
      `))
      //emulator.serial0_send('chmod +x /mnt/js')
      //emulator.serial0_send()
    });

    let line = ''
    emulator.add_listener("serial0-output-byte", async (byte) => {
        var chr = String.fromCharCode(byte);
        if(chr < " " && chr !== "\n" && chr !== "\t" || chr > "~")
        {
            return;
        }

        if(chr === "\n")
        {
            var new_line = line;
            line = "";
        }
        else if(chr >= " " && chr <= "~")
        {
            line += chr;
        }

        //if(!ran_command && line.endsWith("~% "))
        //{
        //    ran_command = true;
        //    emulator.serial0_send("chmod +x /mnt/test-i386\n");
        //    emulator.serial0_send("/mnt/test-i386 > /mnt/result\n");
        //    emulator.serial0_send("echo test fini''shed\n");
        //}
        //console.dir({line,new_line})

        if(new_line && new_line.includes("buildroot login:"))
        {
            emulator.serial0_send("root\n")
            emulator.serial0_send("mv /mnt/js . && chmod +x js\n")
        }
    });    
    
  },

  events:{

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, //
    keydown: function(e){ },

    // reactive events for this.data updates
    myvalue: function(e){ this.el.dom.querySelector('b').innerText = this.data.myvalue },

    ready: function( ){
      this.el.dom.style.display = 'none'
    },

    launcher: async function(){
      if( this.instance ){
        const el = document.querySelector('.isoterminal')
        el.classList.add('blink')
        setTimeout( () => el.classList.remove('blink'), 2000 )
        return console.warn('TODO: allow multiple terminals (see v86 examples)')
      }

      let s = await AFRAME.utils.require(this.requires)
      // instance this component
      const instance = this.instance = this.el.cloneNode(false)
      this.el.sceneEl.appendChild( instance )

      instance.addEventListener('DOMready', () => {
        this.runISO(instance.dom)
        instance.setAttribute("window", `title: ${this.data.iso}; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')
        // resize after the dom content has been rendered & updated 
        setTimeout( () => {
          let spans = [...instance.dom.querySelectorAll('span')]
          instance.winbox.resize( 
            (spans[0].offsetWidth + (2*this.data.padding))+'px', 
            ((spans.length * spans[0].offsetHeight) ) +'px' 
          )
        },1200)
        setTimeout( () => instance.dom.classList.remove('blink'), 5000 )
      })

      instance.addEventListener('window.onclose', (e) => {
        if( !confirm('do you want to kill this virtual machine and all its processes?') ) e.halt = true
      })

      instance.setAttribute("dom",      "")
      instance.setAttribute("xd",       "")  // allows flipping between DOM/WebGL when toggling XD-button
      instance.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      instance.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.5) )
      instance.setAttribute("grabbable","")

      const focus = () => document.querySelector('canvas.a-canvas').focus()
      instance.addEventListener('obbcollisionstarted', focus )
      this.el.sceneEl.addEventListener('enter-vr', focus )

      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "iso": "linux-x64-4.15.iso",
    "short_name": "ISOTerm",
    "name": "terminal",
    "icons": [
      {
        "src": "https://css.gg/terminal.svg",
        "src": "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBkPSJNNS4wMzMzIDE0LjgyODRMNi40NDc1MSAxNi4yNDI2TDEwLjY5MDIgMTJMNi40NDc1MSA3Ljc1NzMzTDUuMDMzMyA5LjE3MTU1TDcuODYxNzIgMTJMNS4wMzMzIDE0LjgyODRaIgogICAgZmlsbD0iY3VycmVudENvbG9yIgogIC8+CiAgPHBhdGggZD0iTTE1IDE0SDExVjE2SDE1VjE0WiIgZmlsbD0iY3VycmVudENvbG9yIiAvPgogIDxwYXRoCiAgICBmaWxsLXJ1bGU9ImV2ZW5vZGQiCiAgICBjbGlwLXJ1bGU9ImV2ZW5vZGQiCiAgICBkPSJNMiAyQzAuODk1NDMxIDIgMCAyLjg5NTQzIDAgNFYyMEMwIDIxLjEwNDYgMC44OTU0MyAyMiAyIDIySDIyQzIzLjEwNDYgMjIgMjQgMjEuMTA0NiAyNCAyMFY0QzI0IDIuODk1NDMgMjMuMTA0NiAyIDIyIDJIMlpNMjIgNEgyTDIgMjBIMjJWNFoiCiAgICBmaWxsPSJjdXJyZW50Q29sb3IiCiAgLz4KPC9zdmc+",
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
