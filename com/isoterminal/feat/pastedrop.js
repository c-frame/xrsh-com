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
      this.pasteWriteFile( this.convert.toUint8Array(pastedText) ,type)
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

}
