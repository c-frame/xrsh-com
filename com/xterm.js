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

    this.el.dom.appendChild(terminalElement)
    //document.body.appendChild(terminalElement)
    this.el.terminalElement = terminalElement

    // Build up a theme object
    const theme = Object.keys(this.data).reduce((theme, key) => {
      if (!key.startsWith('theme_')) return theme
      const data = this.data[key]
      if(!data) return theme
      theme[key.slice('theme_'.length)] = data
      return theme
    }, {})

    this.renderType = 'dom'

    const term = new Terminal({
      theme: theme,
      allowTransparency: true,
      cursorBlink: true,
      disableStdin: false,
      rows: this.data.rows,
      cols: this.data.cols,
      fontSize: 14,
      lineHeight: 1.15,
      rendererType: this.renderType 
    })

    this.term = term

    term.open(terminalElement)
    term.focus()
    
    terminalElement.querySelector('.xterm-viewport').style.background = 'transparent'

    ////// now we can scale  canvases to the parent element
    const $screen = terminalElement.querySelector('.xterm-screen') 
    $screen.style.width = '100%'

    term.on('refresh', () => {
      if( this.renderType == 'canvas' ){
        const material = this.el.getObject3D('mesh').material
        if (!material.map) return
        this.canvasContext.drawImage(this.cursorCanvas, 0,0)
        material.map.needsUpdate = true
      }
    })

    term.on('data', (data) => {
      this.el.emit('xterm-input', data)
    })

    this.el.addEventListener('click', () => {
      term.focus()
    })

    this.el.addEventListener('serial-output-byte', (e) => {
      const byte = e.detail
      var chr = String.fromCharCode(byte);
      this.term.write(chr)
    })

    this.el.addEventListener('serial-output-string', (e) => this.term.write(e.detail) )

  },

  setRenderType: function(type){

    if( type.match(/(dom|canvas)/) ){

      if( type == 'dom'){
        this.el.removeAttribute('material')
      }

      term.setOption('rendererType',type )
      this.renderType = type

      if( type == 'canvas'){
        this.canvas = terminalElement.querySelector('.xterm-text-layer')
        this.canvasContext = this.canvas.getContext('2d')
        this.cursorCanvas = terminalElement.querySelector('.xterm-cursor-layer')
        this.el.setAttribute('material', 'transparent', true)
        this.el.setAttribute('material', 'src', '#' + this.canvas.id)
      }
    }
  },

})
