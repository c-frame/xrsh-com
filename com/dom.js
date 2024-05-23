/*
 * ## dom
 *
 * instances reactive DOM component from AFRAME component's `dom` metadata 
 *
 * ```html 
 *  <script>
 *    AFRAME.registerComponent('mycom',{
 *      init: function(){ this.data.foo = 1 }, 
 *      dom: {
 *        scale:   3,
 *        events:  ['click'],
 *        html:    (me) => `<div id="iconmenu">${me.data.foo}</div>`,
 *        css:     (me) => `#iconmenu { display:block }`
 *      },
 *      event: {
 *        click: (e) => alert(e),
 *        foo:   (e) => alert("I was updated!")
 *      }
 *    })
 *  </script>
 *
 *  <a-entity mycom dom/>
 * ```
 *
 * | property     | type               | example                                                                                |
 * |--------------|--------------------|----------------------------------------------------------------------------------------|
 * | `com`        | `array` of strings | <a-entity app="app/launcher.js; registers: https://foo.com/index.json, ./index.json"/> |
 *
 * | event        | target | info                                                                                               |
 * |--------------|-------------------------------------------------------------------------------------------------------------|
 * | `DOMready`   | self   | fired when dom component (`this.dom`) is created                                                   |
 */

AFRAME.registerComponent('dom',{

  init: function(){
    Object.values(this.el.components)
    .map( (c) => {
      if( c.dom && c.attrName != "dom"){ 
        this.dom = c.dom
        this.com = c
      }
    })
    if( !this.dom ) return console.warn('dom.js did not find a .dom object inside components')

    this
    .ensureOverlay()
    .addCSS()
    .createReactiveDOMElement()
    .scaleDOMvsXR()
    .triggerKeyboardForInputs()
    .setupListeners()

    document.querySelector('#overlay').appendChild(this.el.dom)
    this.el.emit('DOMready',{el: this.el.dom})
  },

  ensureOverlay(){
    // ensure overlay
    let overlay = document.querySelector('#overlay')
    if( !overlay ){
      overlay = document.createElement('div')
      overlay.id = "overlay"
      document.body.appendChild(overlay)
      document.querySelector("a-scene").setAttribute("webxr","overlayElement:#overlay")
    }
    return this
  },

  reactify: function(el,data){
    return new Proxy(data, {
      get(me,k,v)  { 
        return me[k]
      },
      set(me,k,v){
        me[k] = v
        el.emit(k,{el,k,v})
      }
    })
  },

  // creates el.dom  (the 2D DOM object)
  createReactiveDOMElement: function(){
    this.el.dom = document.createElement('div')
    this.el.dom.innerHTML = this.dom.html(this)
    this.el.dom.className = this.dom.attrName 
    this.com.data = this.reactify( this.el, this.com.data )
    if( this.dom.events ) this.dom.events.map( (e) => this.el.dom.addEventListener(e, (ev) => this.el.emit(e,ev) ) )
    this.el.dom = this.el.dom.children[0]
    return this
  },

  addCSS: function(){
    if( this.dom.css && !document.head.querySelector(`style#${this.attrName}`) ){
      document.head.innerHTML += `<style id="${this.attrName}">${this.dom.css(this)}</style>`
    }
    return this
  },

  scaleDOMvsXR: function(){
    if( this.dom.scale ) this.el.setAttribute('scale',`${this.dom.scale} ${this.dom.scale} ${this.dom.scale}`)
    return this
  },

  setupListeners: function(){
    this.el.sceneEl.addEventListener('apps:2D', () => this.el.setAttribute('visible', false) )
    this.el.sceneEl.addEventListener('apps:XR', () => {
      this.el.setAttribute('visible', true)
      this.el.setAttribute("html",`html:#${this.el.uid}; cursor:#cursor`)
    })
    return this
  },

  triggerKeyboardForInputs: function(){
    // https://developer.oculus.com/documentation/web/webxr-keyboard ;
    [...this.el.dom.querySelectorAll('[type=text]')].map( (input) => {
      let triggerKeyboard = function(){
        this.focus()
        console.log("focus")
      }
      input.addEventListener('click', triggerKeyboard )
    })
    return this
  }

})
