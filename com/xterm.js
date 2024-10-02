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
    cols: {
      type: 'number',
      default: 110,
    },
    rows: {
      type: 'number',
      default: Math.floor( (window.innerHeight * 0.7 ) * 0.054 )
    },
  }, TERMINAL_THEME),

  write: function(message) {
    this.term.write(message)
  },
  init: function () {
    const terminalElement = document.createElement('div')
    terminalElement.setAttribute('style', `
      width:  ${Math.floor( window.innerWidth * 0.7 )}px;
      height: ${Math.floor( window.innerHeight * 0.7 )}px;
      overflow: hidden;
    `)

    this.el.setAttribute("geometry",`primitive: plane; width:2; height:${this.data.rows*5/this.data.cols}*2`)

    this.el.terminalElement = terminalElement

    // we switch between dom/canvas rendering because canvas looks pixely in nonimmersive mode
    this.el.sceneEl.addEventListener('enter-vr', this.enterImmersive.bind(this) )
    this.el.sceneEl.addEventListener('enter-ar', this.enterImmersive.bind(this) )
    this.el.sceneEl.addEventListener('exit-vr',  this.exitImmersive.bind(this) )
    this.el.sceneEl.addEventListener('exit-ar',  this.exitImmersive.bind(this) )

    // Build up a theme object
    const theme = Object.keys(this.data).reduce((theme, key) => {
      if (!key.startsWith('theme_')) return theme
      const data = this.data[key]
      if(!data) return theme
      theme[key.slice('theme_'.length)] = data
      return theme
    }, {})

    const term = this.term = new Terminal({
      theme: theme,
      allowTransparency: true,
      cursorBlink: true,
      disableStdin: false,
      rows: this.data.rows,
      cols: this.data.cols,
      fontSize: 14,
      lineHeight: 1.15,
      rendererType: this.renderType // 'dom' // 'canvas' 
    })

    this.tick = AFRAME.utils.throttle( () => {
      if( this.el.sceneEl.renderer.xr.isPresenting ){
        // workaround
        // xterm relies on window.requestAnimationFrame (which is not called WebXR immersive mode)
        this.term._core.viewport._innerRefresh()
        this.term._core.renderer._renderDebouncer._innerRefresh() 
      }
    },150)

    this.term.open(terminalElement)
    this.term.focus()
    this.setRenderType('dom')

    const refresh = term._core.renderer._renderDebouncer.refresh 
    let scene     = this.el.sceneEl
    term._core.renderer._renderDebouncer.refresh = function(){
      refresh.apply(this,arguments)
      if( scene.renderer.xr.isPresenting ){
        this._innerRefresh()
      }
    }.bind(term._core.renderer._renderDebouncer)
    
    terminalElement.querySelector('.xterm-viewport').style.background = 'transparent'

    // now we can scale  canvases to the parent element
    const $screen = terminalElement.querySelector('.xterm-screen') 
    $screen.style.width = '100%'

    term.on('refresh', AFRAME.utils.throttle( () => this.update(), 150 ) )
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
      const material = this.el.getObject3D('mesh').material
      if (!material.map ) return 
      if( this.cursorCanvas ) this.canvasContext.drawImage(this.cursorCanvas, 0,0)
      material.map.needsUpdate = true
      //material.needsUpdate = true
    }
  },

  setRenderType: function(type){


    if( type.match(/(dom|canvas)/) ){

      if( type == 'dom'){
        this.el.dom.appendChild(this.el.terminalElement)
        this.term.setOption('fontSize', 14 )
        this.term.setOption('rendererType',type )
        this.renderType = type
      }

      if( type == 'canvas'){
        this.el.appendChild(this.el.terminalElement)
        this.term.setOption('fontSize', 48 )
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
          //canvasTexture.minFilter = THREE.LinearFilter
          //canvasTexture.magFilter = THREE.LinearFilter
          canvasTexture.needsUpdate = true; // Ensure the texture updates
          let plane = this.el.getObject3D('mesh')
          if( plane.material ) plane.material.dispose() 
          plane.material = new THREE.MeshBasicMaterial({
              map: canvasTexture,  // Set the texture from the canvas
              transparent: false,   // Set transparency
              side: THREE.DoubleSide // Set to double-sided rendering
          });
          this.el.getObject3D('mesh').scale.x = 0.3
          this.el.getObject3D('mesh').scale.y = 0.3 
          this.el.getObject3D('mesh').scale.z = 0.3 
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
