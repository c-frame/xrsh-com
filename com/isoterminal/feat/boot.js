ISOTerminal.addEventListener('ready', function(e){
  setTimeout( () => this.boot(), 50 ) // because of autorestore.js
})

ISOTerminal.addEventListener('bootmenu', function(e){
  let msg = '\n\r'
  this.boot.menu.map( (m) => {
    msg += `\r[36m  ${m.key})[0m ${m.title(this.opts)}\n`
  })
  msg += `\n\r  enter choice> `
  this.emit('serial-output-string', msg)
})

ISOTerminal.prototype.boot = async function(e){
  // set environment
  let env = [
    `export LINES=${this.opts.rows}`,
    `export COLUMNS=${this.opts.cols}`,
    'export BROWSER=1',
  ]
  for ( let i in document.location ){
    if( typeof document.location[i] == 'string' ){
      env.push( 'export '+String(i).toUpperCase()+'="'+decodeURIComponent( document.location[i]+'"') )
    }
  }
  await this.worker.create_file("profile.browser", this.convert.toUint8Array( env.join('\n') ) )

  if( this.serial_input == 0 ){
    if( !this.noboot ){
      this.send("source /etc/profile # \\o/ FOSS powa!\n")
    }
  }

}
ISOTerminal.prototype.boot.menu = [

  {
    key: "1",
    title: (opts) => `boot [31m${String(opts.iso || "").replace(/.*\//,'')}[0m Linux ❤️ `,
    init: function(){ this.bootISO() },
    keyHandler: function(ch){ this.send(ch) }  // send to v86 webworker
  },

  {
    key: "2",
    title: (opts) => "just give me an javascript-console in WebXR instantly",
    init: function(){ 
      this.prompt = "\r[36m>[0m "
      this.emit('enable-console',{stdout:true})
      this.emit('status',"javascript console")
      this.console = ""
      setTimeout( () => this.emit('serial-output-string', this.prompt), 100 )
    },
    keyHandler: function(ch){
      let erase = false
      if( ch == '\x7F' ){
        ch = "\b \b" // why does write() not just support \x7F ?
        erase = true
      }
      this.emit('serial-output-string', ch)
      const reset = () => {
        this.console = ""
        setTimeout( () => "\n\r"+this.emit('serial-output-string', this.prompt),100)
      }
      if( (ch == "\n" || ch == "\r") ){
        try{
          this.emit('serial-output-string', "\n\r")
          if( this.console ) eval(this.console)
          reset()
        }catch(e){ 
          reset()
          throw e // re throw
        }
      }else{
        if( erase ){
          this.console = this.console.split('').slice(0,-1).join('')
        }else{
          this.console += ch
        }
      }
    }
  }
]
