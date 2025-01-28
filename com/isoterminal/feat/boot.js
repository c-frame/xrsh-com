ISOTerminal.addEventListener('ready', function(e){
  setTimeout( () => this.boot(), 50 ) // because of autorestore.js
})

ISOTerminal.prototype.bootMenu = function(e){
  this.boot.menu.selected = false // reset
  let msg = '\n\r'
  this.boot.menu.map( (m) => {
    msg += `\r[36m  ${m.key})[0m ${m.title(this.opts)}\n`
  })
  msg += `\n\r  enter choice> `
  this.send(msg)
}

ISOTerminal.addEventListener('bootmenu', function(e){ this.bootMenu() })

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

// here REPL's can be defined
ISOTerminal.prototype.boot.menu = []

// REPL: iso
if( typeof window.PromiseWorker != 'undefined' ){ // if xrsh v86 is able to run in  in worker 
  ISOTerminal.prototype.boot.menu.push(
    {
      key: "1",
      title: (opts) => `boot [31m${String(opts.iso || "").replace(/.*\//,'')}[0m Linux ❤️ `,
      init: function(){ this.bootISO() },
      keyHandler: function(ch){ this.send(ch) }  // send to v86 webworker
    }
  )
}

// REPL: jsconsole
ISOTerminal.prototype.boot.menu.push(
  {
    key: "j",
    title: (opts) => "just give me an javascript-console in WebXR instantly",
    init: function(){ 
      this.prompt = "\r[36m>[0m "
      this.emit('enable-console',{stdout:true})
      this.emit('status',"javascript console")
      this.console = ""
      setTimeout( () => {
        this.send(this.prompt)
      }, 100 )
    },
    keyHandler: function(ch){
      let erase = false
      if( ch == '\x7F' ){
        ch = "\b \b" // why does write() not just support \x7F ?
        erase = true
      }
      this.send(ch)
      const reset = () => {
        this.console = ""
        setTimeout( () => {
          if( this.boot.menu.selected ) this.send(this.prompt)
        },100)
      }
      if( (ch == "\n" || ch == "\r") ){
        try{
          this.send("\n\r")
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
)
