AFRAME.registerComponent('codemirror', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false
    //this.el.innerHTML = ` `
    this.requireAll()
  },

  requireAll: async function(){
    let s = await AFRAME.utils.require(this.requires)
    setTimeout( () => this.el.setAttribute("dom",""), 300 )
  },

  requires:{
    window:        "com/window.js",
    htmltexture:   "com/html-as-texture-in-xr.js",
    codemirror:    "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.1/codemirror.js",
    codemirrorcss: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.35.0/codemirror.css",
    cmtheme:       "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.35.0/theme/shadowfox.css"
  },

  dom: {
    scale:   0.5,
    events:  ['click','keydown'],
    html:    (me) => `<div class="codemirror">
                      </div>`,

    css:     (me) => `.codemirror{
                        width:100%;
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

  events:{

    // component events
    DOMready: function(e){
      console.log(`title: codemirror; uid: ${this.el.dom.id}; attach: #overlay; dom: #${this.el.dom.id};`)
      this.el.setAttribute("window", `title: codemirror; uid: ${this.el.dom.id}; attach: #overlay; dom: #${this.el.dom.id};`)
      this.el.setAttribute("html-as-texture-in-xr", `domid: #${this.el.dom.id}`)  // only show aframe-html in xr 
      this.editor = CodeMirror( this.el.dom, {
        value: "function myScript(){return 100;}\n",
        mode:  "javascript",
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

