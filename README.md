PIXI.Input
================

Canvas based input elements rendered on a PIXI stage.

#### How to use ####
Simply load the pixi.input.js file after your pixi.js file.
```
<script src="pixi.js"></script>
<script src="pixi.input.js"></script>
```

#### Creating an Text Input ####

```javascript
var input = new PIXI.Input();
stage.addChild(input);
```

#### Creating an password Input ####

```javascript
var input = new PIXI.Input({ type: "password" });
stage.addChild(input);
```

#### Creating a Button ####

```javascript
var button = new PIXI.Button({ value: "Button", onmouseup: function() { /* do something */ } });
stage.addChild(button);
```

#### Creating a Select Box ####

```javascript
var select = new PIXI.Select({ 
  options: {
      test1: "I'm a select box!",
      test2: "Test 2",
      test3: "Test 3",
      test4: "Test 4",
      test5: "Test 5"
  },
  selected: "test2"
});
stage.addChild(input);
```

#### Reading values ####
```javascript
console.log(input.value);
console.log(select.value);
```

#### Customizeable! ####
```javascript
var options = {
    readonly: false,
    maxlength: null,
    placeholder: "",
    placeholderColor: "#bfbebd",
    selectionColor: "rgba(179, 212, 253, 0.8)",
    value: "",
    type: "text",
    onsubmit: noop,
    onkeydown: noop,
    onkeyup: noop,
    onfocus: noop,
    onblur: noop,
    onmousedown: noop,
    onmouseup: noop,
    width: 170,
    height: null,
    padding: 5,
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 3,
    backgroundImage: null,
    backgroundColor: "#fff",
    backgroundGradient: null,
    boxShadow: "1px 1px 0px rgba(0, 0, 0, 0.1)",
    innerShadow: "0px 0px 4px rgba(0, 0, 0, 0.4)",
    valign: "middle",
    align: "center",
    outline: 0,
    text: {
        font: "14px Arial",
        fill: "#000",
        align: "left",
        stroke: "#000",
        strokeThickness: 0
    }
};
var input = new PIXI.Input(options);
```

Example for an Input with bold red font, without innerShadow, and onsubmit event.

```javascript
var input = new PIXI.Input({
  text: { font: "bold 12px Arial", fill: "#f00" },
  innerShadow: "none",
  onsubmit: function() {
    console.log("submitting.. input.value = " + input.value);
  }
});
```

#### Define your own themes ####
```javascript
PIXI.InputObject.Style("pink", {
  selectionColor: "#fff",
  backgroundGradient: [
      [ 0.00, "rgba(252,236,252,1)" ],
      [ 0.50, "rgba(251,166,225,1)" ],
      [ 0.51, "rgba(253,137,215,1)" ],
      [ 1.00, "rgba(255,124,216,1)" ]
  ],
  align: "center",
  innerShadow: "none",
  text: { font: "bold 10pt Arial", fill: "#000" }
});

var button = new PIXI.Button({ 
    value: "Click me!", 
    style: "pink", 
    width: 100, 
    onmouseup: function() { 
      // do stuff
    }
});
```

#### Contribution ####

This is still an early stage for our input elements and there are many things to do!
If you want to contribute to this project, please send a Pull Request. And don't start publishing your own versions of this plugin, or else many different versions might be around, which is just confusing.

TODO:

* Cleaning the code base
* Closer orientation to PIXI coding style
* Merge Text/Background to one single texture for faster rendering of not focused inputs
* Better support for Cocoon.js and other non HTML wrappers
* Fixing the keyboard raise on mobile devices
* Better control over Select box design
* Better support for PIXI v2
* Support for Phaser
* Checkboxes
* Radio Buttons
* Avoiding to recreate textures if input's use the exact same background.
* bower/grunt/etc, all the things we need in this rep.
* And much more. I will post my thoughts on this later.
