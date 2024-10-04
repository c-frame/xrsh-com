function ISOTerminal(instance,opts){
  // create a neutral isoterminal object which can be decorated
  // with prototype functions and has addListener() and dispatchEvent()
  let obj      = new EventTarget()
  obj.instance = instance
  obj.opts     = opts 
  // register default event listeners (enable file based features like isoterminal/jsconsole.js e.g.)
  for( let event in ISOTerminal.listener )
    for( let cb in ISOTerminal.listener[event] )
      obj.addEventListener( event, ISOTerminal.listener[event][cb] )
  // compose object with functions
  for( let i in ISOTerminal.prototype ) obj[i] = ISOTerminal.prototype[i]
  obj.emit('init')
  return obj
}

ISOTerminal.prototype.emit = function(event,data,sender){
  data = data || false 
  const evObj = new CustomEvent(event, {detail: data} )
  // forward event to worker/instance/AFRAME element or component-function
  // this feels complex, but actually keeps event- and function-names more concise in codebase
  this.dispatchEvent( evObj )
  if( sender !=  "instance" && this.instance                    ) this.instance.dispatchEvent(evObj)
  if( sender !=  "worker"   && this.worker                      ) this.worker.postMessage({event,data})
  if( sender !== undefined  && typeof this[event] == 'function' ) this[event].apply(this, data && data.push ? data : [data] )
}

ISOTerminal.addEventListener = (event,cb) => {
  ISOTerminal.listener = ISOTerminal.listener || {}
  ISOTerminal.listener[event] = ISOTerminal.listener[event] || []
  ISOTerminal.listener[event].push(cb)
}

ISOTerminal.prototype.exec = function(shellscript){
  this.send(shellscript+"\n",1)
}

ISOTerminal.prototype.serial_input = 0; // can be set to 0,1,2,3 to define stdinput tty (xterm plugin)

ISOTerminal.prototype.send = function(str, ttyNr){
  if( ttyNr == undefined) ttyNr = this.serial_input
  if( ttyNr == undefined ){
    if( this.emulator.serial_adapter ){
      this.emulator.serial_adapter.term.paste(str)
    }else this.emulator.keyboard_send_text(str) // vga screen
  }else{
    this.convert.toUint8Array( str ).map( (c) => {
      this.worker.postMessage({event:`serial${ttyNr}-input`,data:c})
    })
  }
}

ISOTerminal.prototype.convert = {

  arrayBufferToBase64: function(buffer){
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return window.btoa(binary);
  },

  base64ToArrayBuffer: function(base64) {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
  },

  toUint8Array: function(str) {
    str = String(str) || String("")
    // Create a new Uint8Array with the same length as the input string
    const uint8Array = new Uint8Array(str.length);
    
    // Iterate over the string and populate the Uint8Array
    for (let i = 0; i < str.length; i++) {
        uint8Array[i] = str.charCodeAt(i);
    }
    return uint8Array;
  },

  Uint8ArrayToString: function(arr){
    const decoder = new TextDecoder('utf-8'); // Specify encoding
    return decoder.decode(arr);
  }
}

