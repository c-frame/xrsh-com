/* Remote storage feature
 *
 * NOTE: this feature extends the localstorage functions.
 *       this file can be excluded without crippling the 
 *       core localstorage mechanism.
 */

// see https://remotestorage.io/rs.js/docs/data-modules/
ISOTerminal.prototype.remoteStorageModule = { 
  name: 'xrsh', 
  builder: function(privateClient, publicClient) {
    return {
      exports: {
        add: function(data,opts) {
          if( !data || !opts.filename || !opts.mimetype) throw 'webxr.add() needs filedata + filename + mimetype'
          const client = opts.client = opts.public ? publicClient : privateClient;
          return client.storeFile(opts.mimetype, opts.filename,data)
        },

        getListing: function(a,opts){
          opts = opts || {}
          const client = opts.public ? publicClient : privateClient;
          return client.getListing(a)
        },

        getFile: function(file,opts){
          opts = opts || {}
          const client = opts.public ? publicClient : privateClient;
          return client.getFile(file)
        },

        remove: function(file,opts){
          opts = opts || {}
          const client = opts.public ? publicClient : privateClient;
          return client.remove(file)
        }

      }
    }
  }
};

// this is the HTML which we append to the remotestorage widget: 
// https://remotestorage.io/rs.js/docs/getting-started/connect-widget.html
const _rs_widget_html = `
  <div class="form" id="remote">
    <select class="remote" id="states"></select>
    <button id="save">save</button>
    &nbsp;
    <a class="btn remote" href="https://inspektor.5apps.com/?path=xrsh%2F" style="background:#888" target="_blank">filemanager</a>
    <div id="result"></div>
  </div>
  <div class="form" id="local" style="position:relative">
    <hr>
    <div class="header">WebBrowser session:</div>
    <div style="text-align:right">
      <button id="saveLocal">save</button>
      <button id="restoreLocal">restore</button>
    </div>
  </div>
  <!-- disabled for now -->
  <div class="form" id="local" style="position:relative; display:none">
    <hr>
    <div class="header">File session:</div>
    <div style="text-align:right">
      <button id="saveLocalFile">save file</button>
      <button id="restoreLocalFile">import file</button>
    </div>
  </div>

  <style type="text/css">
    #remotestorage-widget{
      position:fixed;
      top:0;
      right:0;
    }
    #remotestorage-widget h1, 
    #remotestorage-widget h2, 
    #remotestorage-widget h3, 
    #remotestorage-widget h4, 
    #remotestorage-widget h5{
      color:#222;
    } 
    #remotestorage-widget .rs-widget{
      margin:25px;
    }
    #remotestorage-widget .rs-closed .form{
      display:none !important;
    }
    #remotestorage-widget .form select#states{
      padding: 5px;
      margin-top: 10px;
      margin-right: 10px;
      border-radius: 5px;
    }
    #remotestorage-widget .form #result{
      padding-top:10px;
    }
    #remotestorage-widget .form select,
    #remotestorage-widget .form button,
    #remotestorage-widget .form a{
      height:35px;
      margin-bottom:0;
    }
    #remotestorage-widget *{
      font-size:15px;
    }
    #remotestorage-widget div.header{
      position:absolute;
      display:inline;
      top:15px;
      left:0;
      font-weight:bold;
    }
    #remotestorage-widget .form .btn {
      text-decoration: none;
      color: white;
      margin-top: 10px;
      margin-bottom: 10px;
      display: inline-block;
      line-height: 15px;
    }
    #remotestorage-widget .form{
      margin-top:10px;
    }
    #remotestorage-widget .btn:hover, 
    #remotestorage-widget button:hover {
      background:#CCC;
    }
  </style>
`

const widgetForm = function(opts){
  let   el = document.querySelector("#remotestorage-widget select#states")
  const $widget = document.querySelector("#remotestorage-widget .rs-widget")
  const $result = document.querySelector("#remotestorage-widget #result")
  if( !el ){

    let div = document.createElement('div')
    div.innerHTML = _rs_widget_html
    $widget.appendChild(div)
    $widget.querySelector("h3").innerText = "Click here to connect your storage"

    el = $widget.querySelector("select#states")
    el.addEventListener('change', () => {
      if( el.options.selectedIndex == 0 ) return; // ignore default option
      this.remoteStorage.widget.filename = el.value
      opts.status = "loading..."
      $widget.classList.add(["blink"])
      this.remoteStorage.xrsh.getFile(el.value)
      .then( (data,err) => {
        this.restore({remotestorage:true, data:data.data})
      })
    })

    this.setupStorageListeners($widget,opts)
  }

  this.updateStorageForm(el,$widget,$result,opts)
}

ISOTerminal.prototype.remoteStorageWidget = function(){
  if( this.remoteStorageWidget.installed ) return // only do once
  let apis = {
    //dropbox: "ce876ce",
    //googledrive: "c3983c3"
  } 
  const modules = [ this.remoteStorageModule ]
  const remoteStorage = this.remoteStorage = new RemoteStorage({logging: true, modules })
  remoteStorage.setApiKeys(apis)

  remoteStorage.on('not-connected',   (e) => { 
    this.remoteStorage.connected = false 
    this.remoteStorage.widget.form({show:false})
  })
  remoteStorage.on('ready',           (e) => { })
  remoteStorage.on('connected',       (e) => { 
    this.remoteStorage.connected = true 
    this.remoteStorage.widget.form({update:true,show:true})
  })

  remoteStorage.access.claim( `xrsh`, 'rw');           // our data dir
  remoteStorage.caching.enable( `/xrsh/` )             // local-first, remotestorage-second
  remoteStorage.caching.enable( `/public/xrsh/` )      // local-first, remotestorage-second

  // create widget
  let opts = {}
  opts.modalBackdrop = false
  opts.leaveOpen     = false
  const widget = remoteStorage.widget = new window.Widget(remoteStorage, opts)
  widget.attach();
  widget.form = widgetForm.bind(this)

  this.remoteStorageWidget.installed = true
}

