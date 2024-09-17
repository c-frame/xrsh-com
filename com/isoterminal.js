function ISOTerminal(instance,opts){
  // create a neutral isoterminal object which can be decorated
  // with prototype functions and has addListener() and dispatchEvent()
  let obj      = new EventTarget()
  obj.instance = instance
  obj.opts     = opts 
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
      iso:         { type:"string", "default":"https://forgejo.isvery.ninja/assets/xrsh-buildroot/main/xrsh.iso" },
      overlayfs:   { type:"string"},
      cols:        { type: 'number',"default": 120 },
      rows:        { type: 'number',"default": 30 },
      padding:     { type: 'number',"default": 18 },
      minimized:   { type: 'boolean',"default":false},
      maximized:   { type: 'boolean',"default":true},
      transparent: { type:'boolean', "default":false }, // need good gpu
      xterm:       { type: 'boolean', "default":true }, // use xterm.js (slower)
      memory:      { type: 'number', "default":48   }  // VM memory (in MB)
    },

    init: async function(){
      this.el.object3D.visible = false
      fetch(this.data.iso,{method: 'HEAD'})
      .then( (res) => {
        if( res.status != 200 ) throw 'not found'
      })
      .catch( (e) => {
        console.warn(this.data.iso+" could not be loaded, loading fallback ISO URL:")
        console.warn(this.schema.iso.default)
        this.data.iso = this.schema.iso.default
      })
      .finally( () => this.initTerminal(true) )
    },

    requires:{
      com:         "com/dom.js",
      window:      "com/window.js",
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
      jsconsole:   "com/isoterminal/feat/jsconsole.js",
      javascript:  "com/isoterminal/feat/javascript.js",
      indexhtml:   "com/isoterminal/feat/index.html.js",
      indexjs:     "com/isoterminal/feat/index.js.js",
      autorestore: "com/isoterminal/feat/autorestore.js",
      localforage: "https://cdn.rawgit.com/mozilla/localForage/master/dist/localforage.js"
    },

    dom: {
      scale:   0.5,
      events:  ['click','keydown'],
      html:    (me) => `<div class="isoterminal">
                          <div id="screen" style="white-space: pre; font: 14px monospace; "></div>
                          <canvas style="display: none"></canvas> 
<div id="serial"></div>
                        </div>`,

      css:     (me) => `.isoterminal{
                          padding: ${me.com.data.padding}px;
                          width:100%;
                          height:100%;
                        }
                        @font-face {
                          font-family: 'Cousine';
                          font-style: normal;
                          font-weight: 400;
                          src: url(./assets/Cousine.ttf) format('truetype');
                        }
                        .isoterminal *{
                           white-space: pre;
                           line-height:16px;
                           display:inline;
                           overflow: hidden;
                        }
                        .isoterminal *,
                        .xterm-dom-renderer-owner-1 .xterm-rows {
                           font-size: 14px;
                           font-family: "Cousine",Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                           font-weight:500 !important;
                           letter-spacing: 0 !important;
                           text-shadow: 0px 0px 10px #F075;
                        }

                        .isoterminal style{ display:none }

                        .wb-body:has(> .isoterminal){ 
                          background: #000C; 
                          overflow:hidden;
                        }

                        .XR .wb-body:has(> .isoterminal){
                          background: #000;
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

      if( this.data.xterm ){
        this.requires.xtermjs  = "https://unpkg.com/@xterm/xterm@5.5.0/lib/xterm.js"
        this.requires.xtermcss = "https://unpkg.com/@xterm/xterm@5.5.0/css/xterm.css"
        this.requires.xterm    = "com/isoterminal/feat/xterm.js"
      }

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
      this.isoterminal = new ISOTerminal(instance,this.data)

      instance.addEventListener('DOMready', () => {
        //instance.winbox.resize(720,380)
        let size = this.data.xterm ? 'width: 1024px; height:600px'
                                   : 'width: 720px; height:455px'
        instance.setAttribute("window", `title: xrsh.iso; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}; ${size}; min: ${this.data.minimized}; max: ${this.data.maximized}`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')
        // run iso
        let opts = {dom:instance.dom}
        for( let i in this.data ) opts[i] = this.data[i]
        this.isoterminal.runISO(opts)
      })

      instance.setAttribute("dom",      "")


      this.isoterminal.addEventListener('postReady', (e)=>{
        // bugfix: send window dimensions to xterm (xterm.js does that from dom-sizechange to xterm via escape codes)
        let wb = instance.winbox
        if( this.data.maximized ){
          wb.restore()
          wb.maximize()
        }else wb.resize() 
      })

      this.isoterminal.addEventListener('ready', (e)=>{
        instance.dom.classList.remove('blink')
        this.isoterminal.emit('status',"running")
        setTimeout( () => { // important: after window maximize animation to get true size
          instance.setAttribute("html-as-texture-in-xr", `domid: #${instance.uid}`)  // only show aframe-html in xr 
        },1500)
      })

      this.isoterminal.addEventListener('status', function(e){
        let msg = e.detail
        const w = instance.winbox
        if(!w) return
        w.titleBak = w.titleBak || w.title
        w.setTitle( `${w.titleBak} [${msg}]` )
      })

      instance.addEventListener('window.onclose', (e) => {
        if( !confirm('do you want to kill this virtual machine and all its processes?') ) e.halt = true
      })

      const resize = (w,h) => { }
      instance.addEventListener('window.onresize', resize )
      instance.addEventListener('window.onmaximize', resize )

      const focus = (e) => {
        if( this.isoterminal?.emulator?.serial_adapter?.term ){
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