ISOTerminal.prototype.start = function(opts){

  let me = this
  this.opts = {...this.opts, ...opts}
  let image = {}
  if( opts.iso.match(/\.iso$/) ) image.cdrom   = { url: opts.iso }
  if( opts.iso.match(/\.bin$/) ) image.bzimage = { url: opts.iso }

  opts = { ...image,
    uart1:true, // /dev/ttyS1
    uart2:true, // /dev/ttyS2
    uart3:true, // /dev/ttyS3
    wasm_path:        "v86.wasm",
    memory_size:      opts.memory * 1024 * 1024,
    vga_memory_size:  2 * 1024 * 1024,
    //screen_container: opts.dom,
    //serial_container: opts.dom,
    bios: {
      url: "bios/seabios.bin",
    },
    vga_bios: {
      url: "bios/vgabios.bin",
      //urg|: "com/isoterminal/bios/VGABIOS-lgpl-latest.bin",
    },
    network_relay_url: "wss://relay.widgetry.org/",
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_freg|=on vga=ask", //vga=0x122",
    //bzimage_initrd_from_filesystem: true,
    //filesystem: {
    //          baseurl: "com/isoterminal/v86/images/alpine-rootfs-flat",
    //          basefs:  "com/isoterminal/v86/images/alpine-fs.json",
    //      },
    //screen_dummy: true,
    //disable_jit: false,
    filesystem: {},
    autostart: true,
  };

  /*
   * the WebWorker (which runs v86)
   *
   */

  this.worker = new Worker("com/isoterminal/worker.js");
  this.worker.onmessage = (e) => {
    const xr = this.instance.sceneEl.renderer.xr
    const {event,data} = e.data
    const cb = (event,data) => () => {
      if( data.promiseId ){
        this.workerPromise.resolver(data)     // forward to promise resolver 
      }else this.emit(event,data,"worker")    // forward event to world
      
    }
    // don't let workers cause framerate dropping
    if( xr.isPresenting ){
      xr.getSession().requestAnimationFrame(cb(event,data))
    }else{
      window.requestAnimationFrame(cb(event,data))
    }
  }
 
  /*
   * postMessage.promise basically performs this.worker.postMessage
   * in a promise way (to easily retrieve async output)
   */

  this.worker.postMessage.promise = function(data){
    if( typeof data != 'object' ) data = {data}
    this.resolvers = this.resolvers || {}
    this.id        = this.id == undefined ? 0 : this.id
    data.id = this.id++
    // Send id and task to WebWorker
    this.worker.postMessage(data)
    return new Promise(resolve => this.resolvers[data.id] = resolve);
  }.bind(this.worker.postMessage)

  this.worker.postMessage.promise.resolver = function(data){
    if( !data || !data.promiseId ) throw 'promiseId not given'
    this.resolvers[ data.promiseId ](data);
    delete this.resolvers[ data.promiseId ]; // Prevent memory leak
  }.bind(this.worker.postMessage)


  this.emit('runISO',{...opts, bufferLatency: this.opts.bufferLatency })
  const loading = [
    'loading quantum bits and bytes',
    'preparing quantum flux capacitors',
    'crunching peanuts and chakras',
    'preparing parallel universe',
    'loading quantum state fluctuations',
    'preparing godmode',
    'loading cat pawns and cuteness',
    'beaming up scotty',
    'still faster than Windows update',
    'loading a microlinux',
    'figuring out meaning of life',
    'Aligning your chakras now',
    'Breathing in good vibes',
    'Finding inner peace soon',
    'Centering your Zen energy',
    'Awakening third eye powers',
    'Tuning into the universe',
    'Balancing your cosmic karma',
    'Stretching time and space',
    'Recharging your soul battery',
    'Transcending earthly limits'
  ]

  const loadmsg = loading[ Math.floor(Math.random()*1000) % loading.length ] + "..(please wait..)"
  const text_color = "\r[38;5;129m" 
  const text_reset = "\033[0m"
  this.emit('status',loadmsg)
  this.emit('serial-output-string', text_color + loadmsg + text_reset + "\n\r")


  this.addEventListener('emulator-started', async (e) => {

    // OVERLAY FS *FIXME*
    //if( me.opts.overlayfs ){
    //  fetch(me.opts.overlayfs)
    //  .then( (f) => {
    //    f.arrayBuffer().then( (buf) => {
    //      emulator.create_file('overlayfs.zip', new Uint8Array(buf) )
    //    })
    //  })
    //}

    let line = ''
    this.ready = false

    this.addEventListener(`serial0-output-string`, async (e) => {
      const str = e.detail

      // lets scan for a prompt so we can send a 'ready' event to the world
      if( !this.ready && str.match(/\n(\/ #|~%|\[.*\]>)/) ){
        this.emit('postReady',{})
        this.ready = true
        setTimeout( () => this.emit('ready',{}), 500 )
      }
      if( this.ready ) this.emit('serial-output-string', e.detail )
    })
  });

}

ISOTerminal.prototype.bufferOutput = function(byte,cb,latency){
  const resetBuffer = () => ({str:""})
  this.buffer = this.buffer || resetBuffer()
  this.buffer.str += String.fromCharCode(byte)
  if( !this.buffer.id ){ 
    cb(this.buffer.str)                   // send out leading call
    this.buffer = resetBuffer()
    this.buffer.id = setTimeout( () => {  // accumulate succesive calls 
      if( this.buffer.str ) cb(this.buffer.str)
      this.buffer = resetBuffer()
    }, this.latency || 250)
  }
}

