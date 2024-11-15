let emulator    = this.emulator
let me          = this

emulator.fs9p.update_file = async function(file,data){
    const convert = ISOTerminal.prototype.convert

    const p = this.SearchPath(file);

    if(p.id === -1)
    {
        return emulator.create_file(file,data)
    }
    
    const inode = this.GetInode(p.id);
    const buf   = typeof data == 'string' ? convert.toUint8Array(data) : data || ""
    if( buf.length == 0 ) return new Promise( (resolve,reject) => resolve(data) )

    try{
      await this.Write(p.id,0, buf.length, buf )
      // update inode
      inode.size = buf.length
      const now = Math.round(Date.now() / 1000);
      inode.atime = inode.mtime = now;
      return new Promise( (resolve,reject) => resolve(buf) )
    }catch(e){
      console.error({file,data})
      return new Promise( (resolve,reject) => reject(e) )
    }
}

emulator.fs9p.append_file = async function(file,data){
    const convert = ISOTerminal.prototype.convert

    const p = this.SearchPath(file);

    if(p.id === -1)
    {
        return Promise.resolve(null);
    }
    
    const inode = this.GetInode(p.id);
    const buf   = typeof data == 'string' ? convert.toUint8Array(data) : data
    await this.Write(p.id, inode.size, buf.length, buf )
    // update inode
    inode.size = inode.size + buf.length
    const now = Math.round(Date.now() / 1000);
    inode.atime = inode.mtime = now;
    return new Promise( (resolve,reject) => resolve(buf) )

}

