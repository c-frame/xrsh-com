AFRAME.registerComponent('helloworld', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false
    this.el.setAttribute("geometry","primitive: octahedron")
    this.interval = setInterval( () => { 
        this.data.myvalue = ((this.data.myvalue||1.0) + 0.25) % 1
    }, 400 )
  },

  requires:{
    // somecomponent:        "https://unpkg.com/some-aframe-component/mycom.min.js"
  },

  events:{

    // component events
    somecomponent: function( ){ console.log("component requirement mounted") },
    ready:         function(e){ console.log("requires are loaded") },

    launcher:      function(e){ 
      this.el.object3D.visible = !this.el.object3D.visible 
    },

    // reactive this.data value demo 
    myvalue:function( ){ this.el.object3D.children[0].scale.y = this.data.myvalue }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/shape-hexagon.svg",
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

