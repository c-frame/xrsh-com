AFRAME.registerComponent('helloworld-iframe', {
  schema: { 
    foo: { type:"string"}
  },

  init: function(){},

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
  },

  dom: {
    scale:   1,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <iframe src=""></iframe>
                      </div>`,

    css:     (me) => `
      .XR #overlay .winbox.iframe{ visibility: visible; } /* don't hide in XR mode */
      .winbox.iframe iframe      { background:#FFF;     }
    `
  },

  events:{

    // component events
    html:     function( ){ console.log("html-mesh requirement mounted") },

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, // 
    keydown: function(e){ }, // 

    // reactive events for this.data updates 
    myvalue: function(e){ /*this.el.dom.querySelector('b').innerText = this.data.myvalue*/ },

    ready: function( ){ 
      this.el.dom.style.display = 'none'
      console.log("this.el.dom has been added to DOM")
      this.data.myvalue = 1
      setInterval( () => this.data.myvalue++, 100 )
    },

    launcher:  function(){
      console.log("this.el.dom iframe has been added to DOM")
      let URL = prompt('enter URL to display','https://fabien.benetou.fr/Wiki/Wiki')
      if( !URL ) return
      this.el.dom.querySelector('iframe').src = URL
      new WinBox("Hello World",{ 
        width: 250,
        height: 150,
        class:["iframe"],
        x:"center",
        y:"center",
        id:  this.el.uid, // important hint for html-mesh  
        root: document.querySelector("#overlay"),
        mount: this.el.dom,
        onclose: () => { this.el.dom.style.display = 'none'; return false; }
      });
      this.el.dom.style.display = ''
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/browse.svg",
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

