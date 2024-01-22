AFRAME.registerComponent('spatialize', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {

    document.querySelector('a-scene').addEventListener('enter-vr',() => this.toggle(true) )
    document.querySelector('a-scene').addEventListener('exit-vr', () => this.toggle(false) )
    // toggle immersive with ESCAPE 
    document.body.addEventListener('keydown', (e) => e.key == 'Escape' && this.toggle() ) 

    document.head.innerHTML += `<style type="text/css">
      .XR #toggle_overlay{
        background: transparent;
        color: #3aacff;
      }

      .XR #overlay{
        visibility: hidden;
      }
    </style>`
  },

  requires:{
    // somecomponent:        "https://unpkg.com/some-aframe-component/mycom.min.js"
  },

  events:{

    // component events
    ready:         function(e){
      this.btn.style.background = 'var(--xrsh-primary)'
    },

    launcher:      function(e){ this.toggle() },

  },

  // draw a button so we can toggle apps between 2D / XR
  toggle: function(state){
    state = state || !document.body.className.match(/XR/)
    document.body.classList[ state ? 'add' : 'remove'](['XR'])
    AFRAME.scenes[0].emit( state ? 'apps:XR' : 'apps:2D') 
    this.btn.querySelector('img').src = state ? this.manifest.icons[0].src_2D
                                              : this.manifest.icons[0].src
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "spatialize",
    "name": "spatialize",
    "icons": [
      {
        "src": "https://css.gg/display-grid.svg",
        "src_2D":    "https://css.gg/stack.svg",
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
    "description": "use ESC-key to toggle between 2D / 3D",
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

