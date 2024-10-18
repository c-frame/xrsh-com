if( typeof emulator != 'undefined' ){
  // inside worker-thread

  // unix to js device
  emulator.readFromPipe( 'dev/browser/js', async (data) => {
    const convert = ISOTerminal.prototype.convert
    const buf     = await this.emulator.read_file("dev/browser/js")
    const script  = convert.Uint8ArrayToString(buf)
    let PID="?"
    try{
      if( script.match(/^PID/) ){ 
        PID = script.match(/^PID=([0-9]+);/)[1] 
      }
      this.postMessage({event:'javascript-eval',data:{script,PID}})
    }catch(e){ 
      console.error(e)
    }
  })

}else{
  // inside browser-thread
  
  ISOTerminal.addEventListener('javascript-eval', async function(e){
    const {script,PID} = e.detail
    let res
    try{
      res = (new Function(`${script}`))()
      if( res && typeof res != 'string' ) res = JSON.stringify(res,null,2)
    }catch(e){
      console.error(e)
      console.info(script)
      res = "error: "+e.toString()
      if( e.filename ){
        res += "\n"+e.filename+":"+e.lineno+":"+e.colno
      }
    }
    // update output to 9p with PID as filename (in /mnt/run)
    this.emit('fs9p.update_file', [`run/${PID}`, this.convert.toUint8Array(res)] )
  })

}
