AFRAME.registerComponent('isoterminal', {
  schema: {
    iso:    { type:"string", "default":"com/isoterminal/images/buildroot-bzimage.bin" },
    cols:   { type: 'number',"default": 120 },
    rows:   { type: 'number',"default": 30 },
    padding:{ type: 'number',"default": 18 },
    transparent: { type:'boolean', "default":false } // need good gpu
  },

  init: function(){
    this.el.object3D.visible = false
  },

  requires:{
    'window':    "com/window.js",
    xtermjs:     "https://unpkg.com/@xterm/xterm@5.5.0/lib/xterm.js",
    xtermcss:    "https://unpkg.com/@xterm/xterm@5.5.0/css/xterm.css",
    v86:         "com/isoterminal/libv86.js"
    //axterm:      "https://unpkg.com/aframe-xterm-component/aframe-xterm-component.js"
  },

  dom: {
    scale:   0.7,
    events:  ['click','keydown'],
    html:    (me) => `<div class="isoterminal"></div>`,

    css:     (me) => `.isoterminal{
                        padding: ${me.com.data.padding}px;
                        width:100%;
                        height:100%;
                      }
                      .isoterminal *{
                         white-space: pre;
                         font-size: 14px;
                         font-family: Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                         font-weight:700;
                         display:inline;
                         overflow: hidden;
                      }

                      .isoterminal style{ display:none }

                      .wb-body:has(> .isoterminal){ 
                        background: #000c; 
                        overflow:hidden;
                      }

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

  runISO: function(dom,instance){
    //var term = new Terminal()
    //term.open(dom)
    //term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')``
    if( typeof Terminal == undefined ) throw 'xterm terminal not loaded'
    // monkeypatch Xterm (which V86 initializes) so we can add our own constructor args 
    window._Terminal = window.Terminal 
    window.Terminal = function(opts){
      const term = new window._Terminal({ ...opts,
        cursorBlink:true,
        onSelectionChange: function(e){
          debugger
        }
      })

      term.onSelectionChange( () => {
        document.execCommand('copy')
        term.select(0, 0, 0)
        instance.setStatus('copied to clipboard')
      })
      return term
    }

    instance.setStatus = (msg) => {
      const w = instance.winbox
      w.titleBak = w.titleBak || w.title
      instance.winbox.setTitle( `${w.titleBak} [${msg}]` )
    }

    let image = {}
    if( this.data.iso.match(/\.iso$/) ) image.cdrom   = { url: this.data.iso }
    if( this.data.iso.match(/\.bin$/) ) image.bzimage = { url: this.data.iso }

    var emulator = window.emulator = dom.emulator = new V86({ ...image,
      wasm_path:        "com/isoterminal/v86.wasm",
      memory_size:      32 * 1024 * 1024,
      vga_memory_size:  2 * 1024 * 1024,
      serial_container_xtermjs: dom,
      //screen_container: dom, //this.canvas.parentElement,
      bios: {
        url: "com/isoterminal/bios/seabios.bin",
      },
      vga_bios: {
        url: "com/isoterminal/bios/vgabios.bin",
      },
      network_relay_url: "wss://relay.widgetry.org/",
      cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on",
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

    const loading = [
      'loading quantum bits and bytes',
      'preparing quantum flux capacitors',
      'crunching peanuts and chakras',
      'preparing parallel universe',
      'loading quantum state fluctuations',
      'preparing godmode',
      'loading cat pawns and cuteness',
      'beaming up scotty',
      'still faster than Windows update',
      'loading a microlinux',
      'figuring out meaning of life',
      'Aligning your chakras now',
      'Breathing in good vibes',
      'Finding inner peace soon',
      'Centering your Zen energy',
      'Awakening third eye powers',
      'Tuning into the universe',
      'Balancing your cosmic karma',
      'Stretching time and space',
      'Recharging your soul battery',
      'Transcending earthly limits'
    ]

    let motd = "\n\r"
    motd += "[38;5;57m  " + ' ____  _____________  _________ ___ ___   ' + "\n\r"
    motd += "[38;5;93m  " + ' \\   \\/  /\\______   \\/   _____//   |   \\  ' + "\n\r"  
    motd += "[38;5;93m  " + '  \\     /  |       _/\\_____  \\/    ~    \\ ' + "\n\r"
    motd += "[38;5;129m " + '   /     \\  |    |   \\/        \\    Y    / ' + "\n\r"
    motd += "[38;5;165m " + '  /___/\\  \\ |____|_  /_______  /\\___|_  /  ' + "\n\r"
    motd += "[38;5;201m " + '        \\_/        \\/        \\/       \\/   ' + "\n\r"
    motd += "                                                                 \n\r"
    motd += `${loading[ Math.floor(Math.random()*1000) % loading.length-1 ]}, please wait..\n\r\n\r`
    motd += "\033[0m" 

    const files = [
      "com/isoterminal/mnt/js",
      "com/isoterminal/mnt/jsh",
      "com/isoterminal/mnt/confirm",
      "com/isoterminal/mnt/prompt",
      "com/isoterminal/mnt/alert",
      "com/isoterminal/mnt/hook",
      "com/isoterminal/mnt/xrsh",
      "com/isoterminal/mnt/profile",
      "com/isoterminal/mnt/profile.xrsh",
      "com/isoterminal/mnt/profile.js",
      "com/isoterminal/mnt/motd",
      "com/isoterminal/mnt/v86pipe"
    ]

    const redirectConsole = (handler) => {
       const log = console.log;
       const dir = console.dir;
       const err = console.error;
       const warn = console.warn;
       console.log = (...args)=>{
           const textArg = args[0];
           handler(textArg+'\n');
           log.apply(log, args);
       };
       console.error = (...args)=>{
           const textArg = args[0].message?args[0].message:args[0];
           handler( textArg+'\n', '\x1b[31merror\x1b[0m');
           err.apply(log, args);
       };
       console.dir = (...args)=>{
           const textArg = args[0].message?args[0].message:args[0];
           handler( JSON.stringify(textArg,null,2)+'\n');
           dir.apply(log, args);
       };
       console.warn = (...args)=>{
           const textArg = args[0].message?args[0].message:args[0];
           handler(textArg+'\n','\x1b[38;5;208mwarn\x1b[0m');
           err.apply(log, args);
       };
    }

    emulator.bus.register("emulator-started", async () => {
      emulator.serial_adapter.term.element.querySelector('.xterm-viewport').style.background = 'transparent'
      emulator.serial_adapter.term.clear()
      emulator.serial_adapter.term.write(motd)

      emulator.create_file("motd", this.toUint8Array(motd) )
      emulator.create_file("js", this.toUint8Array(`#!/bin/sh
        cat /mnt/motd 
        cat > /dev/null 
      `))

      redirectConsole( (str,prefix) => {
        if( emulator.log_to_tty ){
          prefix = prefix ? prefix+' ' : ' '
          str.trim().split("\n").map( (line) => {
            emulator.serial_adapter.term.write( '\r\x1b[38;5;165m/dev/browser: \x1b[0m'+prefix+line+'\n' )
          })
          emulator.serial_adapter.term.write( '\r' )
        }
        emulator.create_file( "console", this.toUint8Array( str ) )
      })

      let p = files.map( (f) => fetch(f) )
      Promise.all(p)
      .then( (files) => {
        files.map( (f) => {
          f.arrayBuffer().then( (buf) => {
            emulator.create_file( f.url.replace(/.*mnt\//,''), new Uint8Array(buf) )
          })
        })
      })

      //emulator.serial0_send('chmod +x /mnt/js')
      //emulator.serial0_send()
      let line = ''
      let ready = false
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
          if( !ready && line.match(/^(\/ #|~%)/) ){
            instance.dom.classList.remove('blink')
            // set environment
            let env = ['export BROWSER=1']
            for ( let i in document.location ){
              if( typeof document.location[i] == 'string' )
                env.push( 'export '+String(i).toUpperCase()+'="'+document.location[i]+'"')
            }
            env.map( (e) => emulator.serial0_send(`echo '${e}' >> /mnt/profile\n`) )
            let boot = `source /mnt/profile; js "$(cat /mnt/profile.js)"`
            // exec hash as extra boot cmd
            if( document.location.hash.length > 1 ){ 
              boot += ` && cmd='${decodeURI(document.location.hash.substr(1))}' && $cmd`
            }
            emulator.serial0_send(boot+"\n")
            instance.winbox.maximize()
            emulator.serial_adapter.term.focus()
            ready = true
              //emulator.serial0_send("root\n")
              //emulator.serial0_send("mv /mnt/js . && chmod +x js\n")
          }
      });    

      // unix to js device
      emulator.add_listener("9p-write-end", async (opts) => {
        const decoder = new TextDecoder('utf-8');

        if ( opts[0] == 'js' ){
          const buf = await emulator.read_file("dev/browser/js")
          const script = decoder.decode(buf)
          try{
            let res = (new Function(`${script}`))()
            if( res && typeof res != 'string' ) res = JSON.stringify(res,null,2)
          }catch(e){ 
            console.error(e)
          }
        }
      })

      // enable/disable logging file (echo 1 > mnt/console.tty) 
      emulator.add_listener("9p-write-end", async (opts) => {
        const decoder = new TextDecoder('utf-8');
        if ( opts[0] == 'console.tty' ){
          const buf = await emulator.read_file("console.tty")
          const val = decoder.decode(buf)
          emulator.log_to_tty = ( String(val).trim() == '1')
        }
      })
    
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
        return console.warn('TODO: allow multiple terminals (see v86 examples)')
      }

      let s = await AFRAME.utils.require(this.requires)
      // instance this component
      const instance = this.instance = this.el.cloneNode(false)
      this.el.sceneEl.appendChild( instance )

      instance.addEventListener('DOMready', () => {
        this.runISO(instance.dom, instance)
        instance.setAttribute("window", `title: ${this.data.iso}; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')
      })

      instance.addEventListener('window.onclose', (e) => {
        if( !confirm('do you want to kill this virtual machine and all its processes?') ) e.halt = true
      })

      const resize = (w,h) => {
        if( instance.dom.emulator && instance.dom.emulator.serial_adapter ){
          setTimeout( () => {
            this.autoResize(instance.dom.emulator.serial_adapter.term,instance,-5)
          },500) // wait for resize anim
        }
      }
      instance.addEventListener('window.onresize', resize )
      instance.addEventListener('window.onmaximize', resize )

      instance.setAttribute("dom",      "")
      instance.setAttribute("xd",       "")  // allows flipping between DOM/WebGL when toggling XD-button
      instance.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      instance.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(0.5) )

      const focus = () => document.querySelector('canvas.a-canvas').focus()
      instance.addEventListener('obbcollisionstarted', focus )
      this.el.sceneEl.addEventListener('enter-vr', focus )

      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
    }

  },

  autoResize: function(term,instance,rowoffset){
    if( !term.element ) return

    const defaultScrollWidth = 24;
    const MINIMUM_COLS = 2;
    const MINIMUM_ROWS = 2;

    const dims = term._core._renderService.dimensions;
    const scrollbarWidth = (term.options.scrollback === 0
      ? 0
      : (term.options.overviewRuler?.width || defaultScrollWidth ));

    const parentElementStyle = window.getComputedStyle(instance.dom);
    const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
    const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')));
    const elementStyle = window.getComputedStyle(term.element);
    const elementPadding = {
      top: parseInt(elementStyle.getPropertyValue('padding-top')),
      bottom: parseInt(elementStyle.getPropertyValue('padding-bottom')),
      right: parseInt(elementStyle.getPropertyValue('padding-right')),
      left: parseInt(elementStyle.getPropertyValue('padding-left'))
    };
    const elementPaddingVer = elementPadding.top + elementPadding.bottom;
    const elementPaddingHor = elementPadding.right + elementPadding.left;
    const availableHeight = parentElementHeight - elementPaddingVer;
    const availableWidth = parentElementWidth - elementPaddingHor - scrollbarWidth;
    const geometry = {
      cols: Math.max(MINIMUM_COLS, Math.floor(availableWidth / dims.css.cell.width)),
      rows: Math.max(MINIMUM_ROWS, Math.floor(availableHeight / dims.css.cell.height))
    };
    term.resize(geometry.cols, geometry.rows + (rowoffset||0) );
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
