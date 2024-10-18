/*
 * MIT License
 * 
 * Copyright (c) 2019 
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * 2019 Mauve Ranger
 * 2024 Leon van Kammen
 */

let terminalInstance = 0

const TERMINAL_THEME = {
  theme_foreground: {
    // 'default': '#ffffff'
  },
  theme_background: {
    // 'default': '#000'
  },
  theme_cursor: {
    // 'default': '#ffffff'
  },
  theme_selection: {
    // 'default': 'rgba(255, 255, 255, 0.3)'
  },
  theme_black: {
    // 'default': '#000000'
  },
  theme_red: {
    // 'default': '#e06c75'
  },
  theme_brightRed: {
    // 'default': '#e06c75'
  },
  theme_green: {
    // 'default': '#A4EFA1'
  },
  theme_brightGreen: {
    // 'default': '#A4EFA1'
  },
  theme_brightYellow: {
    // 'default': '#EDDC96'
  },
  theme_yellow: {
    // 'default': '#EDDC96'
  },
  theme_magenta: {
    // 'default': '#e39ef7'
  },
  theme_brightMagenta: {
    // 'default': '#e39ef7'
  },
  theme_cyan: {
    // 'default': '#5fcbd8'
  },
  theme_brightBlue: {
    // 'default': '#5fcbd8'
  },
  theme_brightCyan: {
    // 'default': '#5fcbd8'
  },
  theme_blue: {
    // 'default': '#5fcbd8'
  },
  theme_white: {
    // 'default': '#d0d0d0'
  },
  theme_brightBlack: {
    // 'default': '#808080'
  },
  theme_brightWhite: {
    // 'default': '#ffffff'
  }
}

