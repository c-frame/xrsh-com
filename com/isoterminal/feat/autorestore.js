if( typeof emulator != 'undefined' ){
  // inside worker-thread
  importScripts("localforage.js")  // we don't instance it again here (just use its functions)
  
  this['emulator.restore_state'] = async function(data){ 
    return new Promise( (resolve,reject) => {
      localforage.getItem("state", async (err,stateBase64) => {
        if( stateBase64 && !err ){
          state = ISOTerminal.prototype.convert.base64ToArrayBuffer( stateBase64 )
          await emulator.restore_state(state)
          console.log("restored state")
        }else return reject("worker.js: emulator.restore_state (could not get state from localforage)")
        resolve()
      })
    })
  }
  this['emulator.save_state'] = async function(){ 
    console.log("saving session")
    let state = await emulator.save_state()
    localforage.setDriver([
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ]).then( () => {
      localforage.setItem("state", ISOTerminal.prototype.convert.arrayBufferToBase64(state) )
      console.log("state saved")
    })
  }


}else{
  // inside browser-thread
  ISOTerminal.addEventListener('emulator-started', function(e){
    this.autorestore(e)
  })

  ISOTerminal.prototype.autorestore = async function(e){

    localforage.setDriver([
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ]).then( () => {

      localforage.getItem("state", async (err,stateBase64) => {
        if( stateBase64 && !err && confirm('continue last session?') ){
          this.noboot = true // see feat/boot.js
          try{
            await this.worker['emulator.restore_state']()
            // simulate / fastforward boot events
            this.postBoot( () => {
              this.send("l\n") 
              this.send("hook wakeup\n")
            })
          }catch(e){ console.error(e) }
        } 
      })

      this.save = async () => {
        await this.worker['emulator.save_state']()
      }

      window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Sure you want to leave?\nTIP: enter 'save' to continue this session later";
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage;                            //Webkit, Safari, Chrome
      });

    })
  }

}
