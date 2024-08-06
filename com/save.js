AFRAME.registerComponent('save', {
  schema: { 
    foo: { type:"string"}
  },

  init: async function () {
    this.el.object3D.visible = false
    await AFRAME.utils.require(this.dependencies)
  },

  dependencies:{
    'xhook': 'https://jpillora.com/xhook/dist/xhook.min.js'
  },

  events:{

    launcher:      function(e){ 
      this.save()
    },

  },

  convert:{

    arrayBufferToBase64: function(buffer){
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return window.btoa(binary);
    },

    base64ToArrayBuffer: function(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
  },

  save: function(){
    let l = document.querySelector("#left-hand")
    let r = document.querySelector("#right-hand")
    l.remove()
    r.remove()
    // *TODO* dont crash on hands

    this.save_state()
    .then( this.inlineFiles )
    .then( () => this.download(document.documentElement.innerHTML,"xrsh.html") )
    .catch(console.error)
  },

  save_state: async function(){
    if( window.emulator ){
      let binaryString = '';
      const state = await emulator.save_state() //restore_state(state);
      //console.log(this.convert.arrayBufferToBase64(state))
    }
  },

  download: function(content, filename, contentType){
    const a = document.createElement('a');
    const file = new Blob([document.documentElement.innerHTML], {type: "text/html"});

    a.href= URL.createObjectURL(file);
    a.download = filename 
    a.click();
    URL.revokeObjectURL(a.href);
  },

  inlineFiles: function(){
    let p    = []
    let tags = [ ...document.querySelectorAll('script[src]'), 
                 ...document.querySelectorAll('link[href]')   
               ]
    tags.map( (el) => {
      let remoteFile = el.src || el.href
      if( remoteFile ){
        p.push( new Promise((resolve,reject) => {
          fetch( remoteFile )
          .then( (res) => res.text() )
          .then( (text) => {
            switch( el.tagName ){
                case 'LINK':   el2 = document.createElement('style')
                                el2.setAttribute("type","text/css")
                                el2.setAttribute("_href", el.href )
                                el2.innerHTML = `${text}` 
                                el.parentNode.appendChild(el2)
                                el.remove()
                                break;

                case 'SCRIPT':  el.innerHTML = `${text.replace(/<\//g,'&lt;/')}`
                                el.setAttribute("_src", el.src)
                                el.removeAttribute("src")
                                break;
            }
            resolve()
          })
          .catch(reject)
        }))
      }
    })
    return Promise.all(p) 
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Save",
    "name": "Save",
    "icons": [
      {
        "src": "https://css.gg/arrow-down-r.svg",
        "src": "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBkPSJNMTQuODI4NCAxMi4wMjU5TDE2LjI0MjYgMTMuNDQwMkwxMiAxNy42ODI4TDcuNzU3MzMgMTMuNDQwMkw5LjE3MTU1IDEyLjAyNTlMMTEgMTMuODU0NFY2LjMxNzI0SDEzVjEzLjg1NDRMMTQuODI4NCAxMi4wMjU5WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBmaWxsLXJ1bGU9ImV2ZW5vZGQiCiAgICBjbGlwLXJ1bGU9ImV2ZW5vZGQiCiAgICBkPSJNMSA1QzEgMi43OTA4NiAyLjc5MDg2IDEgNSAxSDE5QzIxLjIwOTEgMSAyMyAyLjc5MDg2IDIzIDVWMTlDMjMgMjEuMjA5MSAyMS4yMDkxIDIzIDE5IDIzSDVDMi43OTA4NiAyMyAxIDIxLjIwOTEgMSAxOVY1Wk01IDNIMTlDMjAuMTA0NiAzIDIxIDMuODk1NDMgMjEgNVYxOUMyMSAyMC4xMDQ2IDIwLjEwNDYgMjEgMTkgMjFINUMzLjg5NTQzIDIxIDMgMjAuMTA0NiAzIDE5VjVDMyAzLjg5NTQzIDMuODk1NDMgMyA1IDNaIgogICAgZmlsbD0iY3VycmVudENvbG9yIgogIC8+Cjwvc3ZnPg==",
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
    "description": "Export the current XRSH(ell) as a standalone HTML file",
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

