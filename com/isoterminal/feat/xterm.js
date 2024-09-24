ISOTerminal.addEventListener('init', function(){
  if( typeof Terminal != 'undefined' ) this.xtermInit()
})

ISOTerminal.addEventListener('runISO', function(e){
  let opts = e.detail
  opts.serial_container_xtermjs = opts.screen_container
  delete opts.screen_container
})

ISOTerminal.prototype.xtermInit = function(){
  this.serial_input = 0 // set input to serial line 0
  let isoterm = this
  // monkeypatch Xterm (which V86 initializes) so we can add our own constructor args 
  window._Terminal = window.Terminal 
  window.Terminal = function(opts){
    const term = new window._Terminal({ ...opts,
      cursorBlink:true,
      onSelectionChange: function(e){ console.log("selectchange") },
      letterSpacing: 0
    })

    term.onSelectionChange( () => {
      document.execCommand('copy')
      term.select(0, 0, 0)
      isoterm.emit('status','copied to clipboard')
    })

    term.onRender( () => {

      // xterm relies on requestAnimationFrame (which does not called in immersive mode)
      let _window = term._core._coreBrowserService._window
      if( !_window.requestAnimationFrameAFRAME ){ // patch the planet!

//        _window.requestAnimationFrameAFRAME = function(cb){
//          if( term.tid != null ) clearTimeout(term.tid)
//          term.tid = setTimeout( function(){
//            console.log("render")
//            cb()
//            term.tid = null
//          },100)
//        }
        _window.requestAnimationFrameAFRAME = 
          AFRAME.utils.throttleLeadingAndTrailing( function(cb){
            cb()
          },150 )

        // we proxy the _window object of xterm, and reroute 
        // requestAnimationFrame to requestAnimationFrameAFRAME
        _window = new Proxy(_window,{
          get(me,k){ 
            if( k == 'requestAnimationFrame' ){
              return me.requestAnimationFrameAFRAME
            }
            return me[k]
          },
          set(me,k,v){
            me[k] = v 
            return true
          }
        })
        term._core._coreBrowserService._window = _window 
      }

    })

    return term
  }


  this.addEventListener('emulator-started', function(){
    this.emulator.serial_adapter.term.element.querySelector('.xterm-viewport').style.background = 'transparent'
    // toggle immersive with ESCAPE
    //document.body.addEventListener('keydown', (e) => e.key == 'Escape' && this.emulator.serial_adapter.term.blur() )
  })

  const resize = (w,h) => {
    setTimeout( () => {
      if( isoterm?.emulator?.serial_adapter?.term ){
        isoterm.xtermAutoResize(isoterm.emulator.serial_adapter.term, isoterm.instance,-3)
      }
    },800) // wait for resize anim
  }
  isoterm.instance.addEventListener('window.onresize', resize )
  isoterm.instance.addEventListener('window.onmaximize', resize )
}

ISOTerminal.prototype.xtermAutoResize = function(term,instance,rowoffset){
  if( !term.element ) return

  const defaultScrollWidth = 24;
  const MINIMUM_COLS = 2;
  const MINIMUM_ROWS = 2;

  const dims = term._core._renderService.dimensions;
  const scrollbarWidth = (term.options.scrollback === 0
    ? 0
    : (term.options.overviewRuler?.width || defaultScrollWidth ));

  const parentElementStyle = window.getComputedStyle(instance.dom);
  const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
  const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')));
  const elementStyle = window.getComputedStyle(term.element);
  const elementPadding = {
    top: parseInt(elementStyle.getPropertyValue('padding-top')),
    bottom: parseInt(elementStyle.getPropertyValue('padding-bottom')),
    right: parseInt(elementStyle.getPropertyValue('padding-right')),
    left: parseInt(elementStyle.getPropertyValue('padding-left'))
  };
  const elementPaddingVer = elementPadding.top + elementPadding.bottom;
  const elementPaddingHor = elementPadding.right + elementPadding.left;
  const availableHeight = parentElementHeight - elementPaddingVer;
  const availableWidth = parentElementWidth - elementPaddingHor - scrollbarWidth;
  const geometry = {
    cols: Math.max(MINIMUM_COLS, Math.floor(availableWidth / dims.css.cell.width)),
    rows: Math.max(MINIMUM_ROWS, Math.floor(availableHeight / dims.css.cell.height))
  };
  term.resize(geometry.cols, geometry.rows + (rowoffset||0) );
}
