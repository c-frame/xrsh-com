AFRAME.registerComponent('helloworld-html', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {  

    this.el.addEventListener('ready', () => this.el.dom.style.display = 'none' )
  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
  },

  dom: {
    scale:   1,
    events:  ['click'],
    html:    (me) => `<div>
                        <div class="pad"> helloworld-html: ${me.data.foo} <b>${me.data.myvalue}</b></span>
                      </div>`,

    css:     `.helloworld-html {
                color: var(--xrsh-light-gray); /* see index.css */
              }`,
  },

  events:{

    // combined AFRAME+DOM reactive events
    keydown: function(e){ }, // 
    click:    function(e){ 
      console.dir(e)
    }, // 

    // reactive events for this.data updates 
    myvalue: function(e){ this.el.dom.querySelector('b').innerText = this.data.myvalue },


    ready: function( ){ 
      this.el.dom.style.display = 'none'
      console.log("this.el.dom has been added to DOM")
      this.el.dom.children[0].id = this.el.uid  // important hint for html-mesh
      this.data.myvalue = 1
      setInterval( () => this.data.myvalue++, 100 )
    },

    launcher:  function(){ 
      this.el.dom.style.display = ''
      console.log("launcher") 
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
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

