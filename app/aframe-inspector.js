AFRAME.registerComponent('aframe-inspector', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () { 
    document.querySelector('a-scene').setAttribute("inspector","url: https://cdn.jsdelivr.net/gh/aframevr/aframe-inspector@master/dist/aframe-inspector.min.js")
  },

  requires:{ },

  events:{

    // component events
    ready:         function(e){ },

    launcher:      function(e){ 
      $('[inspector]').components.inspector.openInspector()
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "inspector",
    "name": "AFRAME inspector",
    "icons": [
      {
        "src": "https://css.gg/list-tree.svg",
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
    "description": "use CTRL+ALT+i to launch inspector",
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

