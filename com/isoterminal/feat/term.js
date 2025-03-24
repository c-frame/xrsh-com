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

    this.term = new Term( opts.termOpts )
    Term.prototype.href = (a) => true
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


    // this is the default REPL
    // please do not edit or replace this
    // but instead extend/override ISOTerminal.prototype.boot.menu
    // as demonstrated in index.html
    this.term.setKeyHandler( (ch) => {
      let erase     = false
      const isEnter = ch == '\n' || ch == '\r'
      if( ch == '\x7F' ){
        ch = "\b \b" // why does write() not just support \x7F ?
        erase = true
      }
      if( this.boot.menu.selected ){
        if( isEnter ){ 
          this.boot.menu.selected.cmdHandler.call(this,this.lastCmd)
          this.lastCmd = ""
        }
        else this.boot.menu.selected.keyHandler.call(this,ch) 
      }else if( isEnter ){ 
        let menuitem = this.boot.menu.find( (m) => m.key == this.lastChar )
        if( menuitem ){
          this.boot.menu.selected = menuitem
          menuitem.init.call(this, () => {
            this.term.write("\n\r")
            this.bootMenu() 
          })
        }
      }else{
        ch.split("").map( (ch) => this.term.write( ch ) )
      }
      if( !erase ){
        this.lastChar = ch
        this.lastCmd  = this.lastCmd ? this.lastCmd + ch : ch
      }else this.lastCmd = this.lastCmd ? this.lastCmd.substr(0, this.lastCmd.length-1) : ""
    })

    aEntity.el.addEventListener('focus', () => {
      let textarea = el.querySelector("textarea")
      textarea.focus()
      if( document.activeElement != textarea ) textarea.focus() 
    })
    aEntity.el.addEventListener('serial-output-string', (e) => {
      let msg = e.detail
      this.term.write(msg)
    })
    //aEntity.term.emit('initTerm',this)
    //aEntity.el.addEventListener('focus', () => this.vt100.focus() )

    //aEntity.el.addEventListener('serial-output-string', (e) => {
    //  this.vt100.write(e.detail)
    //})

  }

  this.addEventListener('term_init', (opts) => setupTerm(opts.detail) )
}
