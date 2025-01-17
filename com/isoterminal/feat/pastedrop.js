if( typeof emulator != 'undefined' ){
  // inside worker-thread

}else{
  // inside browser-thread
  //
  ISOTerminal.prototype.pasteWriteFile = async function(data,type,filename){
    this.pasteWriteFile.fileCount = this.pasteWriteFile.fileCount || 0
    const file = `clipboard/`+ ( filename || `user-paste-${this.pasteWriteFile.fileCount}`)
    await this.worker.create_file(file, data ) 
    // run the xrsh hook
    this.hook("clipboard", [ `/mnt/${file}`, type ] )
    console.log("clipboard paste: /mnt/"+file)
    this.pasteWriteFile.fileCount += 1
  }

  ISOTerminal.prototype.pasteFile = async function(data){
    const {type,item,pastedText} = data
    if( pastedText){
      // the terminal handles this (pastes text)
      // this.pasteWriteFile( this.convert.toUint8Array(pastedText) ,type, null, true)
    }else{
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result)
        this.pasteWriteFile( arr, type, file.name ); // or use readAsDataURL for images
      };
      reader.readAsArrayBuffer(file);
    }
  }

  ISOTerminal.prototype.pasteInit = function(opts){
      // bind upload input
      const {instance, aEntity} = opts
      const el = aEntity.el.dom.querySelector('#pastedrop') // upload input
      el.addEventListener('change', (e) => {
        const file = el.files[0];
        const item = {...file, getAsFile: () => file } // pasteFile-event works with File objets
        const data = { item, type: file.type }
        this.emit( 'pasteFile', data, "worker" ) // impersonate as worker (as worker cannot handle File objet)
      })
  }

  ISOTerminal.addEventListener('init', function(){
    this.addEventListener('term_init', (opts) => this.pasteInit(opts.detail) )
  })
}
