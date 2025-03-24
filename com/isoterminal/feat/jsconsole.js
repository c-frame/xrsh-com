ISOTerminal.prototype.redirectConsole = function(handler){
   const log = console.log;
   const dir = console.dir;
   const err = console.error;
   const warn = console.warn;
   const addLineFeeds = (str) => typeof str == 'string' ? str.replace(/\n/g,"\r\n") : str

   console.log = (...args)=>{
       const textArg = args[0];
       handler( addLineFeeds(textArg) );
       log.apply(log, args);
   };
   console.error = (...args)=>{
       const textArg = args[0]
       handler( addLineFeeds(textArg), '\x1b[31merror\x1b[0m');
       err.apply(log, args);
   };
   console.dir = (...args)=>{
       const textArg = args[0]
       let str = JSON.stringify(textArg,null,2)+'\n'
       handler( addLineFeeds(str) )
       dir.apply(log, args);
   };
   console.warn = (...args)=>{
       const textArg = args[0]
       handler( addLineFeeds(textArg),'\x1b[38;5;208mwarn\x1b[0m');
       err.apply(log, args);
   };

}

ISOTerminal.prototype.enableConsole = function(opts){

  opts = opts || {stdout:false}

  this.redirectConsole( (str,prefix) => {
    let _str = typeof str == 'string' ? str : JSON.stringify(str)
    let finalStr = "";
    prefix = prefix ? prefix+' ' : ''
    _str.trim().split("\n").map( (line) => {
      finalStr += `${opts.stdout ? '' : "\x1b[38;5;165m/dev/browser: \x1b[0m"}`+prefix+line+'\n'
    })
    if( opts.stdout ){
      this.emit('serial-output-string', finalStr)
    }else this.emit('append_file', ["/dev/browser/console",finalStr])
  })

  window.addEventListener('error', function(event) {
    if( event.filename ){
      console.error(event.filename+":"+event.lineno+":"+event.colno)
      console.error(event.message);
      console.error(event.error);
    }else console.error(event)
  });

  window.addEventListener('unhandledrejection', function(event) {
    console.error(event);
  });

  if( opts.stdout ){
    window.menu = () => this.bootMenu()
    this.emit('serial-output-string', "\n\n\r☑ initialized javascript console\n");
    this.emit('serial-output-string', "\r☑ please use these functions to print:\n");
    this.emit('serial-output-string', "\r└☑ console.log(\"foo\")\n");
    this.emit('serial-output-string', "\r└☑ console.warn(\"foo\")\n");
    this.emit('serial-output-string', "\r└☑ console.dir({foo:12})\n");
    this.emit('serial-output-string', "\r└☑ console.error(\"foo\")\n");
    this.emit('serial-output-string', "\r\n");
    this.emit('serial-output-string', "\rtype 'menu()' to return to mainmenu");
    this.emit('serial-output-string', "\r\n");
  }
}

ISOTerminal.addEventListener('emulator-started', function(){
  this.enableConsole()
})

ISOTerminal.addEventListener('init', function(){
  this.addEventListener('enable-console', function(opts){
    this.enableConsole(opts.detail)
  })

  // REPL: jsconsole
  ISOTerminal.prototype.boot.menu.push(
    {
      key: "j",
      title: (opts) => "just give me an javascript-console in WebXR instantly",
      init: function(){ 
        this.prompt = "\r[36m>[0m "
        this.emit('enable-console',{stdout:true})
        this.emit('status',"javascript console")
        this.console = ""
        setTimeout( () => {
          this.send(this.prompt)
        }, 100 )
      },
      keyHandler: function(ch){ 
        this.send(ch)
      },
      cmdHandler: function(cmd){
        this.send("\n\r")
        eval(cmd)
        setTimeout( () => this.send(this.prompt) ,10)  // because worker vs terminal
      }
    }
  )

})
