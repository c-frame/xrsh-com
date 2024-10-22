/* 
 *
 *                   css/html template                                                                                
 *                                                                                                                     
 *                     ┌─────────┐   ┌────────────┐  ┌─────────────┐            exit-AR                                
 *            ┌───────►│ com/dom ┼──►│ com/window ├─►│ domrenderer │◄────────── exit-VR  ◄─┐                           
 *            │        └─────────┘   └────────────┘  └─────▲───────┘                       │                           
 *            │                                            │         ┌───────────────┐     │                           
 * ┌──────────┴────────┐                             ┌─────┴──────┐  │  xterm.js     │  ┌─────────────────────────────┐
 * │  com/isoterminal  ├────────────────────────────►│com/xterm.js│◄─┤               │  │com/html-as-texture-in-XR.js │
 * └────────┬─┬────────┘                             └──┬──────┬▲─┘  │  xterm.css    │  └─────────────────────────────┘
 *          │ │        ┌────────┐             ┌─────────▼──┐   ││    └───────────────┘     │     ▲                     
 *          │ └───────►│ plane  ├─────►text───┼►canvas     │◄────────────────── enter-VR   │     │                     
 *          │          └────────┘             └────────────┘   ││               enter-AR ◄─┘     │                     
 *          │                                renderer=canvas   ││                                │                     
 *          │                                                  ││                                │                     
 *          │                      ISOTerminal.js              ││                                │                     
 *          │                ┌───────────────────────────┐◄────┘│                                │                     
 *          │                │ com/isoterminal/worker.js ├──────┘                                │                     
 *          │                └──────────────┌────────────┤                                       │                     
 *          │                               │ v86.js     │                                       │                     
 *          │                               │ feat/*.js  │                                       │                     
 *          │                               │ libv86.js  │                                       │                     
 *          │                               └────────────┘                                       │                     
 *          │                                                                                    │                     
 *          └────────────────────────────────────────────────────────────────────────────────────┘                     
 *                                                                                                                     
 * NOTE: For convenience reasons, events are forwarded between com/isoterminal.js, worker.js and ISOTerminal
 *       Instead of a melting pot of different functionnames, events are flowing through everything (ISOTerminal.emit())
 */ 

