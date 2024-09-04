ISOTerminal.addEventListener('emulator-started', function(){
  let emulator    = this.emulator
  let isoterminal = this 

  emulator.fs9p.Read = async function(inodeid, offset, count){
    let file
    const inode    = this.inodes[inodeid];
    const inodeDir = this.GetParent(inode.fid)

    if( !inodeDir ){ // undefined = /mnt
      for( const [name,childid] of this.inodes[0].direntries ){
        if( childid == inode.fid ){ file = name }
      }
    }

    if( file ){
      let data = {promise:false, file}
      isoterminal.emit('file-read', data)
      // if( data.promise ){ return await data.promise } // *FIX* size already 
    }

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return await this.follow_fs(inode).Read(foreign_id, offset, count);
    }

    return await this.get_data(inodeid, offset, count);
  };

  emulator.fs9p.update_file = async function(file,data){

      const p = this.SearchPath(file);

      if(p.id === -1)
      {
          return Promise.resolve(null);
      }
      
      const inode = this.GetInode(p.id);
      const buf   = typeof data == 'string' ? isoterminal.toUint8Array(data) : data
      await this.Write(p.id,0, buf.length, buf )
      // update inode
      inode.size = buf.length
      const now = Math.round(Date.now() / 1000);
      inode.atime = inode.mtime = now;
      return new Promise( (resolve,reject) => resolve(buf) )

  }

  emulator.fs9p.append_file = async function(file,data){

      const p = this.SearchPath(file);

      if(p.id === -1)
      {
          return Promise.resolve(null);
      }
      
      const inode = this.GetInode(p.id);
      const buf   = typeof data == 'string' ? isoterminal.toUint8Array(data) : data
      await this.Write(p.id, inode.size, buf.length, buf )
      // update inode
      inode.size = inode.size + buf.length
      const now = Math.round(Date.now() / 1000);
      inode.atime = inode.mtime = now;
      return new Promise( (resolve,reject) => resolve(buf) )

  }

})
