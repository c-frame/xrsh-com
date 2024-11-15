ISOTerminal.addEventListener('ready', function(e){
  setTimeout( () => this.boot(), 50 ) // because of autorestore.js
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
  this.worker.create_file("profile.browser", this.convert.toUint8Array( env.join('\n') ) )

  if( this.serial_input == 0 ){
    if( !this.noboot ){
      this.send("source /etc/profile # \\o/ FOSS powa!\n")
    }
  }

}