if( typeof AFRAME != 'undefined '){

  AFRAME.registerComponent('isoterminal', {
    schema: {
      iso:            { type:"string", "default":"https://forgejo.isvery.ninja/assets/xrsh-buildroot/main/xrsh.iso" },
      overlayfs:      { type:"string"},
      width:          { type: 'number',"default": -1 },
      height:         { type: 'number',"default": -1 },
      lineHeight:     { type: 'number',"default": 18 },
      padding:        { type: 'number',"default": 18 },
      minimized:      { type: 'boolean',"default":false},
      maximized:      { type: 'boolean',"default":true},
      muteUntilPrompt:{ type: 'boolean',"default":true},     // mute stdout until a prompt is detected in ISO
      HUD:            { type: 'boolean',"default":false},    // link to camera movement 
      transparent:    { type:'boolean', "default":false },   // need good gpu
      memory:         { type: 'number',  "default":64  },    // VM memory (in MB)
      bufferLatency:  { type: 'number', "default":30  },    // in ms: bufferlatency from webworker to xterm (batch-update every char to texture)
      debug:          { type: 'boolean', "default":false }
    },

    init: function(){
      this.el.object3D.visible = false
      if( this.data.width == -1  ) this.data.width = document.body.offsetWidth
      if( this.data.height == -1 ) this.data.height = document.body.offsetHeight
      this.data.width -= this.data.padding*2
      this.data.height -= this.data.padding*2

      this.initHud()
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
      com:           "com/dom.js",
      window:        "com/window.js",
      v86:           "com/isoterminal/libv86.js",
      vt100:         "com/isoterminal/VT100.js",
      // allow xrsh to selfcontain scene + itself
      xhook:         "https://jpillora.com/xhook/dist/xhook.min.js",
      selfcontain:   "com/selfcontainer.js",
      // html to texture
      htmlinxr:      "com/html-as-texture-in-xr.js",
      // isoterminal features
      PromiseWorker: "com/isoterminal/PromiseWorker.js",
      ISOTerminal:   "com/isoterminal/ISOTerminal.js",
      localforage:   "https://cdn.rawgit.com/mozilla/localForage/master/dist/localforage.js"
    },

    dom: {
      scale: 1.0,
      events:  ['click','keydown'],
      html:    (me) => `<div class="isoterminal">
                          <div id="vt100" tabindex="0">
                            <pre></pre>
                          </div>
                        </div>`,

      css:     (me) => `.isoterminal{
                          padding: ${me.com.data.padding}px;
                          width:100%;
                          height:100%;
                          position:relative;
                        }
                        .isoterminal div{
                          display:block;
                          position:relative;
                          line-height: ${me.com.data.lineHeight}px;
                        }
                        #vt100 {
                          outline: none !important;
                        }
                        @font-face {
                          font-family: 'Cousine';
                          font-style: normal;
                          font-weight: 400;
                          src: url(./com/isoterminal/assets/Cousine.ttf) format('truetype');
                        }
                        @font-face {
                          font-family: 'Cousine';
                          font-style: normal;
                          font-weight: 700;
                          src: url(./com/isoterminal/assets/CousineBold.ttf) format('truetype');
                        }

                        .isoterminal style{ display:none }

                        blink{ 
                          border:none;
                          padding:none;
                        }
                        span blink:last-of-type{
                          border-right: 8px solid #F07;
                          padding-right: 3px;
                        }

                        #overlay .winbox:has(> .isoterminal){ 
                          background:transparent;
                          box-shadow:none;
                        }

                        .wb-body:has(> .isoterminal){ 
                          background: #000C;
                          overflow:hidden;
                        }

                        .XR .wb-body:has(> .isoterminal){ 
                          background: transparent;
                        }

                        .XR .isoterminal{
                          background: #000;
                        }
                        .isoterminal *{
                          font-size: 14px;
                          font-family: "Cousine",Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                          font-weight:500 !important;
                          text-shadow: 0px 0px 10px #F075;
                        }

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

                        .blink{
                          animation:fade 1000ms infinite;
                          -webkit-animation:fade 1000ms infinite;
                        }

                        `
    },

    initTerminal: async function(singleton){

      // why not latest xterm or v3.12 with builtin-canvas support?
      // first versions used 1.5.4, a typescript rewrite which:
      // * acts weird with oculus browser keyboard (does not repaint properly after typing)
      // * does not use canvas anymore [which would be ideal for THREE.js texture]
      // * does not allow switching between dom/canvas
      // * only allows a standalone WebGL addon (conflicts with THREE)
      // * heavily dependent on requestAnimationFrame (conflicts with THREE)
      // * typescript-rewrite results in ~300k lib (instead of 96k)
      // * v3.12 had slightly better performance but still very heavy

      await AFRAME.utils.require(this.requires)
      await AFRAME.utils.require({ // ISOTerminal plugins
        boot:          "com/isoterminal/feat/boot.js",
        javascript:    "com/isoterminal/feat/javascript.js",
        jsconsole:     "com/isoterminal/feat/jsconsole.js",
        indexhtml:     "com/isoterminal/feat/index.html.js",
        indexjs:       "com/isoterminal/feat/index.js.js",
        autorestore: "com/isoterminal/feat/autorestore.js",
      })

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
      this.term = new ISOTerminal(instance,this.data)

      instance.addEventListener('DOMready', () => {
        instance.setAttribute("html-as-texture-in-xr", `domid: #${this.el.dom.id}; faceuser: true`)
        setTimeout( () => this.setupVT100(instance),100)
        //instance.winbox.resize(720,380)
        let size = `width: ${this.data.width}; height: ${this.data.height}`
        instance.setAttribute("window", `title: xrsh.iso; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}; ${size}; min: ${this.data.minimized}; max: ${this.data.maximized}`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')

        // run iso
        let opts = {dom:instance.dom}
        for( let i in this.data ) opts[i] = this.data[i]
        this.term.start(opts)
      })

      instance.setAttribute("dom",      "")

      this.term.addEventListener('ready', (e) => {
        instance.dom.classList.remove('blink')
        this.term.emit('status',"running")
        if( this.data.debug ) this.runTests()
      })

      this.term.addEventListener('status', function(e){
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

      const focus = (showdom) => (e) => {
        if( this.el.components.window && this.data.renderer == 'canvas'){
          this.el.components.window.show( showdom )
        }
      }

      this.el.addEventListener('obbcollisionstarted', focus(false) )
      this.el.sceneEl.addEventListener('enter-vr', focus(false) )
      this.el.sceneEl.addEventListener('enter-ar', focus(false) )
      this.el.sceneEl.addEventListener('exit-vr', focus(true) )
      this.el.sceneEl.addEventListener('exit-ar', focus(true) )

      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
    },

    initHud: function(){
      if( AFRAME.utils.device.isMobile() ) this.data.HUD = true 
      if( this.data.HUD ){
        document.querySelector('[camera]').appendChild( this.el )
        this.el.setAttribute("position","0 -0.03 -0.4")
      }
    },

    runTests: async function(){
      await AFRAME.utils.require({
        "test_util":       "tests/util.js",
        "test_isoterminal":"tests/ISOTerminal.js"
      })
      console.test.run()
    },

    setupVT100: function(instance){
      const el = this.el.dom.querySelector('#vt100')
      this.vt100 = new VT100( 
        Math.floor(this.data.width/this.data.lineHeight),
        Math.floor(this.data.height*0.8/this.data.lineHeight), 
        el, 
        100 
      )
      this.vt100.curs_set( 1, true)
      el.focus()
      this.vt100.getch( (ch,t) => {
        console.log(ch)
        this.term.send( ch )
        this.vt100.curs_set( 0, true)
      })

      this.el.addEventListener('serial-output-byte', (e) => {
        const byte = e.detail
        var chr = String.fromCharCode(byte);
        this.vt100.addchr(chr)
      })
      this.el.addEventListener('serial-output-string', (e) => {
        this.vt100.write(e.detail)
      })


      //this.el.dom.querySelector('input').addEventListener('keyup', (e) => {
      //  VT100.handle_onkeypress_( {charCode : e.charCode || e.keyCode, keyCode: e.keyCode}, (chars) => {
      //    debugger
      //    chars.map( (c) => this.term.send(str) )
      //  })
      //})
    },

    events:{

      // combined AFRAME+DOM reactive events
      click:   function(e){ }, //
      keydown: function(e){ },

      // reactive events for this.data updates
      myvalue: function(e){ this.el.dom.querySelector('b').innerText = this.data.myvalue },

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