AFRAME.registerComponent('xterm', {
  schema: Object.assign({
    XRrenderer: { type: 'string', default: 'canvas', },
    cols: { type: 'number', default: 110, },
    rows: { type: 'number', default: Math.floor( (window.innerHeight * 0.7 ) * 0.054 ) },
    canvasLatency:{ type:'number', default: 200 }
  }, TERMINAL_THEME),

  write: function(message) {
    this.term.write(message)
  },
  init: function () {
    const terminalElement = document.createElement('div')
    terminalElement.setAttribute('style', `
      width:  800px; 
      height: ${Math.floor( 800 * 0.527 )}px;
      overflow: hidden;
    `)

    this.el.terminalElement = terminalElement

    if( this.data.XRrenderer == 'canvas' ){
      // setup slightly bigger black backdrop (this.el.getObject3D("mesh")) 
      // and terminal text (this.el.planeText.getObject("mesh"))
      this.el.setAttribute("geometry",`primitive: box; width:2.07; height:${this.data.rows*5.3/this.data.cols}*2; depth: -0.12`)
      this.el.setAttribute("material","shader:flat; color:black; opacity:0.5; transparent:true; ")
      this.el.planeText = document.createElement('a-entity')
      this.el.planeText.setAttribute("geometry",`primitive: plane; width:2; height:${this.data.rows*5/this.data.cols}*2`)
      this.el.appendChild(this.el.planeText)

      // we switch between dom/canvas rendering because canvas looks pixely in nonimmersive mode
      this.el.sceneEl.addEventListener('enter-vr', this.enterImmersive.bind(this) )
      this.el.sceneEl.addEventListener('enter-ar', this.enterImmersive.bind(this) )
      this.el.sceneEl.addEventListener('exit-vr',  this.exitImmersive.bind(this) )
      this.el.sceneEl.addEventListener('exit-ar',  this.exitImmersive.bind(this) )

    }

    this.tick = AFRAME.utils.throttleLeadingAndTrailing( () => {
      if( this.el.sceneEl.renderer.xr.isPresenting ){
        // workaround
        // xterm relies on window.requestAnimationFrame (which is not called WebXR immersive mode)
        //this.term._core.viewport._innerRefresh()
        this.term._core.renderer._renderDebouncer._innerRefresh() 
      }
    }, this.data.canvasLatency)

    // Build up a theme object
    const theme = Object.keys(this.data).reduce((theme, key) => {
      if (!key.startsWith('theme_')) return theme
      const data = this.data[key]
      if(!data) return theme
      theme[key.slice('theme_'.length)] = data
      return theme
    }, {})

    this.fontSize = 14

    const term = this.term = new Terminal({
      logLevel:"off",
      theme: theme,
      allowTransparency: true,
      cursorBlink: true,
      disableStdin: false,
      rows: this.data.rows,
      cols: this.data.cols,
      fontFamily: 'Cousine, monospace',
      fontSize: this.fontSize,
      lineHeight: 1.15,
      useFlowControl: true,
      rendererType: this.renderType // 'dom' // 'canvas' 
    })

    this.term.open(terminalElement)
    this.term.focus()
    this.setRenderType('dom')
    
    terminalElement.querySelector('.xterm-viewport').style.background = 'transparent'

    // now we can scale  canvases to the parent element
    const $screen = terminalElement.querySelector('.xterm-screen') 
    $screen.style.width = '100%'

    term.on('refresh', AFRAME.utils.throttleLeadingAndTrailing( () => this.update(), 150 ) )
    term.on('data', (data) => {
      this.el.emit('xterm-input', data)
    })

    this.el.addEventListener('serial-output-byte', (e) => {
      const byte = e.detail
      var chr = String.fromCharCode(byte);
      this.term.write(chr)
    })

    this.el.addEventListener('serial-output-string', (e) => {
      this.term.write(e.detail) 
    })

  },

  update: function(){ 
    if( this.renderType == 'canvas' ){
      const material = this.el.planeText.getObject3D('mesh').material
      if (!material.map ) return 
      if( this.cursorCanvas ) this.canvasContext.drawImage(this.cursorCanvas, 0,0)
      else console.log("no cursorCanvas")
      material.map.needsUpdate = true
      //material.needsUpdate = true
    }
  },

  setRenderType: function(type){


    if( type.match(/(dom|canvas)/) ){

      if( type == 'dom'){
        this.el.dom.appendChild(this.el.terminalElement)
        this.term.setOption('fontSize', this.fontSize )
        this.term.setOption('rendererType',type )
        this.renderType = type
      }

      if( type == 'canvas'){
        this.el.appendChild(this.el.terminalElement)
        this.term.setOption('fontSize', this.fontSize * 3 )
        this.term.setOption('rendererType',type )
        this.renderType = type
        this.update()
        setTimeout( () => {
          this.canvas = this.el.terminalElement.querySelector('.xterm-text-layer')
          this.canvas.id = "xterm-canvas"
          this.canvasContext = this.canvas.getContext('2d')
          this.cursorCanvas = this.el.terminalElement.querySelector('.xterm-cursor-layer')
          // Create a texture from the canvas
          const canvasTexture = new THREE.Texture(this.canvas)
          //canvasTexture.minFilter = THREE.NearestFilter //LinearFilter
          //canvasTexture.magFilter = THREE.LinearMipMapLinearFilter //THREE.NearestFilter //LinearFilter
          canvasTexture.needsUpdate = true; // Ensure the texture updates
          let plane = this.el.planeText.getObject3D("mesh") //this.el.getObject3D('mesh')
          if( plane.material ) plane.material.dispose() 
          plane.material = new THREE.MeshBasicMaterial({
              map: canvasTexture,  // Set the texture from the canvas
              transparent: false,   // Set transparency
              //side: THREE.DoubleSide // Set to double-sided rendering
              //blending: THREE.AdditiveBlending
          });
          this.el.object3D.scale.x = 0.2
          this.el.object3D.scale.y = 0.2 
          this.el.object3D.scale.z = 0.2 
        },100)
      }
        
      this.el.terminalElement.style.opacity = type == 'canvas' ? 0 : 1

    }
  },

  enterImmersive: function(){
    if( this.mode == 'immersive' ) return
    this.el.object3D.visible = true
    this.mode = "immersive"
    this.setRenderType('canvas')
    this.term.focus()
  },

  exitImmersive: function(){
    if( this.mode == 'nonimmersive' ) return
    this.el.object3D.visible = false
    this.mode = "nonimmersive"
    this.setRenderType('dom')
  },

})
