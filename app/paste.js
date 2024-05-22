AFRAME.registerComponent('paste', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {
    this.el.object3D.visible = false
    //this.el.innerHTML = ` `
  },

  requires:{
    osbutton:              "com/osbutton.js"
  },

  events:{

    // component events
    somecomponent: function( ){ console.log("component requirement mounted") },
    ready:         function(e){ console.log("requires are loaded") },

    launcher:      function(e){ 
      navigator.clipboard.readText()
      .then( (base64) => {
        let mimetype  = base64.replace(/;base64,.*/,'')
        let data = base64.replace(/.*;base64,/,'')
        let type = this.textHeuristic(data)
        console.log("type="+type)
        switch( this.textHeuristic(data) ){
          case "aframe":    this.insertAFRAME(data); break;
          default:          this.insertText(data); break;
        }
        this.count += 1
      })
    },

  },

  textHeuristic: function(text){
    // Script type identification clues
    const bashClues   = ["|", "if ", "fi", "cat"];
    const htmlClues   = ["/>", "href=", "src="];
    const aframeClues = ["<a-entity", "/>", "position="];
    const jsClues     = ["var ", "let ", "function ", "setTimeout","console."];
    // Count occurrences of clues for each script type
    const bashCount = bashClues.reduce((acc, clue) => acc + (text.includes(clue) ? 1 : 0), 0);
    const htmlCount = htmlClues.reduce((acc, clue) => acc + (text.includes(clue) ? 1 : 0), 0);
    const aframeCount = aframeClues.reduce((acc, clue) => acc + (text.includes(clue) ? 1 : 0), 0);
    const jsCount = jsClues.reduce((acc, clue) => acc + (text.includes(clue) ? 1 : 0), 0);

    // Identify the script with the most clues or return unknown if inconclusive
    const maxCount = Math.max(bashCount, htmlCount, jsCount, aframeCount);
    if (maxCount === 0) {
      return "unknown";
    } else if (bashCount === maxCount) {
      return "bash";
    } else if (htmlCount === maxCount) {
      return "html";
    } else if (jsCount === maxCount) {
      return "javascript";
    } else {
      return "aframe";
    }
  },

  insertAFRAME: function(data){
    let scene = document.createElement('a-entity')
    scene.id = "embedAframe"
    scene.innerHTML = data
    let el = document.createElement('a-text')
    el.setAttribute("value",data)
    el.setAttribute("color","white")
    el.setAttribute("align","center")
    el.setAttribute("anchor","align")
    let osbutton = this.wrapOSButton(el,"aframe",data)
    AFRAME.scenes[0].appendChild(osbutton)
    console.log(data)
  },

  insertText: function(data){
    let el = document.createElement('a-text')
    el.setAttribute("value",data)
    el.setAttribute("color","white")
    el.setAttribute("align","center")
    el.setAttribute("anchor","align")
    let osbutton = this.wrapOSButton(el,"text",data)
    AFRAME.scenes[0].appendChild(osbutton)
    console.log(data)
  },

  wrapOSButton: function(el,type,data){
    let osbutton = document.createElement('a-entity')
    let height   = type == 'aframe' ? 0.3 : 0.1
    let depth    = type == 'aframe' ? 0.3 : 0.05
    osbutton.setAttribute("osbutton",`width:0.3; height: ${height}; depth: ${depth}; color:blue `)
    osbutton.appendChild(el)
    osbutton.object3D.position.copy( this.getPositionInFrontOfCamera() )
    return osbutton
  },

  getPositionInFrontOfCamera: function(){
    const camera = this.el.sceneEl.camera;
    let pos = new THREE.Vector3()
    let direction = new THREE.Vector3();
    // Get camera's forward direction (without rotation)
    camera.getWorldDirection(direction);
    camera.getWorldPosition(pos)
    direction.normalize();
    // Scale the direction by 1 meter
    direction.multiplyScalar(1.5);
    // Add the camera's position to the scaled direction to get the target point
    pos.add(direction);
    return pos
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Paste",
    "name": "Paste",
    "icons": [
      {
        "src": "https://css.gg/clipboard.svg",
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

