if( AFRAME.components.codemirror ) delete AFRAME.components.codemirror 

AFRAME.registerComponent('codemirror', {
  schema: { 
    file: { type:"string"},
    term: { type:"selector", default: "[isoterminal]" },
  },

  init: function () {
    this.el.object3D.visible = false
    if( !this.data.term || !this.data.term.components ) throw 'codemirror cannot get isoterminal'
    if( this.data.file && this.data.file[0] != '/'){
      this.data.file = "root/"+this.data.file
    }
    this.isoterminal = this.data.term.components.isoterminal.term
    //this.el.innerHTML = ` `
    this.requireAll()
  },

  requireAll: async function(){
    let s = await AFRAME.utils.require(this.requires)
    setTimeout( () => this.el.setAttribute("dom",""), 300 )
  },

  requires:{
    window:        "com/window.js"
  },

  dom: {
    scale:   0.5,
    events:  ['click','keydown'],
    html:    (me) => `<div class="codemirror">
                      </div>`,

    css:     (me) => `.codemirror{
                        width:100%;
                     }
                     .codemirror *{
                       font-size: 14px;
                       font-family: "Cousine",Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
                       font-weight:500 !important;
                       letter-spacing: 0 !important;
                       text-shadow: 0px 0px 10px #F075;
                     }
                     .wb-body + .codemirror{ overflow:hidden; }
                     .CodeMirror {
                      margin-top:18px;
                     }
                     .cm-s-shadowfox.CodeMirror {
                       background:transparent !important; 
                     }
                     `
  },

  createEditor: function(value){
    this.el.setAttribute("window", `title: codemirror; uid: ${this.el.dom.id}; attach: #overlay; dom: #${this.el.dom.id};`)
    this.editor = CodeMirror( this.el.dom, {
      value,
      mode: "htmlmixed",
      lineNumbers: true,
      styleActiveLine: true,
      matchBrackets: true,
      Tab: "indentMore",
      defaultTab: function(cm) {
        if (cm.somethingSelected()) cm.indentSelection("add");  
        else cm.replaceSelection("  ", "end");
      }           
    })
    this.editor.setOption("theme", "shadowfox")
    this.editor.updateFile = AFRAME.utils.throttleLeadingAndTrailing( (file,str) => {
      this.updateFile(file,str), 
      2000 
    })
    this.editor.on('change', (instance,changeObj) => {
      this.editor.updateFile( this.data.file, instance.getValue() )
    })

    setTimeout( () => {
      this.el.setAttribute("html-as-texture-in-xr", `domid: #${this.el.dom.id}`)  // only show aframe-html in xr 
    },1500)
  },

  updateFile: async function(file,str){
    // we don't do via shellcmd: isoterminal.exec(`echo '${str}' > ${file}`,1) 
    // as it would require all kindof ugly stringescaping
    console.log("updating "+file)
    await this.isoterminal.worker['emulator.create_file'](file, term.convert.toUint8Array(str) )
  },

  events:{

    // component events
    DOMready: function(e){

      this.isoterminal.worker['emulator.read_file'](this.data.file)
      .then( this.isoterminal.convert.Uint8ArrayToString )
      .then( (str) => {
          console.log("creating editor")
        this.createEditor( str )
      })
      .catch( (e) => {
        console.log("error opening "+this.data.file+", creating new one")
        this.createEditor("")
      })
    },
  },


  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Paste",
    "name": "Paste",
    "icons": [
      {
        "src": "https://css.gg/clipboard.svg",
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
    "description": "Paste the clipboard",
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

