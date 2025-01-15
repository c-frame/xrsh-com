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
  this.preventFrameDrop( () => {
    // forward event to worker/instance/AFRAME element or component-function
    // this feels complex, but actually keeps event- and function-names more concise in codebase
    this.dispatchEvent( evObj )
    if( sender !=  "instance" && this.instance                    ) this.instance.dispatchEvent(evObj)
    if( sender !=  "worker"   && this.worker                      ) this.worker.postMessage({event,data}, PromiseWorker.prototype.getTransferable(data) )
    if( sender !== undefined  && typeof this[event] == 'function' ) this[event].apply(this, data && data.push ? data : [data] )
  })
}

ISOTerminal.addEventListener = (event,cb) => {
  ISOTerminal.listener = ISOTerminal.listener || {}
  ISOTerminal.listener[event] = ISOTerminal.listener[event] || []
  ISOTerminal.listener[event].push(cb)
}

ISOTerminal.prototype.exec = function(shellscript){
  this.send(`printf "\n\r"; ${shellscript}\n`,1)
}

ISOTerminal.prototype.hook = function(hookname,args){
  let cmd = `{ type hook || source /etc/profile.sh; }; hook ${hookname} "${args.join('" "')}"`
  this.exec(cmd)
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
      this.preventFrameDrop( 
        () => {
          this.worker.postMessage({event:`serial${ttyNr}-input`,data:c})
        }
      )
    })
  }
}

ISOTerminal.prototype.convert = {

  arrayBufferToBase64: function(buffer){
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
  },

  base64ToArrayBuffer: function(base64) {
      const binaryString = atob(base64);
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
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_freg|=on vga=ask", //vga=0x122",
    net_device:{
      relay_url:"fetch", // or websocket proxy "wss://relay.widgetry.org/",
      type:"virtio"
    },
    //bzimage_initrd_from_filesystem: true,
    //filesystem: {
    //          baseurl: "com/isoterminal/v86/images/alpine-rootfs-flat",
    //          basefs:  "com/isoterminal/v86/images/alpine-fs.json",
    //      },
    //screen_dummy: true,
    //disable_jit: false,
    filesystem: {},
    autostart: true,
    prompt: this.opts.prompt,
    debug: this.opts.debug ? true : false
  };

  this
  .setupWorker(opts)
  .startVM(opts)
}

ISOTerminal.prototype.setupWorker = function(opts){

  /*
   * the WebWorker (which runs v86)
   *
   */
  this.worker = new PromiseWorker( "com/isoterminal/worker.js", (cb,event,data) => {
    if( !data.promiseId ) this.emit(event,data,"worker")  // forward event to world
    this.preventFrameDrop( cb(event,data) )
  })

  return this
}

