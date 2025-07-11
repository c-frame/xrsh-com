ISOTerminal.addEventListener('ready', function(e){
  setTimeout( () => this.boot(), 50 ) // allow other features/plugins to settle first (autorestore.js e.g.)
})

ISOTerminal.prototype.bootMenu = function(e){
  this.boot.menu.selected = false // reset
  const autobootURL = e && e.detail.bootMenuURL && document.location.hash.length > 1
  const autoboot    = e && e.detail.bootMenu || autobootURL
  if( !autoboot ){

    let msg = '\n\r'
    this.boot.menu.map( (m) => {
      msg += `\r[36m${m.key})[0m ${m.title(this.opts)}\n`
    })
    msg += `\n\r[36menter choice>[0m `
    this.send(msg)

  }else{ // autoboot
    if( this.term ){
      this.term.handler( String(e.detail.bootMenu || e.detail.bootMenuURL).charAt(0) )
      this.term.handler("\n")
    }
  }
}

ISOTerminal.addEventListener('bootMenu', function(e){this.bootMenu(e) })

ISOTerminal.prototype.boot = async function(e){
  // set environment
  let env = [
    `export LINES=${this.opts.rows}`,
    `export COLUMNS=${this.opts.cols}`,
    'export BROWSER=1',
  ]
  for ( let i in document.location ){
    if( typeof document.location[i] == 'string' && !String(i).match(/(hash|search)/) ){
      env.push( 'export '+String(i).toUpperCase()+'="'+decodeURIComponent( document.location[i]+'"') )
    }
  }

  // we export the cached hash/query (because they might be gone due to remotestorage plugin)
  if( this.boot.hash.charAt(2) == '&' ){ // strip bootoption
    this.boot.hashExBoot = `#` + this.boot.hash.substr(3)
  }
  env.push( 'export HASH="'+decodeURIComponent( this.boot.hashExBoot || this.boot.hash )   +'"' )
  env.push( 'export QUERY="'+decodeURIComponent( this.boot.query ) +'"' )
  await this.worker.create_file("profile.browser", this.convert.toUint8Array( env.join('\n') ) )

  if( this.serial_input == 0 ){
    if( !this.noboot ){
      this.send("source /etc/profile # \\o/ FOSS powa!\n")
    }
  }

}

ISOTerminal.prototype.boot.fromImage = false 
ISOTerminal.prototype.boot.menu = []
ISOTerminal.prototype.boot.hash = document.location.hash
ISOTerminal.prototype.boot.query = document.location.search

// here REPL's can be defined

// REPL: iso
if( typeof window.PromiseWorker != 'undefined' ){ // if xrsh v86 is able to run in  in worker 
  ISOTerminal.prototype.boot.menu.push(
    {
      key: "1",
      title: (opts) => `boot [31m${String(opts.iso || "").replace(/.*\//,'')}[0m Linux ❤️ `,
      init: function(){ 

        // hack to notify href clicks
        Term.prototype.href = (a) => {
          if( a.href ){
            this.exec(`source /etc/profile.sh; hook href "${a.href}"`)
          }
          return false
        }

        this.bootISO() 
      },
      keyHandler: function(ch){ this.send(ch) }  // send to v86 webworker
    }
  )
}

