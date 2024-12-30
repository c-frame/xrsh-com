ISOTerminal.addEventListener('init', function(){
  this.VT100Init()
})

ISOTerminal.prototype.VT100Init = function(){

  const setupVT100 = (opts) => {
    if( !opts ) return
    const {instance, aEntity} = opts
    const el = aEntity.el.dom.querySelector('#term')
    opts.vt100 = {
      cols: aEntity.cols, 
      rows: aEntity.rows,
      el_or_id: el,
      max_scroll_lines: aEntity.rows*2, 
      nodim: true,
      rainbow: [VT100.COLOR_MAGENTA, VT100.COLOR_CYAN ],
      xr: AFRAME.scenes[0].renderer.xr,
      map: {
        'ArrowRight': { ch: false, ctrl: '\x1b\x66' },  // this triggers ash-shell forward-word
        'ArrowLeft':  { ch: false, ctrl: '\x1b\x62' }   //                         backward-word
      }
    }
    this.vt100 = new VT100( opts.vt100 )
    this.vt100.el = el
    this.vt100.curs_set( 1, true)
    this.vt100.focus()
    this.vt100.getch( (ch,t) => {
      this.send( ch )
    })
    aEntity.term.emit('initVT100',this)
    aEntity.el.addEventListener('focus', () => this.vt100.focus() )

    //aEntity.el.addEventListener('serial-output-byte', (e) => {
    //  const byte = e.detail
    //  var chr = String.fromCharCode(byte);
    //  this.vt100.addch(chr)
    //})
    aEntity.el.addEventListener('serial-output-string', (e) => {
      this.vt100.write(e.detail)
    })

    //aEntity.el.addEventListener('serial-output-string', (e) => {
    //  const str = e.detail;
    //  let currentString = '';
    //  let inEscapeSequence = false;
    //  for (let i = 0; i < str.length; i++) {
    //    const chr = str[i];
    //    if (chr === '\r' || chr === '\n' || chr === '\b' || chr.charCodeAt(0) < 32 || chr.charCodeAt(0) === 127) {
    //      if (currentString) {
    //        this.vt100.write(currentString);
    //        currentString = '';
    //      }
    //      this.vt100.addch(chr);
    //    } else if (chr === '\x1b') {
    //      if (currentString) {
    //        this.vt100.write(currentString);
    //        currentString = '';
    //      }
    //      inEscapeSequence = true;
    //      this.vt100.addch(chr);
    //    } else if (inEscapeSequence) {
    //      if (chr ==='m') {
    //        inEscapeSequence = false;
    //      }
    //      this.vt100.addch(chr);
    //    } else {
    //      currentString += chr;
    //    }
    //  }
    //  if (currentString) {
    //    this.vt100.write(currentString);
    //  }
    //});



    // translate file upload into pasteFile
    this.vt100.upload.addEventListener('change', (e) => {
      const file = this.vt100.upload.files[0];
      const item = {...file, getAsFile: () => file }
      this.el.emit('pasteFile', { item, type: file.type });
    })

  }

  this.addEventListener('term_init', (opts) => setupVT100(opts.detail) )
}
