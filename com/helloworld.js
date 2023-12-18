AFRAME.registerComponent('helloworld', {
  schema:{
    things: {type:'array'},
    $:      {default: document.createElement('div') }
  },
  init: function() { 

    this.data   = new Proxy( this.data, {  
      html(data){ 
        return `
          <style> ul{ position:absolute; top:0; left:0; z-index:0 } </style> 
          <ul> ${this.render(data)} </ul>
        `
      },
      render(data ){ return `<li>${data.things.join("</li><li>")}</li>`},
      set(data,k,v){ (data[k] = v) && (data.$.innerHTML = this.html(data)) },
      get(data,k  ){ return data[k] != undefined ? data[k] : data }
    })

    document.body.appendChild(this.data.$)

    setInterval( () => {
      // update js --> HTML+AFRAME
      this.data.things = [ ...this.data.things, Math.random() ].slice(-3)

    },500)

  },

})
