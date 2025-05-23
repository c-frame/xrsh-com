if( typeof emulator != 'undefined' ){
  // inside worker-thread

  // unix to js device
  emulator.readFromPipe( 'dev/browser/js', async (data) => {
    const convert = ISOTerminal.prototype.convert
    const buf     = await this.emulator.read_file("dev/browser/js")
    const script  = convert.Uint8ArrayToString(buf)
    let PID=null
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
 

  /* 
   * here we're going to execute javascript in the browser,
   * both a terrible and great idea depending on a corporate vs personal computing angle.
   *
   * if a function-string gets evaluated, and it returns a promise..then we assume async.
   */
  ISOTerminal.addEventListener('javascript-eval', async function(e){
    const {script,PID} = e.detail
    let res;
    let error = false;

    const output = (res,PID) => {
      if( res && typeof res != 'string' ) res = JSON.stringify(res,null,2)
      // update output to 9p with PID as filename (in /mnt/run)
      if( PID ){
        this.worker.update_file(`run/${PID}.exit`, error ? "1" : "0")
        this.worker.update_file(`run/${PID}`, this.convert.toUint8Array(res) )
      }
    }

    try{
      let f = new Function(`${script}`);
      res = f();
      if( res && typeof res.then == 'function' ){ // if we got a promise
        res.then( (res) => output(res,PID) )
        res.catch( (e)  => output(e,PID) )
      }else{ // normal sync function
        output(res,PID)
      }
    }catch(err){
      error = true
      console.error(err)
      console.dir(err)
      res = "error: "+err.toString()

      // try to figure out line *FIXME*
      let line = err.stack.split("\n").find(e => e.includes("<anonymous>:") || e.includes("Function:"));
      if( line ){
        let lineIndex = (line.includes("<anonymous>:") && line.indexOf("<anonymous>:") + "<anonymous>:".length) ||  (line.includes("Function:") && line.indexOf("Function:") + "Function:".length);
        let lnr = +line.substring(lineIndex, lineIndex + 1) - 2
        res += script.split("\n")[lnr-1]
      }else console.dir(script)
      console.error(res)
      output(res,PID)
    }
  })

}
