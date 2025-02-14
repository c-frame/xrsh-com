ISOTerminal.prototype.enableRemoteKeyboard = function(opts){

  // initialize REPL 
  ISOTerminal.prototype.boot.menu.push(
    {
      key: "k",
      title: (opts) => "connect a remote keyboard",
      init: function( mainmenu ){ 
        this.emit('status',"")
        this.emit('enable-console',{stdout:true})
        setTimeout( () => {
          this.send("[2J\n\r1. open a terminal on your laptop/desktop\n\r")
          this.send("2. run (or install) the keyboard forwarder:\n\n\r")
          this.send("\t[36m$[0m wget https://xrsh.isvery.ninja/xrsh\n\r")
          this.send("\t[36m$[0m chmod +x xrsh\n\r")
          this.send("\t[36m$[0m ./xrsh --keyboard\n\r\n\r")
          this.send("\t[36mNOTE:[0m windows-users need WSL\n\n\r")
          this.send("press a key to connect..    (or 'm' for mainmenu)\n\r")
        }, 100 )
      },
      keyHandler: function(ch){
        this.send(ch)
        if( ch == 'm'){
          this.bootMenu()
        }else if( (ch == "\n" || ch == "\r") ){
          try{
            console.log("running websocket server")
            this.send("\n\r")
          }catch(e){ 
            reset()
            throw e // re throw
          }
        }
      }
    }
  )
}

ISOTerminal.addEventListener('init', function(){
  this.enableRemoteKeyboard()
})

