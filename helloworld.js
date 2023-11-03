AFRAME.registerComponent('helloworld', {
  schema: { },

  init: function () { 

    // entrypoint for single-file xrshell/AFRAME components 
    this.addEventListener('xrshell', (opts) => {
      const require =  AFRAME.components.xrshell.require  // available by adding <a-scene xrshell> 

      require({
          "superclipboard":    { required: false, repo: "https://github.com/Utopiah/aframe-components"     },
          "spatialeditor":     { required: false, repo: "https://github.com/coderofsalvation/xrshell-apps" }, 
          "jsonform":          { required: false, repo: "https://github.com/coderofsalvation/xrshell-apps" }, 
          "speech-controls":   { required: false, url:  "https://rawgit.com/Utopiah/aframe-speech-controls-component/master/dist/aframe-speech-controls-component.min.js"},
          "ISOterminal":       { required: false } 
      })
      // the components above get saved cached/to the browser (IndexedDB) filesystem (so the ISOterminal can read/edit them as well in realtime)
      // when a required component cannot be included, then this (helloworld) component will be removed and 
      // errors will show up in the javascript browser and XR terminal consoles.
    })

    this.addEventListener('ISOterminal',       (term) => { // act when component gets mounted 
      // 'term' is basically AFRAME.components.ISOterminal
      term.write('hello to XR linux terminal from AFRAME')
      term.on('stdout', (data) => {
        // react to data being spoken/typed into the terminal
        // (spatial prompting like 'open foo.gltf', 'component helloworld' e.g.)
      })
    })

    this.addEventListener('jsonform', (form) => {
      form.add({
        name: 'edit',         // "everything must have an edit-button" ~ Fabien Benetou
        icon: 'gear',         // see https://jsonforms.io to see json-2-html forms                   
        type: 'object',       // json-2-webxr has nothing like it (yet) but offers uniform interfaces across components 
        properties:{           
          enabled:            { type: 'boolean',  default: true, format: 'checkbox' } 
          edit_terminal:      { type: 'function', cb: () => AFRAME.components.ISOterminal.exec('pico /com/helloworld.js') }
          edit_spatialeditor: { type: 'function', cb: () => AFRAME.components.spatialeditor.edit('helloworld')            }
        }
      }

    })

    console.log("hello world!")

  }

});