ISOTerminal.prototype.setupStorageListeners = function($widget,opts){

  this.addEventListener("ready", () => {
    opts.loading = false 
    opts.status = "session loaded"
  })

  // setup events
  $widget.querySelector("button#save").addEventListener("click", () => {
    this.save({remotestorage:true}) 
  })
  $widget.querySelector("button#saveLocal").addEventListener("click", async () => {
    if( confirm("save current session?") ){
      $widget.classList.add(['blink'])
      await this.worker.save_state()
      $widget.classList.remove(['blink'])
      alert("succesfully saved session")
    }
  })
  $widget.querySelector("button#restoreLocal").addEventListener("click", async () => {
    this.restore({localstorage:true})
  })
  $widget.querySelector("button#saveLocalFile").addEventListener("click", () => {
    alert("saveFile")
  })
  $widget.querySelector("button#restoreLocalFile").addEventListener("click", () => {
    alert("saveFile")
  })
  $widget.addEventListener("click", () => this.remoteStorage.widget.open() )
  this.addEventListener("restored", () => this.remoteStorage.widget.form({loading:false, status:"session restored"}) )
}

ISOTerminal.prototype.updateStorageForm = function(el,$widget,$result,opts){

  if( typeof opts.show != 'undefined' ){
    $widget.querySelector('.form#remote').style.display = opts.show ? 'block' : 'none' 
  }
  
  if( typeof opts.status != 'undefined'){
    $result.innerText = opts.status
  }

  if( opts.public ){
    const link = this.remoteStorage.remote.href + '/public/xrsh/' + this.remoteStorage.widget.filename 
    const linkWebView = document.location.href.replace(/(\?|#).*/,'') + `#1&img=${link}` 
    $result.innerHTML += `<br><a class="btn" href="${linkWebView}" target="_blank">public weblink</a>`
  }

  if( typeof opts.loading != 'undefined' ){
      $widget.classList[ opts.loading ? 'add' : 'remove' ](["blink"]) 
  }

  if( opts.update ){

    const createOption = (opt) => {
      let option = document.createElement("option")
      option.value = opt.value
      option.innerText = opt.name || opt.value
      el.appendChild(option)
    }

    el.innerHTML = ''
    createOption({value:"-- snapshots --"})
    this.remoteStorage.xrsh.getListing()
    .then( (data,err) => {
      for( let file in data ){
        createOption({value:file})
      }
    })

  }
}

const requireFiles = () => AFRAME.utils.require({remotestorageWidget:"assets/aframe-remotestorage.min.js"})
const getForage    = () => localforage.setDriver([
                            localforage.INDEXEDDB,
                            localforage.WEBSQL,
                            localforage.LOCALSTORAGE
                          ])

// we extend the autorestore feature at the init-event 
ISOTerminal.addEventListener('init', function(e){

  const decorateSave = () => {

    let localSave = this.save

    this.save = async (opts) => {
      requireFiles()
      .then( getForage )
      .then( async () => {
       
        if( opts.localstorage ){
          this.save.localstorage(opts) // default behaviour
        }

        this.remoteStorageWidget()

        if( opts.remotestorage ){
          this.remoteStorage.widget.open() // force open dialog

          let filename = String(this.remoteStorage.widget.filename || "snapshot").replace(/\.bin/,'')
          filename = prompt("please name your snapshot:", filename )
          filename = filename.replace(/\.bin*/,'') + '.bin'

          // make it public or not (disabled for now as it does not work flawlessly)
          const public = false // confirm('create a public link?') 
          this.remoteStorage.widget.filename = filename

          this.remoteStorage.widget.form({loading:true,status: "saving.."})  

          await this.worker.save_state()
          localforage.getItem("state", async (err,stateBase64) => {
            this.remoteStorage.xrsh.add( stateBase64, {filename, mimetype: 'application/x-v86-base64', public})
            .then( () => {
              console.log("saved to remotestorage") 
              setTimeout( 
                () => this.remoteStorage.widget.form({update:true, loading:false, status:"saved succesfully", public})
              ,500 )
            })
            .catch( console.error )
          })
        }

      })
    }
    this.save.localstorage = localSave 
  }

  const decorateRestore = () => {

    let localRestore = this.restore 

    this.restore = async (opts) => {
      requireFiles()
      .then( getForage )
      .then( async () => {

        document.querySelector("#remotestorage-widget .rs-widget").classList.add(['blink'])
        if( opts.localstorage ){
          this.restore.localstorage.apply(this,opts) // default behaviour
        }
        if( opts.remotestorage ){
          localforage.setItem( "state", opts.data )
          .then( () => this.restore.localstorage.call(this,opts) ) // now trigger default behaviour
        }

      })
    }
    this.restore.localstorage = localRestore
    this.autorestore = this.restore // reroute automapping
  }

  // decorate save() and restore() of autorestore.js after it's declared (hence the setTimeout)
  this.addEventListener('autorestore-installed', () => {
    decorateSave()
    decorateRestore()
  })

})

// decorate autorestore
const autorestoreLocalStorage = ISOTerminal.prototype.autorestore;
ISOTerminal.prototype.autorestore = function(data){
  requireFiles().then( async () => {
    this.remoteStorageWidget()
  })
}

