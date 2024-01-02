//
// this is just an AFRAME wrapper for https://golden-layout.com
//
//

AFRAME.registerComponent('windowmanager', {
  schema: { 
  },

  dependencies:{
    "cash":              "https://cdn.jsdelivr.net/npm/cash-dom/dist/cash.min.js", // tiny jquery replacement
    "goldenlayout":      "https://golden-layout.com/files/latest/js/goldenlayout.min.js",
    "goldenlayout_css1": "https://golden-layout.com/files/latest/css/goldenlayout-base.css",
    "goldenlayout_css2": "https://golden-layout.com/files/latest/css/goldenlayout-dark-theme.css"
  },

  events:{
    ready: function(){
      //this.initLayout()
    }
  },

  init: function () {  
    this.require( this.dependencies )
  },

  initLayout: async function(){
   // const goldenlayout_module = "https://cdn.skypack.dev/pin/golden-layout@v2.5.0-dAz3xMzxIRpbnbfEAik0/mode=imports/optimized/golden-layout.js";
   //   const { ComponentContainer, ComponentItemConfig, GoldenLayout, ItemType } = await import(goldenlayout_module)

    this.el.layout = document.createElement('div')
    document.querySelector("#overlay").appendChild(this.el.layout)

    class MyComponent {
        constructor(container) {
            this.container = container;
            this.rootElement = container.element;
            this.rootElement.innerHTML = '<h2>' + 'Component Type: MyComponent' + '</h2>';
            this.resizeWithContainerAutomatically = true;
        }
    }

    const myLayout = {
        content: [
          {
            title: 'Terminal 1',
            type: 'component',
            componentType: 'MyComponent',
            width: 50,
          },
          {
            title: 'My Component 2',
            type: 'component',
            componentType: 'MyComponent',
            // componentState: { text: 'Component 2' }
          }
        ]
    };


    const goldenLayout = new GoldenLayout(this.el.layout);
    goldenLayout.registerComponent( 'MyComponent', MyComponent);
    goldenLayout.loadLayout(myLayout);
    goldenLayout.addComponent('MyComponent', undefined, 'Added Component');
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "windowmanager",
    "name": "Window Manager",
    "icons": [
      {
        "src": "/images/icons-vector.svg",
        "type": "image/svg+xml",
        "sizes": "512x512"
      }
    ],
    "id": "/?source=pwa",
    "start_url": "/?source=pwa",
    "background_color": "#3367D6",
    "display": "standalone",
    "scope": "/",
    "theme_color": "#3367D6",
    "shortcuts": [],
    "description": "2D/3D management of windows",
    "screenshots": [
      {
        "src": "/images/screenshot1.png",
        "type": "image/png",
        "sizes": "540x720",
        "form_factor": "narrow"
      }
    ],
    "help":`
Window Manager 

The window manager manages all the windows in 2D/XR.
This is a core XRSH system application
    `
  }

});

