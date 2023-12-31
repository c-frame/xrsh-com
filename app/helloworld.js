AFRAME.registerComponent('helloworld', {
  schema: { 
    foo: { type:"string"}
  },

  dependencies:{
    "html":   "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    "stylis": "https://unpkg.com/stylis@4.3.1/dist/umd/stylis.js"              // modern CSS (https://stylis.js.org)
  },

  dom: {
    scale:   3.5,
    events:  ['click'],
    html:    `<div id="hello"><button>hello world</button></div>`,
    css:     `div{ #hello {position:relative;top:0;width:300px} }`
  },

  events:{
    "html":  function( ){ console.log("htmlmesh component mounted!")                 },   // html-component was added to this AFRAME entity
    "title": function(e){ this.dom.el.querySelector("button").innerHTML = e.detail.v },   // this.data.title was changed
    "click": function(e){ // a click was detected on this.dom.el or AFRAME entity
      this.data.title = 'hello world '+(new Date().getTime()) 
      console.dir(e.detail.target || e.target)  
    },  
  },

  init: function () {  
    this.require( this.dependencies )
    .then( () => {
      document.body.appendChild(this.dom.el)
      this.el.setAttribute("html",'html:#hello; cursor:#cursor')
    })
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "/images/icons-vector.svg",
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

