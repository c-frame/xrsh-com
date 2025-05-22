// this is restoring state to/from the v86 emulator
// however instead of passing the huge blob between webworker/browser 
// we transfer it via localforage as a base64 string

if( typeof emulator != 'undefined' ){
  // inside worker-thread
  importScripts("localforage.js")  // we don't instance it again here (just use its functions)
  
  this.restore_state = async function(data){ 
    // fastforward instance state
    this.opts.muteUntilPrompt = false
    this.ready                = true 

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
  this.save_state = async function(){ 
    return new Promise( async (resolve,reject ) => {
      console.log("saving session")
      let state = await emulator.save_state()
      localforage.setDriver([
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
      ])
      .then( () => {
        localforage.setItem("state", ISOTerminal.prototype.convert.arrayBufferToBase64(state) )
        console.log("state saved")
        resolve()
      })
      .catch( reject )
    })
  }


}else{
  // inside browser-thread
  ISOTerminal.addEventListener('emulator-started', function(e){
    this.autorestore(e)
    this.emit("autorestore-installed")
  })

  ISOTerminal.prototype.restore = async function(e){

    const onGetItem = (err,stateBase64) => {
      const askConfirm = () => {
        if( window.localStorage.getItem("restorestate") == "true" ) return true
        try{
          const scene = document.querySelector('a-scene');
          if( scene.is('ar-mode') ) scene.exitAR()
          if( scene.is('vr-mode') ) scene.exitVR()
        }catch(e){}
        return confirm( "Continue old session?" )
      }

      if( stateBase64 && !err && document.location.hash.length < 2 && askConfirm() ){
        this.noboot = true // see feat/boot.js
        try{
          this.worker.restore_state()
          .then( () => {
            // simulate / fastforward boot events
            this.postBoot( () => {
              // force redraw terminal issue
              this.send("l")
              setTimeout( () => this.send("l"), 200 )
              //this.send("12")
              this.emit("exec",["source /etc/profile.sh; hook wakeup\n"])
              this.emit("restored")
            })
          })
        }catch(e){ console.error(e) }
      }
    }

    const doRestore = () => {

      localforage.getItem("state", (err,stateBase64) => onGetItem(err,stateBase64) )

      window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Sure you want to leave?\nTIP: enter 'save' to continue this session later";
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage;                            //Webkit, Safari, Chrome
      });

    }

    localforage.setDriver([
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ])
    .then( () => doRestore() )

  }

  ISOTerminal.prototype.autorestore = ISOTerminal.prototype.restore // alias to launch during boot

}
