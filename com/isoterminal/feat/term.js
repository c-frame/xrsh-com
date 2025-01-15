ISOTerminal.addEventListener('init', function(){
  this.TermInit()
})

ISOTerminal.prototype.TermInit = function(){

  const setupTerm = (opts) => {
    if( !opts ) return
    const {instance, aEntity} = opts
    const el = aEntity.el.dom.querySelector('#term')
    opts.termOpts = {
      cols: aEntity.cols, 
      rows: aEntity.rows,
      el_or_id: el,
      scrollback: aEntity.rows*3, 
      fontSize: null // 
      //rainbow: [Term.COLOR_MAGENTA, Term.COLOR_CYAN ],
      //xr: AFRAME.scenes[0].renderer.xr,
      //map: {
      //  'ArrowRight': { ch: false, ctrl: '\x1b\x66' },  // this triggers ash-shell forward-word
      //  'ArrowLeft':  { ch: false, ctrl: '\x1b\x62' }   //                         backward-word
      //}
    }

    // patch Term-class
    Term.prototype.move_textarea = function(){} /* *TODO* *FIXME* does not work in winbox */

    Term.prototype.pasteHandler = function(original){
      return function (ev){
        original.apply(this,[ev])
      }
    }( Term.prototype.pasteHandler )

    Term.prototype.keyDownHandler = function(original){
      return function (e){
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          return true; // bubble up to pasteHandler (see pastedrop.js)
        }
        original.apply(this,[e])
      }
    }( Term.prototype.keyDownHandler )

    Term.prototype.href = (a) => {
      if( a.href ){
        this.exec(`source /etc/profile.sh; hook href "${a.href}"`)
      }
      return false
    }
    this.term = new Term( opts.termOpts )
    this.term.colors = [
        /* normal */
        "#000000",
        "#2FA",
        "#7700ff",
        "#555555",
        "#0000ff",
        "#aa00aa",
        "#ff00aa",
        "#aaaaaa",
        /* bright */
        "#555555",
        "#ff5555",
        "#2CF",
        "#aa00ff",
        "#5555ff",
        "#ff55ff",
        "#55ffff",
        "#ffffff" 
    ];
    this.term.open(el)
    this.term.el = el

    this.term.setKeyHandler( (ch) => this.send(ch) )
    aEntity.el.addEventListener('focus', () => el.querySelector("textarea").focus() )
    aEntity.el.addEventListener('serial-output-string', (e) => {
      this.term.write(e.detail)
    })
    //aEntity.term.emit('initTerm',this)
    //aEntity.el.addEventListener('focus', () => this.vt100.focus() )

    //aEntity.el.addEventListener('serial-output-string', (e) => {
    //  this.vt100.write(e.detail)
    //})

  }

  this.addEventListener('term_init', (opts) => setupTerm(opts.detail) )
}
