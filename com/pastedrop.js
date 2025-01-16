/** 
 * ## [pastedrop](com/pastedrop.js)
 *
 * detects user copy/paste and file dragdrop action
 * and clipboard functions
 *
 * ```html 
 *   <a-entity pastedrop/>
 * ```
 *
 * | event        | target | info                                                                                               |
 * |--------------|--------|------------------------------------------|
 * | `pasteFile`  | self   | always translates input to a File object |
 */

AFRAME.registerComponent('pastedrop', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {

    window.addEventListener('paste', this.onPaste.bind(this) )

    document.body.addEventListener('dragover',(e) => e.preventDefault() ) 
    document.body.addEventListener('drop',  this.onDrop.bind(this) )
  },

  initClipboard: function(){
    navigator.permissions.query({ name: 'clipboard-read' })
    .then( (permission) => {
      if( permission.state != 'granted' ){
        this.el.sceneEl.exitVR()
        setTimeout( () => this.paste(), 500 )
        return
      }else this.paste()
    })
  },

  getClipboard: function(){
    navigator.clipboard.readText()
    .then( async (base64) => {
      let mimetype  = base64.replace(/;base64,.*/,'')
      let data = base64.replace(/.*;base64,/,'')
      let type = this.textHeuristic(data)
      const term = document.querySelector('[isoterminal]').components.isoterminal.term
        this.el.emit('pasteFile',{}) /*TODO* data incompatible */
     })
  },

  onDrop: function(e){
    e.preventDefault()
    this.onPaste({...e, type: "paste", clipboardData: e.dataTransfer})
  },

  onPaste: function(e){
    if( e.type != "paste" ) return

    const clipboardData = e.clipboardData || navigator.clipboard;
    const items = clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const type = item.type;

      // Check if the item is a file
      if (item.kind === "file") {
        this.el.emit('pasteFile',{item,type})
      } else if (type === "text/plain") {
        const pastedText = clipboardData.getData("text/plain");
        const newType = "text" // let /root/hook.d/mimetype/text further decide whether this is text/plain (or something else)
        this.el.emit('pasteFile',{item,type:newType,pastedText})
      }
    }
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

