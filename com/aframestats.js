AFRAME.registerComponent('aframestats', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false
    //this.el.innerHTML = ` `
  },

  events:{

    launcher: function(e){ 
      console.dir(this)
      let scene = this.el.sceneEl
      if( !scene.getAttribute('stats') ){
        scene.setAttribute('stats','')
      }else{
        scene.removeAttribute('stats')
      }
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Stats",
    "name": "Stats",
    "icons": [
      {
        "src": "https://css.gg/align-bottom.svg",
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
    "description": "Display FPS / Geometry stats for AFRAME/THREE",
    "screenshots": [
      {
        "src": "/images/screenshot1.png",
        "type": "image/png",
        "sizes": "540x720",
        "form_factor": "narrow"
      }
    ],
    "help":`
Stats

This is a help file which describes the application.
It will be rendered thru troika text, and will contain
headers based on non-punctualized lines separated by linebreaks,
in above's case "\nHelloworld application\n" will qualify as header.
    `
  }

});

