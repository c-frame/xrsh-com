ISOTerminal.addEventListener('ready', function(){
  this.boot()
})

ISOTerminal.prototype.boot = async function(){
  // set environment
  let env = ['export BROWSER=1']
  for ( let i in document.location ){
    if( typeof document.location[i] == 'string' )
      env.push( 'export '+String(i).toUpperCase()+'="'+document.location[i]+'"')
  }
  await this.emulator.create_file("profile.browser", this.toUint8Array( env.join('\n') ) )
  if( this.serial_input == 0 ){
    let boot = "source /etc/profile\n"
    this.send(boot+"\n")
  }

  if( this.emulator.serial_adapter ) this.emulator.serial_adapter.term.focus()
  else{
    let els = [...document.querySelectorAll("div#screen")]
    els.map( (el) => el.focus() )
  }
}

