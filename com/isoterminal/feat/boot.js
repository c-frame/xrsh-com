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
  let boot = `clear ; echo 'preparing xrsh env..'; source /mnt/profile`
  // exec hash as extra boot cmd
  if( document.location.hash.length > 1 ){ 
    boot += ` ; cmd='${decodeURI(document.location.hash.substr(1))}' && $cmd`
  }
  this.emulator.serial0_send(boot+"\n")
  this.emulator.serial_adapter.term.focus()
}

