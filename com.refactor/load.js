AFRAME.registerComponent('load', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false

    //this.el.innerHTML = ` `
  },

  requires:{
    // somecomponent:        "https://unpkg.com/some-aframe-component/mycom.min.js"
  },

  events:{

    // component events
    somecomponent: function( ){ console.log("component requirement mounted") },
    ready:         function(e){ console.log("requires are loaded") },

    launcher:      function(e){ 
      this.filedialog( (data) => {
        if( data.match(/<html/) && confirm('reload new XR shell environment?') ){
          return document.write(data)
        }
        if( data.match(/<a-/) ){
          let el = document.createElement('a-entity')
          el.innerHTML = data
          AFRAME.scenes[0].appendChild(el)
        }
      })
    },


  },

  filedialog: function(onDone){
    if( !this.fileEl ){
      let el = this.fileEl = document.createElement('input')
      el.type = "file"
      el.addEventListener('change', (e) =>{
        var file = e.target.files[0];
        if (!file) {
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
          var contents = e.target.result;
          onDone(contents)
        };
        reader.readAsText(file);
      })
      document.body.appendChild(el)
    }
    this.fileEl.click()
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/arrow-up-r.svg",
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

