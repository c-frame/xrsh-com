ISOTerminal.addEventListener('init', function(){
  if( typeof Terminal != 'undefined' ) this.xtermInit()
})

ISOTerminal.prototype.xtermInit = function(){
  let isoterm = this
  // monkeypatch Xterm (which V86 initializes) so we can add our own constructor args 
  window._Terminal = window.Terminal 
  window.Terminal = function(opts){
    const term = new window._Terminal({ ...opts,
      cursorBlink:true,
      onSelectionChange: function(e){
        debugger
      }
    })

    term.onSelectionChange( () => {
      document.execCommand('copy')
      term.select(0, 0, 0)
      isoterm.emit('status','copied to clipboard')
    })
    return term
  }

  this.addEventListener('emulator-started', function(){
    this.emulator.serial_adapter.term.element.querySelector('.xterm-viewport').style.background = 'transparent'
  })
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
