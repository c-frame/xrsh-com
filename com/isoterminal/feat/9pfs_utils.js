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
    const buf   = typeof data == 'string' ? convert.toUint8Array(data) : data
    await this.Write(p.id,0, buf.length, buf )
    // update inode
    inode.size = buf.length
    const now = Math.round(Date.now() / 1000);
    inode.atime = inode.mtime = now;
    me.postMessage({event:'exec',data:[`touch /mnt/${file}`]}) // update inode 
    return new Promise( (resolve,reject) => resolve(buf) )

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

this['fs9p.append_file'] = function(){ emulator.fs9p.append_file.apply(emulator.fs9p, arguments[0]) }
this['fs9p.update_file'] = function(){ emulator.fs9p.update_file.apply(emulator.fs9p, arguments[0]) }