ISOTerminal.prototype.getLoaderMsg = function(){

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

  const empower    = [
    "FOSS gives users control over their software, offering freedom to modify and share",
    "Feeling powerless? FOSS escapes a mindset known as learned helplessness",
    "FOSS breaks this cycle by showing that anyone can learn and contribute",
    "Proprietary software can make users dependent, but FOSS offers real choices",
    "FOSS communities provide support and encourage users to develop new skills",
    "FOSS empowers users to customize and improve their tools",
    "Engaging with FOSS helps build confidence and self-reliance in tech",
    "FOSS shows that anyone can shape the digital world with curiosity and effort",
    "Linux can revive old computers, extending their life and reduces e-waste",
    "Many lightweight Linux distributions run smoothly on older hardware",
    "Installing Linux on aging devices keeps them functional instead of sending them to the landfill",
    "Linux uses fewer resources, making it ideal for reusing older machines",
    "By using Linux, you can avoid buying new hardware, cutting down on tech waste",
    "Instead of discarding slow devices, Linux can bring them back to life",
    "Linux supports a wide range of devices, helping to prevent e-waste",
    "Open-source drivers in Linux enable compatibility with old peripherals, reducing the need for replacements",
    "Free Linux software helps users avoid planned obsolescence in commercial products",
    "Switching to Linux promotes sustainability by reducing demand for new gadgets and lowering e-waste"
  ]

  let motd = `
\r[38;5;57m . .  ____  _____________  ________. ._. ._. . . 
\r[38;5;93m . . .\\   \\/  /\\______   \\/   _____//   |   \\. . 
\r[38;5;93m . . . \\     /  |       _/\\_____  \\/    ~    \\ . 
\r[38;5;129m . . . /     \\  |    |   \\/        \\    Y    / . 
\r[38;5;165m . . ./___/\\  \\ |____|_  /_______  /\\___|_  /. . 
\r[38;5;201m . . . . . .\\_/. . . . \\/ . . . .\\/ . . _ \\/ . . 
\r[38;5;165m ▬▬▬▬▬▬▬▬ [38;5;51mhttps://xrsh.isvery.ninja[38;5;165m ▬▬▬▬▬▬▬▬▬▬▬▬
\r[38;5;165m local-first, polyglot, unixy WebXR IDE & runtime
\r[38;5;57m
\r  credits
\r  ------- 
\r  @nlnet@nlnet.nl 
\r  @lvk@mastodon.online
\r  @utopiah@mastodon.pirateparty.be [38;5;51m
\r  https://www.w3.org/TR/webxr
\r  https://xrfragment.org 
\r  https://threejs.org 
\r  https://aframe.org 
\r  https://busybox.net
\r  https://buildroot.org
\r`

  const text_color = "\r[38;5;129m" 
  const text_reset = "\033[0m"
  const loadmsg    = "\n\r"+loading[ Math.floor(Math.random()*1000) % loading.length ] + "..please wait \n\n\r"
  const empowermsg = "\n\r"+text_reset+'"'+empower[ Math.floor(Math.random()*1000) % empower.length ] + '"\n\r'
  return { motd, text_color, text_reset, loadmsg, empowermsg}
}

ISOTerminal.prototype.startVM = function(opts){

  this.v86opts = opts

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
      if( !this.ready && str.match(/\n(\/ #|~ #|~%|\[.*\]>)/) ) this.postBoot()

      if( this.ready || !this.opts.muteUntilPrompt ) this.emit('serial-output-string', e.detail )
    })
  });

  let msglib = this.getLoaderMsg()
  let msg = msglib.motd

  if( this.opts.prompt ){
    msg += `\r
\r[36m  1)[0m boot [31m${String(this.opts.iso || "").replace(/.*\//,'')}[0m Linux ❤️
\r[36m  2)[0m just give me a javascript-console in WebXR [=instant]
\r
\renter number> `
  }else{
    bootISO()
  }
  this.emit('status',msglib.loadmsg)
  this.emit('serial-output-string', msg)

}

ISOTerminal.prototype.bootISO = function(){
  let msglib = this.getLoaderMsg()
  let msg = "\n\r" + msglib.empowermsg + msglib.text_color + msglib.loadmsg + msglib.text_reset
  this.emit('serial-output-string', msg)
  this.emit('runISO',{...this.v86opts, bufferLatency: this.opts.bufferLatency })
}


ISOTerminal.prototype.postBoot = function(cb){
  this.emit('postReady',{})
  this.ready = true
  setTimeout( () => {
    this.emit('ready',{})
    if( cb ) cb()
  }, 500 )
}

// this is allows (unsophisticated) outputbuffering
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


//ISOTerminal.prototype.bufferOutput = function(byte, cb, latency, buffer) {
//  const str = String.fromCharCode(byte);
//  //if (str === '\r' || str === '\n' || str.charCodeAt(0) < 32 || str.charCodeAt(0) === 127) {
//  //  cb(str);
//  //} else if (str === '\x1b') { // ESC
//  //  buffer.esc = true;
//  //} else if (buffer.esc) {
//  //  cb('\x1b' + str);
//  //  buffer.esc = false;
//  //} else {
//    buffer.str = (buffer.str || '') + str;
//    if (Date.now() - (buffer.timestamp || 0) >= latency) {
//    console.log(buffer.str)
//      cb(buffer.str);
//      buffer.str = '';
//      buffer.timestamp = Date.now();
//    }
//  //}
//}

ISOTerminal.prototype.preventFrameDrop = function(cb){
  // don't let workers cause framerate dropping
  const xr = this.instance.sceneEl.renderer.xr
  if( xr.isPresenting ){
    xr.getSession().requestAnimationFrame(cb)
  }else{
    window.requestAnimationFrame(cb)
  }
}

