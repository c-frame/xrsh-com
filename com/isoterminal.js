function ISOTerminal(){
  // create a neutral isoterminal object which can be decorated
  // with prototype functions and has addListener() and dispatchEvent()
  let obj  = new EventTarget()
  // register default event listeners (enable file based features like isoterminal/jsconsole.js e.g.)
  for( let event in ISOTerminal.listener )
    for( let cb in ISOTerminal.listener[event] )
      obj.addEventListener( event, ISOTerminal.listener[event][cb] )
  // compose object with functions
  for( let i in ISOTerminal.prototype ) obj[i] = ISOTerminal.prototype[i]
  obj.emit('init')
  return obj
}

ISOTerminal.prototype.emit = function(event,data){
  data = data || false 
  this.dispatchEvent( new CustomEvent(event, {detail: data} ) )
}

ISOTerminal.addEventListener = (event,cb) => {
  ISOTerminal.listener = ISOTerminal.listener || {}
  ISOTerminal.listener[event] = ISOTerminal.listener[event] || []
  ISOTerminal.listener[event].push(cb)
}

// ISOTerminal has defacto support for AFRAME 
// but can be decorated to work without it as well

if( typeof AFRAME != 'undefined '){

  AFRAME.registerComponent('isoterminal', {
    schema: {
      iso:    { type:"string", "default":"com/isoterminal/images/buildroot-bzimage.bin" },
      cols:   { type: 'number',"default": 120 },
      rows:   { type: 'number',"default": 30 },
      padding:{ type: 'number',"default": 18 },
      transparent: { type:'boolean', "default":false } // need good gpu
    },

    init: async function(){
      this.el.object3D.visible = false
      this.initTerminal(true)
    },

    requires:{
      com:         "com/dom.js",
      window:      "com/window.js",
      xtermjs:     "https://unpkg.com/@xterm/xterm@5.5.0/lib/xterm.js",
      xtermcss:    "https://unpkg.com/@xterm/xterm@5.5.0/css/xterm.css",
      v86:         "com/isoterminal/libv86.js",
      // allow xrsh to selfcontain scene + itself
      xhook:       "https://jpillora.com/xhook/dist/xhook.min.js",
      selfcontain: "com/selfcontainer.js",
      // html to texture
      htmlinxr:    "com/html-as-texture-in-xr.js",
      // isoterminal features
      core:        "com/isoterminal/core.js",
      utils_9p:    "com/isoterminal/feat/9pfs_utils.js",
      boot:        "com/isoterminal/feat/boot.js",
      xterm:       "com/isoterminal/feat/xterm.js",
      jsconsole:   "com/isoterminal/feat/jsconsole.js",
      javascript:  "com/isoterminal/feat/javascript.js",
      index:       "com/isoterminal/feat/index.html.js",
    },

    dom: {
      scale:   0.5,
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
                          background: #000F; 
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

    initTerminal: async function(singleton){

      let s = await AFRAME.utils.require(this.requires)

      this.el.setAttribute("selfcontainer","")

      // *DISABLED* instance this component 
      // rason: we only need one term for now (more = too cpu heavy)
      let instance 
      if( singleton ){
        instance = this.el
      }else{
        if( this.instance ){
          const el = document.querySelector('.isoterminal')
          return console.warn('TODO: allow multiple terminals for future beefy devices(see v86 examples)')
        }
        instance = this.instance = this.el.cloneNode(false)
        this.el.sceneEl.appendChild( instance )
      }

      // init isoterminal
      this.isoterminal = new ISOTerminal()

      instance.addEventListener('DOMready', () => {
        instance.setAttribute("window", `title: xrsh [booting linux iso..]; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')
        // run iso
        let opts = {dom:instance.dom}
        for( let i in this.data ) opts[i] = this.data[i]
        this.isoterminal.runISO(opts)
      })

      this.isoterminal.addEventListener('ready', function(e){
        instance.dom.classList.remove('blink')
        instance.winbox.maximize()
        setTimeout( () => { // important: after window maximize animation to get true size
          instance.setAttribute("html-as-texture-in-xr", `domid: #${instance.uid}`)  // only show aframe-html in xr 
        },1500)
      })

      this.isoterminal.addEventListener('status', function(e){
        let msg = e.detail
        const w = instance.winbox
        if(!w) return
        w.titleBak = w.titleBak || w.title
        instance.winbox.setTitle( `${w.titleBak} [${msg}]` )
      })

      instance.addEventListener('window.onclose', (e) => {
        if( !confirm('do you want to kill this virtual machine and all its processes?') ) e.halt = true
      })

      const resize = (w,h) => {
        if( this.isoterminal.emulator && this.isoterminal.emulator.serial_adapter ){
          setTimeout( () => {
            this.isoterminal.xtermAutoResize(this.isoterminal.emulator.serial_adapter.term,instance,-5)
          },800) // wait for resize anim
        }
      }
      instance.addEventListener('window.onresize', resize )
      instance.addEventListener('window.onmaximize', resize )

      instance.setAttribute("dom",      "")

      const focus = () => {
        if( this.isoterminal?.emulator?.serial_adapter?.focus ){
          this.isoterminal.emulator.serial_adapter.term.focus()
        }
      }
      instance.addEventListener('obbcollisionstarted', focus )
      this.el.sceneEl.addEventListener('enter-vr', focus )
      this.el.sceneEl.addEventListener('enter-ar', focus )

      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
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
        this.initTerminal()
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
}
