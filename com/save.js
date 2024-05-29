AFRAME.registerComponent('save', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false

    //this.el.innerHTML = ` `
  },

  events:{

    launcher:      function(e){ 
      this.save()
    },

  },

  save: function(){
    let l = document.querySelector("#left-hand")
    let r = document.querySelector("#right-hand")
    l.remove()
    r.remove()
    // *TODO* dont crash on hands

    this.inlineFiles()
    .then( () => this.download(document.documentElement.innerHTML,"xrsh.html") )
    .catch(console.error)
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
    let tags = [ ...document.querySelectorAll('script'), 
                 ...document.querySelectorAll('link')   
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
                                el2.innerHTML = text 
                                el.parentNode.appendChild(el2)
                                el.remove()
                                break;

                case 'SCRIPT':  el.innerHTML = text 
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

