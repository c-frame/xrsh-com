ISOTerminal.addEventListener('ready', function(){
  this.screenButtonsCreate()
})

ISOTerminal.prototype.screenButtonsCreate = function(){
  let el = document.createElement("a-plane")
  el.setAttribute("height","1")
  el.setAttribute("width","1")
  el.setAttribute("scale","0.1 0.07 1")
  el.setAttribute("position", "-0.326 -0.270 0")
  this.instance.appendChild(el)
}

