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
    events:  ['click','input'],
    html:    `<div id="hello" class="modal">
                <button class="close">☓</button>
                <b>Hello world</b>
                <br><br>
                <fieldset>
                  <legend>Colour</legend>
                  <input type="radio" id="color-red" name="color" value="red" checked><label for="color-red"> Red</label><br>
                  <input type="radio" id="color-blue" name="color" value="blue"><label for="color-blue"> Blue</label><br>
                </fieldset>
                <fieldset>
                  <legend>Material:</legend>
                  <input id="material-wireframe" type="checkbox" name="wireframe"><label for="material-wireframe"> Wireframe</label><br>
                </fieldset>
                <fieldset>
                  <legend>Size:</legend>
                  <input type="range" min="0.1" max="2" value="1" step="0.01" id="myRange" style="background-color: transparent;">
                </fieldset>
                <button onclick="AFRAME.scenes[0].exitVR()" style="display: block;">Exit Immersive</button>
              </div>`,
    css:     `div{ #hello {position:relative;top:0;width:300px} }`
  },

  events:{
    html:  function( ){ console.log("htmlmesh component mounted!")                 },   // html-component was added to this AFRAME entity
    title: function(e){ this.dom.el.querySelector("b").innerHTML = e.detail.v },   // this.data.title was changed
    click: function(e){ // a click was detected on this.dom.el or AFRAME entity
      if( !e.detail.target                     ) return
      if( e.detail.target.className == 'close' ){
        this.dom.el.remove()
        this.el.removeAttribute("html")
      }
    },  
    input: function(e){
      if( !e.detail.target                 ) return
      if(  e.detail.target.id == 'myRange' ) this.data.title = e.detail.target.value // reactive demonstration
    }
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

