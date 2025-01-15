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
      width:          { type: 'number',"default": 800 },
      height:         { type: 'number',"default": 600 },
      depth:          { type: 'number',"default": 0.03 },
      lineHeight:     { type: 'number',"default": 18 },
      padding:        { type: 'number',"default": 18 },
      maximized:      { type: 'boolean',"default":false},
      minimized:      { type: 'boolean',"default":false},
      muteUntilPrompt:{ type: 'boolean',"default":true},     // mute stdout until a prompt is detected in ISO
      HUD:            { type: 'boolean',"default":false},    // link to camera movement 
      transparent:    { type:'boolean', "default":false },   // need good gpu
      memory:         { type: 'number',  "default":60  },    // VM memory (in MB) [NOTE: quest or smartphone might crash > 40mb ]
      bufferLatency:  { type: 'number', "default":1  },      // in ms: bufferlatency from webworker to xterm (batch-update every char to texture)
      debug:          { type: 'boolean', "default":false },
      emulator:       { type: 'string', "default": "fbterm" }// terminal emulator
    },

    init: function(){
      this.el.object3D.visible = false
      if( window.innerWidth < this.data.width ){
        this.data.maximized = true
      }

      this.calculateDimension()
      this.initHud()
      this.setupPasteDrop()

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
      pastedrop:     "com/pastedrop.js",
      v86:           "com/isoterminal/libv86.js",
      // allow xrsh to selfcontain scene + itself
      xhook:         "com/lib/xhook.min.js",
      selfcontain:   "com/selfcontainer.js",
      // html to texture
      htmlinxr:      "com/html-as-texture-in-xr.js",
      // isoterminal global features
      PromiseWorker: "com/isoterminal/PromiseWorker.js",
      ISOTerminal:   "com/isoterminal/ISOTerminal.js",
      localforage:   "com/isoterminal/localforage.js",
    },

    dom: {
      scale: 0.66,
      events:  ['click','keydown'],
      html:    (me) => `<div class="isoterminal">
                          <input type="file" id="pastedrop" style="position:absolute; left:-9999px;opacity:0"></input>
                          <div id="term" tabindex="0"></div>
                        </div>`,

      css:     (me) => `

                        .isoterminal{
                          padding: ${me.com.data.padding}px;
                          width:100%;
                          height:99%;
                          resize: both;
                          overflow: hidden;
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

                        .isoterminal *{
                            outline:none;
                            box-shadow:none;
                        }

                        .term {
                            font-family: 'Cousine';
                            line-height: ${me.com.data.lineHeight}px;
                            font-weight: normal;
                            font-variant-ligatures: none;
                            color: #f0f0f0;
                            overflow: hidden;
                            white-space: nowrap;
                        }

                        .term_content a {
                            color: inherit;
                            text-decoration: underline;
                            color:#2AFF;
                        }
                        
                        .term_content a span{
                            text-shadow: 0px 0px 10px #F07A;
                        }

                        .term_content a:hover {
                            color: inherit;
                            text-decoration: underline;
                            animation:fade 1000ms infinite;
                            -webkit-animation:fade 1000ms infinite;
                        }

                        .term_cursor {
                            color: #000000;
                            background: #70f;
                            animation:fade 1000ms infinite; 
                            -webkit-animation:fade 1000ms infinite;
                        }

                        .term_char_size {
                            display: inline-block;
                            visibility: hidden;
                            position: absolute;
                            top: 0px;
                            left: -1000px;
                            padding: 0px;
                        }

                        .term_textarea {
                            position: absolute;
                            top: 0px;
                            left: 0px;
                            width: 0px;
                            height: 0px;
                            padding: 0px;
                            border: 0px;
                            margin: 0px;
                            opacity: 0;
                            resize: none;
                        }

                        .term_scrollbar { background: transparent url(images/bg-scrollbar-track-y.png) no-repeat 0 0; position: relative; background-position: 0 0; float: right; height: 100%; }
                        .term_track { background: transparent url(images/bg-scrollbar-trackend-y.png) no-repeat 0 100%; height: 100%; width:13px; position: relative; padding: 0 1px; }
                        .term_thumb { background: transparent url(images/bg-scrollbar-thumb-y.png) no-repeat 50% 100%; height: 20px; width: 25px; cursor: pointer; overflow: hidden; position: absolute; top: 0; left: -5px; }
                        .term_thumb .term_end { background: transparent url(images/bg-scrollbar-thumb-y.png) no-repeat 50% 0; overflow: hidden; height: 5px; width: 25px; }
                        .noSelect { user-select: none; -o-user-select: none; -moz-user-select: none; -khtml-user-select: none; -webkit-user-select: none; }

                        .isoterminal style{ display:none }

                        blink{ 
                          border:none;
                          padding:none;
                        }

                        #overlay .winbox:has(> .isoterminal){ 
                          background:transparent;
                          box-shadow:none;
                        }

                        .XR .cursor {
                          animation:none;
                          -webkit-animation:none;
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
      //
      await AFRAME.utils.require(this.requires)

      let features = { // ISOTerminal plugins
        boot:          "com/isoterminal/feat/boot.js",
        javascript:    "com/isoterminal/feat/javascript.js",
        jsconsole:     "com/isoterminal/feat/jsconsole.js",
        indexhtml:     "com/isoterminal/feat/index.html.js",
        indexjs:       "com/isoterminal/feat/index.js.js",
        autorestore:   "com/isoterminal/feat/autorestore.js",
        pastedropFeat: "com/isoterminal/feat/pastedrop.js",
        httpfs:        "com/isoterminal/feat/httpfs.js",
      }
      if( this.data.emulator == 'fbterm' ){
        features['fbtermjs'] = "com/isoterminal/term.js"
        features['fbterm']   = "com/isoterminal/feat/term.js"
      }
      await AFRAME.utils.require(features)

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
        this.term.emit('term_init', {instance, aEntity:this})
        //instance.winbox.resize(720,380)
        let size = `width: ${this.data.width}; height: ${this.data.height}`
        instance.setAttribute("window", `title: xrsh.iso; uid: ${instance.uid}; attach: #overlay; dom: #${instance.dom.id}; ${size}; min: ${this.data.minimized}; max: ${this.data.maximized}; class: no-full, no-max, no-resize`)
      })

      instance.addEventListener('window.oncreate', (e) => {
        instance.dom.classList.add('blink')
        // canvas to texture texture
        instance.setAttribute("html-as-texture-in-xr", `domid: .winbox#${instance.uid}; faceuser: true`)

        // run iso
        let opts = {dom:instance.dom}
        for( let i in this.data ) opts[i] = this.data[i]
        opts.cols = this.cols
        opts.rows = this.rows
        this.term.start(opts)
      })

      instance.setAttribute("dom",    "")
      instance.setAttribute("pastedrop",  "")

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
        this.el.emit('focus',e.detail)
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

    setupPasteDrop: function(){
      this.el.addEventListener('pasteFile', (e) => {
        e.preventDefault()                 // prevent bubbling up to window (which is triggering this initially)
        if( !this.term.pasteFile ) return  // skip if feat/pastedrop.js is not loaded 
        this.term.pasteFile(e.detail) 
      })
      return this
    },

    calculateDimension: function(){
      if( this.data.width == -1  ) this.data.width = document.body.offsetWidth;
      if( this.data.height == -1 ) this.data.height = Math.floor( document.body.offsetHeight - 30 )
      if( this.data.height > this.data.width ) this.data.height = this.data.width // mobile smartphone fix
      this.data.width -= this.data.padding*2
      this.data.height -= this.data.padding*2
      this.cols = Math.floor(this.data.width/this.data.lineHeight*2)-1
      this.rows = Math.floor( (this.data.height*0.93)/this.data.lineHeight)-1
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
