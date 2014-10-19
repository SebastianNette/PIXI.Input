/**
* The MIT License (MIT)

* Copyright (c) 2014 Sebastian Nette

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* 
*
*/

/**
 * PIXI Input Element v1.0.1
 * Copyright (c) 2014, Sebastian Nette
 * http://www.mokgames.com/
 */
(function(undefined) {

    // detect pixi version
    var isOldPIXI = PIXI.VERSION.indexOf("v1") !== -1;

    // detect cocoonjs
    var isCocoonJS = navigator && navigator.isCocoonJS;

    // cheap check for mobile, needs to be worked on
    var isMobile = (typeof window.orientation !== 'undefined');

    // blink interval
    var blinkInterval = 300;

    // empty function
    function noop() 
    {
    };

    // input defaults
    var inputDefaults = {
        readonly: false,
        maxlength: null,
        placeholder: "",
        placeholderColor: "#bfbebd",
        placeholderAlign: "",
        selectionColor: "rgba(179, 212, 253, 0.8)",
        selectionUpdated: false,
        selectionStart: -1,
        value: "",
        type: "text",
        onsubmit: noop,
        onkeydown: noop,
        onkeyup: noop,
        onfocus: noop,
        onblur: noop,
        onmousedown: noop,
        onmouseup: noop,
        cursorPos: 0,
        hasFocus: false,
        mouseDown: false
    };

    // input style defaults
    var styleDefaults = {
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

    // get the text property
    function getTextProp(el)
    {
        if (el.value !== undefined)
        {
            return 'value';
        }
        if (el.text !== undefined)
        {
            return 'text';
        }
        if (el.textContent !== undefined)
        {
            return 'textContent';
        }
        return 'innerText';
    };

    // set text
    function setText(el, prop, value)
    {
        el[prop] = value;
    };

    // get text
    function getText(el, prop)
    {
        return el[prop].replace(/\r/g, '');
    };

    // check for object
    function isObject(obj)
    {
        return typeof obj === 'object' && !!obj && !(obj instanceof Array);
    };

    // simple color textures
    var textures = {};
    function getSelectionTexture(color)
    {
        var texture = textures[color];
        
        if(!texture)
        {
            var can = document.createElement("canvas");
                can.width = 2;
                can.height = 2;
            
            var ctx = can.getContext("2d");
                ctx.fillStyle = color;
                ctx.fillRect(0,0,2,2);

            texture = PIXI.Texture.fromCanvas(can);
            textures[color] = texture;
        }

        return texture;
    };

    // mixin
    function extend(dest, source, force)
    {
        for(var prop in source) 
        {
            if(force)
            {
                dest[prop] = source[prop];
                continue;
            }
            var isObj = isObject(source[prop]);
            if(!dest.hasOwnProperty(prop))
            {
                dest[prop] = isObj ? {} : source[prop];
            }
            if(isObj)
            {
                if(!isObject(dest[prop]))
                {
                    dest[prop] = {};
                }
                extend(dest[prop], source[prop]);
            }
        }
        return dest;
    };

    // get font height
    function getFontHeight( obj )
    {
        if(obj._isBitmapFont)
        {
            return obj._lineHeight;
        }

        if(isOldPIXI || obj.determineFontHeight)
        {
            return obj.determineFontHeight('font: ' + obj.style.font  + ';') + obj.style.strokeThickness;
        }
        else
        {
            return parseInt(obj.getFontProperties(obj.style.font).fontSize, 10) + obj.style.strokeThickness;
        }
    };

    // rounded rect .. maybe replace this with a pixi graphic?
    function roundedRect(ctx, x, y, w, h, r)
    {
        if(r instanceof Array) {
            var r1 = r[0],
                r2 = r[1],
                r3 = r[2],
                r4 = r[3];
        } else {
            var r1 = r,
                r2 = r,
                r3 = r,
                r4 = r;
        }

        if (w < 2 * r1 || h < 2 * r1)
        {
            return roundedRect(ctx, x, y, w || 1, h || 1, 0);
        }

        ctx.beginPath();

        ctx.moveTo(x + r1, y);
        ctx.lineTo(x + w - r2, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
        ctx.lineTo(x + w, y + h - r3);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
        ctx.lineTo(x + r4, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r4);
        ctx.lineTo(x, y + r1);
        ctx.quadraticCurveTo(x, y, x + r1, y);

        ctx.closePath();
    };

    // calculate shadows
    function createShadow( opts, isBoxShadow )
    {
        var shadow = isBoxShadow ? opts.boxShadow : opts.innerShadow;

        // parse shadow
        if(shadow && shadow !== 'none')
        {
            var data = shadow.split('px ');
            shadow = {
                x: parseInt(data[0], 10),
                y: parseInt(data[1], 10),
                blur: parseInt(data[2], 10),
                color: data[3]
            };
        } 
        else 
        {
            shadow = { x: 0, y: 0, blur: 0, color: "" };
        }

        // extra for box shadow
        if(isBoxShadow)
        {
            if(shadow.x<0)
            {
                opts.shadowLeft = Math.abs(shadow.x) + shadow.blur;
                opts.shadowRight = shadow.blur + shadow.x;
            } 
            else 
            {
                opts.shadowLeft = Math.abs(shadow.blur - shadow.x);
                opts.shadowRight = shadow.blur + shadow.x;
            }

            if(shadow.y < 0)
            {
                opts.shadowTop = Math.abs(shadow.y) + shadow.blur;
                opts.shadowBottom = shadow.blur + shadow.y;
            }
            else
            {
                opts.shadowTop = Math.abs(shadow.blur - shadow.y);
                opts.shadowBottom = shadow.blur + shadow.y;
            }

            opts.shadowWidth = opts.shadowLeft + opts.shadowRight;
            opts.shadowHeight = opts.shadowTop + opts.shadowBottom;

        }

        return shadow;
    };

    // buffer canvas for shadows
    var shadowCanvas = document.createElement("canvas");
    var shadowContext = shadowCanvas.getContext("2d");

    // buffer canvas
    var bufferCanvas = document.createElement("canvas");
    var bufferContext = bufferCanvas.getContext("2d");

    // generates an input texture
    PIXI.ButtonFactory = function( can, ctx, opts )
    {
        // check if box shadow was parsed
        if(!isObject(opts.boxShadow))
        {
            opts.boxShadow = createShadow(opts, true);

            // update dimensions
            opts.outerWidth = opts.width + opts.padding * 2 + opts.borderWidth * 2 + opts.shadowWidth;
            opts.outerHeight = opts.height + opts.padding * 2 + opts.borderWidth * 2 + opts.shadowHeight;
        }

        // check if inner shadow was parsed
        if(!isObject(opts.innerShadow))
        {
            opts.innerShadow = createShadow(opts, false);
        }

        var width = opts.outerWidth || opts.width || 100;
        var height = opts.outerHeight || opts.height || 30;

        var borderRadius = opts.borderRadius;
        var borderWidth = opts.borderWidth;
        var shadowWidth = opts.shadowWidth;
        var shadowHeight = opts.shadowHeight;
        var shadowLeft = opts.shadowLeft;
        var shadowTop = opts.shadowTop;

        // set dimensions
        can.width = width;
        can.height = height;

        if(isCocoonJS) ctx.clearRect(0,0,width,height);

        // setup the box shadow
        ctx.shadowOffsetX = opts.boxShadow.x;
        ctx.shadowOffsetY = opts.boxShadow.y;
        ctx.shadowBlur = opts.boxShadow.blur;
        ctx.shadowColor = opts.boxShadow.color;

        // draw the border
        if (opts.borderWidth > 0)
        {
            ctx.fillStyle = opts.borderColor;
            roundedRect(ctx, shadowLeft, shadowTop, width - shadowWidth, height - shadowHeight, borderRadius);
            ctx.fill();

            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
        }

        var textboxHeight = opts.textboxHeight = height - borderWidth * 2 - shadowHeight;
        var textboxTop = opts.textboxTop = borderWidth + shadowTop;

        var textboxWidth = opts.textboxWidth = width - borderWidth * 2 - shadowWidth;
        var textboxLeft = opts.textboxLeft = borderWidth + shadowLeft;

        // check for bg image
        if(!opts.bgImage && opts.backgroundImage)
        {
            opts.bgImage = PIXI.Texture.fromImage(opts.backgroundImage);
            if(opts.bgImage.baseTexture.hasLoaded)
            {
                opts.dirty = true;
            }
            else
            {
                opts.bgImage.on( 'update', function() { opts.dirty = true; } );
            }
        }

        // check for bg color
        if(!opts.bgImage || !opts.backgroundImage || !opts.bgImage.baseTexture.hasLoaded)
        {

            // set background gradient if set
            if(opts.backgroundGradient && !isObject(opts.backgroundColor))
            {
                var length = opts.backgroundGradient.length;
                if(length < 2)
                {
                    return;
                }
                opts.backgroundColor = ctx.createLinearGradient( 0, 0, 0, height );
                for(var i = 0; i < length; i++)
                {
                    var grad = opts.backgroundGradient[i];
                    if(grad.length === 2)
                    {
                        opts.backgroundColor.addColorStop(grad[0], grad[1]);
                    }
                    else
                    {
                        opts.backgroundColor.addColorStop(i / (length-1), grad);
                    }
                }
            }

            // draw bg color
            ctx.fillStyle = opts.backgroundColor;
            roundedRect(ctx, textboxLeft, textboxTop, textboxWidth, textboxHeight, borderRadius);
            ctx.fill();
        }
        else
        {
            // draw bgimage
            ctx.drawImage(opts.bgImage, 0, 0, opts.bgImage.width, opts.bgImage.height, textboxLeft, textboxTop, textboxWidth, textboxHeight);
        }

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // draw inner shadow
        var innerShadow = opts.innerShadow;
        if (innerShadow.blur > 0)
        {
            shadowCanvas.width = opts.width + opts.padding * 2;
            shadowCanvas.height = opts.height + opts.padding * 2;

            shadowContext.shadowBlur = innerShadow.blur;
            shadowContext.shadowColor = innerShadow.color;

            // top shadow
            shadowContext.shadowOffsetX = 0;
            shadowContext.shadowOffsetY = innerShadow.y;
            shadowContext.fillRect(-1 * width, -100, 3 * width, 100);

            // right shadow
            shadowContext.shadowOffsetX = innerShadow.x;
            shadowContext.shadowOffsetY = 0;
            shadowContext.fillRect(shadowCanvas.width, -1 * height, 100, 3 * height);

            // bottom shadow
            shadowContext.shadowOffsetX = 0;
            shadowContext.shadowOffsetY = innerShadow.y;
            shadowContext.fillRect(-1 * width, shadowCanvas.height, 3 * width, 100);

            // left shadow
            shadowContext.shadowOffsetX = innerShadow.x;
            shadowContext.shadowOffsetY = 0;
            shadowContext.fillRect(-100, -1 * height, 100, 3 * height);

            // create a clipping mask on the main canvas
            roundedRect(
                ctx, 
                borderWidth + shadowLeft, borderWidth + shadowTop, 
                width - borderWidth * 2 - shadowWidth, 
                height - borderWidth * 2 - shadowHeight, 
                borderRadius
            );
            ctx.clip();

            // draw the inner-shadow from the off-DOM canvas
            ctx.drawImage(
                shadowCanvas, 
                0, 0, 
                shadowCanvas.width, shadowCanvas.height, 
                borderWidth + shadowLeft, borderWidth + shadowTop, 
                shadowCanvas.width, shadowCanvas.height
            );
        }
    };

    // the core class for inputs .. TODO: implement tab index
    PIXI.InputObject = function(index)
    {
        this.tabIndex = index !== undefined ? index : PIXI.InputObject.tabIndex++;

        PIXI.Sprite.call(this, PIXI.Texture.fromCanvas(this.canvas));
        PIXI.InputObject.inputs.push(this);

        // make sure we have a resolution property
        this.resolution = 1;

        // avoid html in cocoon
        if(!isCocoonJS)
        {

            // create hidden input
            if(!PIXI.InputObject.hiddenInput)
            {
                var input = document.createElement('input');
                input.type = "text";
                input.tabindex = -1;
                input.style.position = "fixed";
                input.style.opacity = 0;
                input.style.pointerEvents = "none";
                input.style.left = '0px';
                input.style.bottom = '0px';
                input.style.left = "-100px";
                input.style.top = "-100px";
                input.style.zIndex = 10;

                // add blur handler
                input.addEventListener("blur", function() 
                {
                    if(PIXI.InputObject.currentInput) 
                    {
                        PIXI.InputObject.currentInput.onMouseUpOutside();
                    }
                }, false);

                // on key down
                input.addEventListener('keydown', function(e) 
                {
                    if(PIXI.InputObject.currentInput) 
                    {
                        e = e || window.event;
                        if (PIXI.InputObject.currentInput.data.hasFocus) 
                        {
                            PIXI.InputObject.currentInput.onKeyDown(e);
                        }
                    }
                });

                // on key up
                input.addEventListener('keyup', function(e) 
                {
                    if(PIXI.InputObject.currentInput) 
                    {
                        e = e || window.event;
                        if (PIXI.InputObject.currentInput.data.hasFocus) 
                        {
                            PIXI.InputObject.currentInput.onKeyUp(e);
                        }
                    }
                });

                document.body.appendChild(input);
                PIXI.InputObject.textProp = getTextProp(input);

                PIXI.InputObject.hiddenInput = input;
            }

            // set reference
            this.hiddenInput = PIXI.InputObject.hiddenInput;
        }

        this._textNeedsUpdate = true;
        this.data.dirty = true;
        this.update();
    };

    PIXI.InputObject.prototype = Object.create(PIXI.Sprite.prototype);
    PIXI.InputObject.prototype.constructor = PIXI.InputObject;

    // extend prototype
    extend(PIXI.InputObject.prototype, {

        updateData: function(obj) 
        {
            // check if the text style changed
            if(obj.hasOwnProperty("text")) 
            {
                this._textStyleNeedsUpdate = true;
            }

            this.data = extend(obj, this.data);
            this.data.dirty = true;

            // check if the text needs to be updated
            if(obj.hasOwnProperty("value") || this._textStyleNeedsUpdate) 
            {
                this._textNeedsUpdate = true;
            }
        },

        focus: function() 
        {

            // is already current input
            if(PIXI.InputObject.currentInput === this) 
            {
                return;
            }

            // drop focus
            if(PIXI.InputObject.currentInput) 
            {
                PIXI.InputObject.currentInput.blur();
            }

            // set focus
            PIXI.InputObject.currentInput = this;
            this.data.hasFocus = true;

            // check custom focus event
            this.data.onfocus();

            // is read only
            if(this.data.readonly) 
            {
                return;
            }

            // focus hidden input
            //window.focus();
            this.hiddenInput.focus();
        },

        blur: function() 
        {
            if(PIXI.InputObject.currentInput === this) 
            {
                PIXI.InputObject.currentInput = null;
                this.data.hasFocus = false;

                // blur hidden input
                this.hiddenInput.blur();
                this.data.onblur();
            }
        },

        onKeyUp: function()
        {                
        },

        onKeyDown: function()
        {
        },

        onClick: function()
        {
        },

        onMouseMove: function()
        {                
        },

        onMouseDown: function()
        {
        },

        onMouseUp: function()
        {
        },

        onMouseUpOutside: function(e)
        {
            if(this.data.hasFocus && !this.data.mouseDown)
            {
                this.blur();
            }
            this.data.mouseDown = false;
        },

        updateTexture: function()
        {
            this.texture.baseTexture.width = this.canvas.width;
            this.texture.baseTexture.height = this.canvas.height;
            this.texture.crop.width = this.texture.frame.width = this.canvas.width;
            this.texture.crop.height = this.texture.frame.height = this.canvas.height;

            this._width = this.canvas.width;
            this._height = this.canvas.height;

            if(isOldPIXI) 
            {
                this.requiresUpdate =  true;
            } 
            else 
            {
                this.texture.baseTexture.dirty();
            }
        },

        _renderWebGL: function(renderSession) 
        {
            if(isOldPIXI)
            {
                if(this.requiresUpdate)
                {
                    this.requiresUpdate = false;
                    PIXI.updateWebGLTexture(this.texture.baseTexture, renderSession.gl);
                }
            }
            else
            {
                this.resolution = renderSession.resolution;
                this.texture.baseTexture.resolution = this.resolution;
            }
            PIXI.Sprite.prototype._renderWebGL.call(this, renderSession);
        },

        destroy: function()
        {
            this.interactive = false;
            this.context = null;
            this.canvas = null;
            this.texture.destroy(true);
            PIXI.InputObject.inputs.splice(PIXI.InputObject.inputs.indexOf(this), 1);
        }

    }, true);

    // define width
    Object.defineProperty(PIXI.InputObject.prototype, 'width', {
        get: function() 
        {
            this.update();
            return this.scale.x * this.texture.frame.width;
        },
        set: function(value) 
        {
            this.scale.x = value / this.texture.frame.width;
            this._width = value;
        }
    });

    // define height
    Object.defineProperty(PIXI.InputObject.prototype, 'height', {
        get: function()
        {
            this.update();
            return  this.scale.y * this.texture.frame.height;
        },
        set: function(value)
        {
            this.scale.y = value / this.texture.frame.height;
            this._height = value;
        }
    });

    // constants
    PIXI.InputObject.tabIndex = 0;
    PIXI.InputObject.currentCanvas = null;
    PIXI.InputObject.currentInput = null;
    PIXI.InputObject.hiddenInput = null;
    PIXI.InputObject.inputs = [];
    PIXI.InputObject.Styles = {};
    PIXI.InputObject.TextCache = {};
    PIXI.InputObject.textProp = 'value';

    // tabbing between inputs
    PIXI.InputObject.Tab = function( e, keyCode, scope )
    {
        e.preventDefault();
        if (PIXI.InputObject.inputs.length > 1)
        {
            var next = PIXI.InputObject.inputs.indexOf(scope);
            while(true)
            {
                if(++next >= PIXI.InputObject.inputs.length)
                {
                    next = 0;
                }
                if(PIXI.InputObject.inputs[next] === scope)
                {
                    break;
                } 
                else if(PIXI.InputObject.inputs[next].tabIndex !== -1)
                {
                    scope.blur();

                    // maybe avoid the timeout?
                    setTimeout(function() { 
                        PIXI.InputObject.inputs[next].focus(); 
                    }, 10);
                    break;
                }
            }
        }
    };

    // used to define a reusable style
    PIXI.InputObject.Style = function(key, opts, destroy)
    {
        if(opts === undefined)
        {
            return PIXI.InputObject.Styles[key] || {};
        }
        PIXI.InputObject.Styles[key] = opts;
        if(destroy)
        {
            delete PIXI.InputObject.Styles[key];
        }
    };

    // blur current input
    PIXI.InputObject.blur = function()
    {
        if(PIXI.InputObject.currentInput && !PIXI.InputObject.currentInput.data.mouseDown)
        {
            PIXI.InputObject.currentInput.blur();
            PIXI.InputObject.currentInput = null;
        }
    };
    window.addEventListener("blur", PIXI.InputObject.blur, false);

    // used to force blur when the user clicked anywhere on the canvas
    PIXI.InputObject.setCanvas = function(canvas)
    {
        // experimental, avoid in mobile for now
        if(!isMobile)
        {
            if(PIXI.InputObject.currentCanvas !== canvas)
            {
                if(PIXI.InputObject.currentCanvas)
                {
                    PIXI.InputObject.currentCanvas.removeEventListener("mousedown", PIXI.InputObject.blur, true);
                    PIXI.InputObject.currentCanvas.removeEventListener("touchstart", PIXI.InputObject.blur, true);
                }
                if(canvas)
                {
                    canvas.addEventListener("mousedown", PIXI.InputObject.blur, true);
                    canvas.addEventListener("touchstart", PIXI.InputObject.blur, true);
                }
                PIXI.InputObject.currentCanvas = canvas;
            }
        }
    };

    // used to save some time while calculating text width
    PIXI.InputObject.getTextCache = function( sprite, remove )
    {
        var oldID = sprite.textCache ? sprite.textCache.__id : null;
        var id = sprite.data.text.font + "_" + sprite.data.text.strokeThickness;
        if(oldID)
        {
            --PIXI.InputObject.TextCache[oldID].count;
            if(remove)
            {
                if(PIXI.InputObject.TextCache[oldID].count <= 0)
                {
                    PIXI.InputObject.TextCache[oldID] = null; // delete?
                }
                return;
            }
        }
        if(!PIXI.InputObject.TextCache[id])
        {
            PIXI.InputObject.TextCache[id] = { count: 0, __id: id };
        }
        PIXI.InputObject.TextCache[id].count++;
        return PIXI.InputObject.TextCache[id];
    };

    // pixi input field
    PIXI.Input = function( data )
    {
        this.data = data || {};

        if(this.data.style)
        {
            this.data = extend(this.data, PIXI.InputObject.Style(this.data.style));
        }

        this.data = extend(this.data, inputDefaults);
        this.data = extend(this.data, styleDefaults);
        this.data.selection = [0, 0];
        this.data.clipPos = [0, 0];
        this.data.cursorPos = 0;
        this.cursorTimer = 0;

        // set value
        this.data.value = (this.data.value || this.data.placeholder || "") + "";
        this.currText = this.data.value;

        // text sprite
        if(!this.data.text.bitmap)
        {
            this.text = new PIXI.Text( this.data.value, this.data.text );
            this.textCache = PIXI.InputObject.getTextCache(this);
        }
        else
        {
            this.text = new PIXI.BitmapText( this.data.value || "Temp", this.data.text );
            this.text._isBitmapFont = true;
            this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
            this.text._scale = this.text.fontSize / this.text._data.size;
            this.text._lineHeight = this.text._data.lineHeight * this.text._scale;

            // ugly but we need to define some text to get the correct line height
            if(!this.data.value)
            {
                this._textNeedsUpdate = true;
            }
        }

        // caret/selection sprites
        this.cursor = new PIXI.Text("|", this.data.text );
        this.cursor.visible = false;
        this.selection = new PIXI.Sprite( getSelectionTexture( this.data.selectionColor ) );

        // get height
        this.data.height = this.data.height || getFontHeight(this.text);

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.canvas.width = this.data.width;
        this.canvas.height = this.data.height;

        PIXI.InputObject.call(this);

        this.addChild(this.selection);
        this.addChild(this.text);
        this.addChild(this.cursor);
        
        // set up events
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnMouseUpOutside = this.onMouseUpOutside.bind(this);
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);

        this.interactive = true;
        this.defaultCursor = "text";
        this.buttonMode = true;
        this.mousemove = this.touchmove = this.boundOnMouseMove;
        this.mousedown = this.touchstart = this.boundOnMouseDown;
        this.mouseup = this.touchend = this.boundOnMouseUp;
        this.mouseupoutside = this.touchendoutside = this.boundOnMouseUpOutside;
    };

    PIXI.Input.prototype = Object.create(PIXI.InputObject.prototype);
    PIXI.Input.prototype.constructor = PIXI.Input;

    // extend prototype
    extend(PIXI.Input.prototype, {

        focus: function()
        {
            PIXI.InputObject.prototype.focus.call(this);

            if (this.data.readonly)
            {
                return;
            }

            // avoid html in cocoon
            if(isCocoonJS)
            {
                this.value = prompt(this.data.placeholder || "Enter Text", this.value) || this.value;
                this._textNeedsUpdate = true;
                return;
            }
          
            // set type
            this.hiddenInput.type = this.data.type || "text";
            
            // check max length
            if (this.data.maxlength)
            {
                this.hiddenInput.maxLength = this.data.maxlength;
            }
            else
            {
              this.hiddenInput.removeAttribute("maxLength");
            }

            // check number type
            if(this.data.type === "number")
            {
                if(this.data.min !== undefined)
                {
                  this.hiddenInput.min = this.data.min;
                }
                if(this.data.max !== undefined)
                {
                  this.hiddenInput.max = this.data.max;
                }
            }
            else
            {
              this.hiddenInput.removeAttribute("min");
              this.hiddenInput.removeAttribute("max");
            }


            this.currText = this.value;
            this.data.value = this.currText;
            setText(this.hiddenInput, PIXI.InputObject.textProp, this.currText);
            this._textNeedsUpdate = true;
        },

        blur: function(scope)
        {
            scope = scope || this;
            PIXI.InputObject.prototype.blur.call(scope);

            // fill the place holder
            if (scope.data.value === '')
            {
                scope.data.value = scope.data.placeholder;
            }

            // clear selection
            scope.clearSelection();

            this.cursor.visible = false;
            scope._textNeedsUpdate = true;
        },

        onKeyDown: function(e)
        {
            this.data.selectionStart = -1;

            var keyCode = e.which,
                isShift = e.shiftKey,
                key = null,
                startText, endText;

            // ESC
            if(e.which === 27)
            {
                this.blur();
                return;
            }

            this._textNeedsUpdate = true;
            this._selectionNeedsUpdate = true;

            // fire custom user event
            this.data.onkeydown(e, this);

            // add support for Ctrl/Cmd+A selection
            if (keyCode === 65 && (e.ctrlKey || e.metaKey))
            {
                e.preventDefault();
                this.data.selection[0] = 0;
                this.data.selection[1] = this.value.length;
                this.hiddenInput.selectionStart = 0;
                this.hiddenInput.selectionEnd = this.value.length;
                return;
            }

            // block keys that shouldn't be processed
            if (keyCode === 17 || e.metaKey || e.ctrlKey)
            {
                return;
            }

            // enter key
            if (keyCode === 13)
            {
                e.preventDefault();
                this.data.onsubmit(e, this);
            }
            // tab key
            else if (keyCode === 9)
            {
                PIXI.InputObject.Tab(e, keyCode, this);
                return;
            }

            // update the canvas input state information from the hidden input
            this.updateTextState();
        },

        onKeyUp: function(e)
        {

            // fire custom user event
            this.data.onkeyup(e, this);

            // update the canvas input state information from the hidden input
            this.updateTextState();
        },

        updateTextState: function()
        {
            var text = getText(this.hiddenInput, PIXI.InputObject.textProp);

            if(text !== this.data.value)
            {
                this.data.value = text;
                this._textNeedsUpdate = true;
            }
            
            if(this.data.selection[0] !== this.hiddenInput.selectionStart || this.data.selection[1] !== this.hiddenInput.selectionEnd)
            {
                this.data.selection[0] = this.hiddenInput.selectionStart;
                this.data.selection[1] = this.hiddenInput.selectionEnd;
                this.data.cursorPos = this.data.selection[0];
                this._textNeedsUpdate = true;
                this._selectionNeedsUpdate = true;
                this._cursorNeedsUpdate = true;
            }
        },

        onMouseMove: function(e)
        {

            // check primary condition
            if(!this.data.hasFocus || !this.data.mouseDown || this.data.selectionStart < 0 || !this.stage.interactionManager.hitTest(this, e)) 
            {
                return;
            }

            var mouse = this.mousePos(e);
            var curPos = this.clickPos(mouse.x, mouse.y),
                start = Math.min(this.data.selectionStart, curPos),
                end = Math.max(this.data.selectionStart, curPos);

            if (this.data.selection[0] !== start || this.data.selection[1] !== end)
            {
                this.data.selection[0] = start;
                this.data.selection[1] = end;

                if(!isCocoonJS)
                {
                    this.hiddenInput.selectionStart = start;
                    this.hiddenInput.selectionEnd = end;
                }

                this.data.cursorPos = curPos;
                this._textNeedsUpdate = true;
                this._selectionNeedsUpdate = true;
                this._cursorNeedsUpdate = true;
            }
        },

        onMouseDown: function(e)
        {

            if(e.originalEvent.which === 2 || e.originalEvent.which === 3)
            {
                e.originalEvent.preventDefault();
                return;
            }

            // focus input
            this.focus();

            var mouse = this.mousePos(e);
            this.data.mouseDown = true;

            // remove placeholder
            if(this.data.value === this.data.placeholder)
            {
                this._textNeedsUpdate = true;
            }

            // start the selection drag if inside the input
            this.data.selectionStart = this.clickPos(mouse.x, mouse.y);
            this.data.selection[0] = this.data.selectionStart;
            this.data.selection[1] = this.data.selectionStart;

            if(!isCocoonJS)
            {
                this.hiddenInput.selectionStart = this.data.selectionStart;
                this.hiddenInput.selectionEnd = this.data.selectionStart;
            }

            this.data.cursorPos = this.data.selectionStart;
            this._cursorNeedsUpdate = true;
            this._selectionNeedsUpdate = true;
        },

        onMouseUp: function(e)
        {
            if(e.originalEvent.which === 2 || e.originalEvent.which === 3)
            {
                e.originalEvent.preventDefault();
                return;
            }

            var mouse = this.mousePos(e);

            // update selection if a drag has happened
            var clickPos = this.clickPos(mouse.x, mouse.y);

            // update the cursor position
            if(!(this.data.selectionStart >= 0 && clickPos !== this.data.selectionStart))
            {
                this.data.cursorPos = clickPos;
                this.data.selection[0] = this.data.cursorPos;
                this.data.selection[1] = this.data.cursorPos;

                if(!isCocoonJS)
                {
                    this.hiddenInput.selectionStart = this.data.cursorPos;
                    this.hiddenInput.selectionEnd = this.data.cursorPos;
                }

                this._cursorNeedsUpdate = true;
            }

            this.data.selectionStart = -1;
            this.data.mouseDown = false;
        },

        update: function(force)
        {
            if(force || this.data.dirty || this._textNeedsUpdate || this._textStyleNeedsUpdate || this._selectionNeedsUpdate)
            {

                if(this.data.dirty)
                {
                    this.renderTexture();
                    this.data.dirty = false;
                }
                
                if(this._textStyleNeedsUpdate)
                {
                    this.text.setStyle(this.data.text);
                    this.cursor.setStyle(this.data.text);
                    this.cursor.updateText();

                    if(!this.text._isBitmapFont)
                    {
                        this.textCache = PIXI.InputObject.getTextCache(this);
                    }
                    else
                    {
                        this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
                        this.text._scale = this.text.fontSize / this.text._data.size;
                        this.text._lineHeight = this.text._data.lineHeight * this.text._scale;
                    }

                    this._textStyleNeedsUpdate = false;
                }

                if(this._textNeedsUpdate)
                {
                    this.currText = this.clipText();
                    this.text.setText(this.currText || "");
                    this.text.updateText();
                    this._textNeedsUpdate = false;
                }

                if(this._selectionNeedsUpdate)
                {
                    this.updateSelection();
                    this._selectionNeedsUpdate = false;
                }
            }
        },

        updateSelection: function()
        {
            if (this.data.selection[0] !== this.data.selection[1])
            {
                this.selection.visible = true;
                this.selection.x = (this.selection.y + this.textWidth(this.currText.substring(0, this.data.selection[0] - this.data.clipPos[0]))) | 0;
                this.selection.width = Math.ceil(this.textWidth(this.currText.substring(this.data.selection[0] - this.data.clipPos[0], this.data.selection[1] - this.data.clipPos[0]))) + this.text.style.strokeThickness;
            }
            else
            {
                this.selection.visible = false;
            }
        },

        renderTexture: function()
        {

            PIXI.ButtonFactory( this.canvas, this.context, this.data );

            // vertically align the text
            if(this.data.valign === "none" || !this.data.valign)
            {
                this.text.y = this.data.padding | 0;
            }
            else if(this.data.valign === "middle") 
            {
                this.text.y = (this.data.textboxTop + ((this.data.textboxHeight - this.text.height)/2)) | 0;
            }
            else if(this.data.valign === "top")
            {
                this.text.y = this.data.textboxTop | 0;
            }
            else if(this.data.valign === "bottom")
            {
                this.text.y = (this.data.textboxTop + this.data.textboxHeight - this.text.height) | 0;
            }
            this.cursor.y = this.text.y;

            // horizontal align
            this.data.placeholderAlign = this.data.placeholderAlign || this.data.align;
            /*if(this.data.value === this.data.placeholder) {
                this.text.x = this.data.textboxLeft + ((this.data.textboxWidth - this.text.width) / 2) | 0;
            } else {
              */  // add padding (only to the sides)
                this.text.x = (this.data.textboxLeft + this.data.padding) | 0;
            //}

            // position selection
            var paddingBorder = (this.data.padding + this.data.borderWidth + this.data.shadowTop) | 0;
            this.selection.y = paddingBorder;
            this.selection.height = this.data.height;

            this._cursorNeedsUpdate = true;
            this._selectionNeedsUpdate = true;
            this.updateTexture();
        },

        clipText: function(value)
        {
            var full = value === undefined,
                start = 0;

            // get value
            value = full ? (this.data.mouseDown || this.data.hasFocus ? this.value : (this.data.value || this.data.placeholder || "")) : value;

            if(this.data.type === "password" && value !== this.data.placeholder)
            {
                value = value.replace(/./g, '*');
            }

            var textWidth = this.textWidth(value),
                textLength = value.length,
                width = (this.data.width - 2*this.data.padding),
                oValue = value;

            if(full && value !== this.data.placeholder)
            {

                this.data.cursorPos = this.data.cursorPos || 0;

                if(textLength < this.data.clipPos[0])
                {
                    this.data.clipPos[0] = 0;
                }

                // cursor outside of view -> right
                if(this.data.cursorPos > this.data.clipPos[1])
                {
                    start = this.data.clipPos[0];
                    value = value.substr(start, this.data.cursorPos - this.data.clipPos[0]) || "";  
                } 

                // cursor outside of view <- left
                else if(this.data.cursorPos < this.data.clipPos[0])
                {
                    start = this.data.cursorPos;
                    value = value.substr(start) || "";                 
                } 

                // cursor inside of the view
                else
                {
                    start = this.data.clipPos[0];
                    value = value.substr(start/*, this.data.clipPos[1]*/);
                }

                if(value !== oValue)
                {
                    textWidth = this.textWidth(value),
                    textLength = value.length;
                }
            }

            if(textWidth > width)
            {
                if(!this.text._isBitmapFont)
                {
                    var cache = this.textCache, 
                        character = "";

                    while(textWidth > width)
                    {
                        if(full && this.data.cursorPos > this.data.clipPos[1])
                        {
                            character = value[0];
                            cache[character] = cache[character] || this.textWidth(character)
                            textWidth -= cache[character];
                            value = value.substr(1, --textLength);
                            start++;
                        }
                        else
                        {
                            character = value[--textLength];
                            cache[character] = cache[character] || this.textWidth(character);
                            textWidth -= cache[character];
                            value = value.substr(0, textLength);
                        }
                    }
                }
                else
                {
                    while(textWidth > width)
                    {
                        if(full && this.data.cursorPos > this.data.clipPos[1])
                        {
                            textWidth -= this.textWidth(value[0]);
                            value = value.substr(1, --textLength);
                            start++;
                        }
                        else
                        {
                            textWidth -= this.textWidth(value[--textLength]);
                            value = value.substr(0, textLength);
                        }
                    }
                }
            }

            if(full && value !== this.data.placeholder)
            {
                this.data.clipPos[0] = start;
                this.data.clipPos[1] = start + textLength;
            }

            return value + '';
        },

        clickPos: function(x, y)
        {

            // determine where the click was made along the string
            var text = this.currText,
                totalWidth = 0,
                pos = text.length;

            if (x < this.textWidth(text))
            {
                // loop through each character to identify the position
                for (var i=0; i<text.length; i++)
                {
                    totalWidth += this.textWidth(text[i]);
                    if (totalWidth >= x)
                    {
                        pos = i;
                        break;
                    }
                }
            }

            return this.data.clipPos[0] + pos;
        },

        textWidth: function(text)
        {
            if(!this.text._isBitmapFont)
            {
                var ctx = this.context;
                ctx.font = this.text.style.font;
                ctx.textAlign = 'left';
                return ctx.measureText(text || "").width;
            }
            else
            {
                var prevCharCode = null;
                var width = 0;
                var data = this.text._data;
                for(var i = 0; i < text.length; i++)
                {
                    var charCode = text.charCodeAt(i);
                    var charData = data.chars[charCode];

                    if(!charData) continue;

                    if(prevCharCode && charData.kerning[prevCharCode])
                    {
                        width += charData.kerning[prevCharCode];
                    }

                    width += charData.xAdvance;

                    prevCharCode = charCode;
                }

                return width * this.text._scale;
            }
        },

        mousePos: function(e)
        {
            return e.getLocalPosition(e.target || this);
        },

        clearSelection: function()
        {
            if (this.data.selection[1] !== this.data.selection[0])
            {
                this.data.cursorPos = 0;
                this.data.selection[0] = 0;
                this.data.selection[1] = 0;
                
                if(!isCocoonJS)
                {
                    this.hiddenInput.selectionStart = 0;
                    this.hiddenInput.selectionEnd = 0;
                }

                this._cursorNeedsUpdate = true;
                this._selectionNeedsUpdate = true;
            }
        },

        updateTransform: function()
        {
            this.update();
            if(this.data.hasFocus || this.data.mouseDown)
            {
                var time = Date.now();

                // blink interval for cursor
                if((time-this.cursorTimer) >= blinkInterval)
                {
                    this.cursorTimer = time;
                    this.cursor.visible = !this.cursor.visible;
                }

                // hide cursor when selection is visible
                if(this.selection.visible)
                {
                  this.cursor.visible = false;
                }

                // update cursor position
                if(this.cursor.visible && this._cursorNeedsUpdate)
                {
                    this.cursor.x = (this.selection.y - 1 + this.textWidth(this.currText.substring(0, this.data.cursorPos - this.data.clipPos[0]))) | 0;
                    this._cursorNeedsUpdate = false;
                }
            }
            else
            {
                this.selection.visible = false;
                this.cursor.visible = false;
            }
            PIXI.Sprite.prototype.updateTransform.call(this);
        },

        destroy: function()
        {
            if(!this.text._isBitmapFont)
            {
                PIXI.InputObject.getTextCache(this, true);
                this.text.destroy(true);
            }
            else
            {
                this.text = null;
            }
            this.cursor.destroy(true);
            PIXI.InputObject.prototype.destroy.call(this);
        }

    }, true);

    Object.defineProperty(PIXI.Input.prototype, 'value', {
        get: function()
        {
            return this.data.value === this.data.placeholder ? "" : this.data.value;
        },
        set: function(value)
        {
            this.data.value = value + '';
            setText(this.hiddenInput, PIXI.InputObject.textProp, value + '');
            this._textNeedsUpdate = true;
        }
    });


    // pixi button field
    PIXI.Button = function( data )
    {

        this.tabIndex = -1; // disable tabbing

        this.data = data || {};

        if(this.data.style)
        {
            this.data = extend(this.data, PIXI.InputObject.Style(this.data.style));
        }

        this.data = extend(this.data, inputDefaults);
        this.data = extend(this.data, styleDefaults);

        // text sprite
        if(!this.data.text.bitmap)
        {
            this.text = new PIXI.Text( this.data.value, this.data.text );
        }
        else
        {
            this.text = new PIXI.BitmapText( this.data.value || "Temp", this.data.text );
            this.text._isBitmapFont = true;
            this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
            this.text._scale = this.text.fontSize / this.text._data.size;
            this.text._lineHeight = this.text._data.lineHeight * this.text._scale;

            // ugly but we need to define some text to get the correct line height
            if(!this.data.value)
            {
                this._textNeedsUpdate = true;
            }
        }

        // get height
        this.data.height = this.data.height || getFontHeight(this.text);

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.canvas.width = this.data.width;
        this.canvas.height = this.data.height;

        PIXI.InputObject.call(this, -1);

        this.addChild(this.text);
        
        // set up events
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnMouseUpOutside = this.onMouseUpOutside.bind(this);
        this.boundOnMouseDown = this.onMouseDown.bind(this);

        this.interactive = true;
        this.buttonMode = true;
        this.mousedown = this.touchstart = this.boundOnMouseDown;
        this.mouseup = this.touchend = this.boundOnMouseUp;
        this.mouseupoutside = this.touchendoutside = this.boundOnMouseUpOutside;
    };

    PIXI.Button.prototype = Object.create(PIXI.InputObject.prototype);
    PIXI.Button.prototype.constructor = PIXI.Button;

    // extend prototype
    extend(PIXI.Button.prototype, {

        focus: function()
        {
            PIXI.InputObject.prototype.focus.call(this);
        },

        blur: function(scope)
        {
            PIXI.InputObject.prototype.blur.call(scope || this);
        },

        onMouseDown: function(e)
        {
            this.focus();
            this.data.mouseDown = true;
            this.data.onmousedown(e, this);
        },

        onMouseUp: function(e)
        {
            this.data.onmouseup(e, this);
            this.data.mouseDown = false;
        },

        update: function(force)
        {
            if(force || this.data.dirty || this._textNeedsUpdate || this._textStyleNeedsUpdate)
            {

                if(this.data.dirty)
                {
                    this.renderTexture();
                    this.data.dirty = false;
                }
                
                if(this._textStyleNeedsUpdate)
                {
                    this.text.setStyle(this.data.text);

                    if(this.text._isBitmapFont)
                    {
                        this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
                        this.text._scale = this.text.fontSize / this.text._data.size;
                        this.text._lineHeight = this.text._data.lineHeight * this.text._scale;
                    }

                    this._textStyleNeedsUpdate = false;
                }

                if(this._textNeedsUpdate)
                {
                    this.text.setText(this.data.value || "");
                    this.text.updateText();
                    if(this.data.align === "center")
                    {
                        this.text.x = ((this.data.outerWidth - this.text.width) / 2) | 0;
                    }
                    else if(this.data.align === "right")
                    {
                        this.text.x = (this.data.outerWidth - this.text.width - this.data.textboxLeft - this.data.padding) | 0;
                    }
                    this._textNeedsUpdate = false;
                }
            }
        },

        renderTexture: function()
        {

            PIXI.ButtonFactory( this.canvas, this.context, this.data );

            // vertically align the text
            if(this.data.valign === "none" || !this.data.valign)
            {
                this.text.y = this.data.padding | 0;
            }
            else if(this.data.valign === "middle")
            {
                this.text.y = (this.data.textboxTop + ((this.data.textboxHeight - this.text.height)/2)) | 0;
            }
            else if(this.data.valign === "top")
            {
                this.text.y = this.data.textboxTop | 0;
            }
            else if(this.data.valign === "bottom")
            {
                this.text.y = (this.data.textboxTop + this.data.textboxHeight - this.text.height) | 0;
            }

            this.text.x = (this.data.textboxLeft + this.data.padding) | 0;

            this.updateTexture();
        },

        updateTransform: function()
        {
            this.update();
            PIXI.Sprite.prototype.updateTransform.call(this);
        },

        destroy: function()
        {
            if(this.text._isBitmapFont)
            {
                this.text.destroy(true);
            }
            else
            {
                this.text = null;
            }
            PIXI.InputObject.prototype.destroy.call(this);
        }

    }, true);

    Object.defineProperty(PIXI.Button.prototype, 'value', {
        get: function()
        {
            return this.data.value;
        },
        set: function(value)
        {
            this.data.value = value + '';
            this._textNeedsUpdate = true;
        }
    });

    // pixi select input
    PIXI.Select = function( data )
    {

        this.data = data || {};

        if(this.data.style)
        {
            this.data = extend(this.data, PIXI.InputObject.Style(this.data.style));
        }

        this.data = extend(this.data, inputDefaults);
        this.data = extend(this.data, styleDefaults);

        this.data.options = this.data.options || {};
        this.data.selected = this.data.selected || null;
        this.selectedIndex = 0;
        this.lineHeight = 20;
        this.options = [];

        // text sprite
        if(!this.data.text.bitmap)
        {
            this.text = new PIXI.Text( "", this.data.text );
        }
        else
        {
            this.text = new PIXI.BitmapText( "Temp", this.data.text );
            this.text._isBitmapFont = true;
            this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
            this.text._scale = this.text.fontSize / this.text._data.size;
            this.text._lineHeight = this.text._data.lineHeight * this.text._scale;
        }

        // sprites
        this.selection = new PIXI.Sprite( getSelectionTexture( this.data.selectionColor ) );
        this.selection.visible = false;
        this.menu = new PIXI.Sprite( getSelectionTexture( this.data.backgroundColor ) );
        this.menu.visible = false;

        // get height
        this.data.height = this.data.height || getFontHeight(this.text);

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.canvas.width = this.data.width;
        this.canvas.height = this.data.height;

        PIXI.InputObject.call(this);

        this.addChild(this.text);
        this.addChild(this.menu);
        this.addChild(this.selection);
        
        // set up events
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnMouseUpOutside = this.onMouseUpOutside.bind(this);
        this.boundOnMouseDown = this.onMouseDown.bind(this);

        this.interactive = true;
        this.mousedown = this.touchstart = this.boundOnMouseDown;
        this.mouseup = this.touchend = this.boundOnMouseUp;
        this.mouseupoutside = this.touchendoutside = this.boundOnMouseUpOutside;

        // add options
        var text = "";
        for(var index in this.data.options)
        { 
            if(this.data.selected === index)
            {
                this.selectedIndex = this.options.length;
            }
            this.options.push({
                value: index,
                text: this.data.options[index]
            });
            text += this.data.options[index] + "\n";
        }

        // options text sprite
        if(!this.data.optionText || !this.data.optionText.bitmap)
        {
            this.optionstext = new PIXI.Text( text, this.data.optionText || { font: "14px arial" } );
            this.lineHeight = (this.optionstext.height / (this.options.length+1) - this.optionstext.style.strokeThickness / 2) | 0;
        }
        else
        {
            this.optionstext = new PIXI.BitmapText( text, this.data.optionText );
            this.optionstext._isBitmapFont = true;
            this.optionstext._data = PIXI.BitmapText.fonts[this.optionstext.fontName];
            this.optionstext._scale = this.optionstext.fontSize / this.optionstext._data.size;
            this.optionstext._lineHeight = this.optionstext._data.lineHeight * this.optionstext._scale;
            this.lineHeight = this.optionstext._lineHeight;
        }
        this.optionstext.visible = false;
        this.addChild(this.optionstext);

        // set height
        this.menu.height = this.lineHeight * this.options.length - 1;

        // interactive menu
        this.menu.interactive = true;

        this.menu.mousedown = this.menu.touchstart = function(e)
        {
            if(e.originalEvent.which === 2 || e.originalEvent.which === 3)
            {
                e.originalEvent.preventDefault();
                this.displayMenu(false);
                return;
            }
            this.selectedIndex = this.getIndexByLocalPosition(e);
            this.updateText();
        }.bind(this);

        this.menu.mousemove = this.menu.touchmove = function(e)
        {
            if(this.menu.stage && this.menu.stage.interactionManager.hitTest(this.menu, e))
            {
                this.menu.selectedIndex = this.getIndexByLocalPosition(e);
                this.updateSelection(this.menu.selectedIndex);
            }
        }.bind(this);

        this.updateText();
    };

    PIXI.Select.prototype = Object.create(PIXI.InputObject.prototype);
    PIXI.Select.prototype.constructor = PIXI.Select;

    // extend prototype
    extend(PIXI.Select.prototype, {

        getIndexByLocalPosition: function (e)
        {
            var y = e.getLocalPosition(this).y - this.menu.startY;
            if(y<1 || y > this.menu.height)
            {
                return;
            }
            var index = Math.floor(y/(this.lineHeight+1));
            if(index<0)
            {
                index = 0;
            }
            else if(index>=this.options.length)
            {
                index = this.options.length - 1;
            }
            return index;
        },

        updateText: function()
        {
            var data = this.value;
            if(data)
            {
                if(this.data.value !== data.text)
                {
                    this.data.value = data.text;
                }
                this._textNeedsUpdate = true;
                this.updateSelection();
            }
            else
            {
                this.data.value = "";
            }
        },

        updateSelection: function(index) 
        {
            this.selection.y = this.menu.startY + this.lineHeight * (index !== undefined ? index : this.selectedIndex);
        },

        focus: function()
        {
            PIXI.InputObject.prototype.focus.call(this);
        },

        blur: function(scope)
        {
            scope = scope || this;
            PIXI.InputObject.prototype.blur.call(scope);
            scope.displayMenu(false);
        },

        onKeyDown: function(e)
        {
            var keyCode = e.which,
                isShift = e.shiftKey,
                key = null,
                startText, endText;

            // ESC
            if(e.which === 27)
            {
                this.blur();
                return;
            }

            this._textNeedsUpdate = true;
            this._selectionNeedsUpdate = true;

            // fire custom user event
            this.data.onkeydown(e, this);

            // spacebar or enter
            if (keyCode === 32 || keyCode === 13)
            {
                e.preventDefault();
                if(this.menu.visible)
                {
                    this.displayMenu(false);
                    if(this.menu.selectedIndex)
                    {
                        this.selectedIndex = this.menu.selectedIndex;
                        this.menu.selectedIndex = null;
                        this.updateText();
                    } 
                }
                else
                {
                    this.displayMenu(true);
                }
                return;
            }

            // tab key
            if (keyCode === 9)
            {
                PIXI.InputObject.Tab(e, keyCode, this);
                return;
            }

            // up arrow
            if(keyCode === 38)
            {
                this.selectedIndex--;
                if(this.selectedIndex<0)
                {
                    this.selectedIndex = 0;
                }
                this.updateText();
            }

            // down arrow
            if(keyCode === 40)
            {
                this.selectedIndex++;
                if(this.selectedIndex>=this.options.length)
                {
                    this.selectedIndex = this.options.length-1;
                }
                this.updateText();
            }
        },

        onKeyUp: function(e)
        {

            //this._selectionNeedsUpdate = true;

            // fire custom user event
            this.data.onkeyup(e, this);

            if(!this.menu.selectedIndex)
            {
                this.updateText();
            }
        },

        onMouseDown: function(e)
        {
            this.focus();
            this.data.mouseDown = true;
            this.data.onmousedown(e, this);
        },

        onMouseUp: function(e)
        {
            this.data.onmouseup(e, this);
            this.data.mouseDown = false;
            this.focus();

            this.displayMenu(!this.menu.visible);
        },

        displayMenu: function( show )
        {
            this.menu.visible = show;
            this.selection.visible = false;
            this.optionstext.visible = false;
            if(!show) return;

            this.menu.x = this.data.textboxLeft;
            this.menu.width = this.data.textboxWidth;
            this.selection.x = this.data.textboxLeft;
            this.selection.width = this.data.textboxWidth;
            this.selection.height = this.lineHeight;

            var height = this.stage ? this.stage.interactionManager.target.height : 0;
            var top = this.y - this.height * this.anchor.y;
            var bottom = height - (top + this.height);

            if(this.menu.height > bottom)
            {
                if(top > bottom)
                {
                    this.menu.anchor.y = 1;
                    this.menu.y = 1;
                }
                else
                {
                    this.menu.anchor.y = 0;
                    this.menu.y = this.height - 1;
                }
            } 
            else
            {
                this.menu.anchor.y = 0;
                this.menu.y = this.height - 1;
            }

            this.menu.startY = this.menu.y - this.menu.height * this.menu.anchor.y;
            this.menu.selectedIndex = null;

            this.optionstext.y = this.menu.startY;
            this.optionstext.x = 5;
            this.optionstext.visible = true;

            if(this.value)
            {
                this.selection.visible = true;
                this.updateSelection();
            }
        },

        update: function(force)
        {
            if(force || this.data.dirty || this._textNeedsUpdate || this._textStyleNeedsUpdate)
            {

                if(this.data.dirty)
                {
                    this.renderTexture();
                    this.data.dirty = false;
                }
                
                if(this._textStyleNeedsUpdate)
                {
                    this.text.setStyle(this.data.text);

                    if(this.text._isBitmapFont)
                    {
                        this.text._data = PIXI.BitmapText.fonts[this.text.fontName];
                        this.text._scale = this.text.fontSize / this.text._data.size;
                        this.text._lineHeight = this.text._data.lineHeight * this.text._scale;
                    }

                    this._textStyleNeedsUpdate = false;
                }

                if(this._textNeedsUpdate)
                {
                    this.text.setText(this.data.value || "");
                    this.text.updateText();
                    this._textNeedsUpdate = false;
                }
            }
        },

        renderTexture: function()
        {

            PIXI.ButtonFactory( this.canvas, this.context, this.data );

            PIXI.ButtonFactory( bufferCanvas, bufferContext, {
                backgroundGradient: [ "#bbb", "#eee", "#bbb" ],
                borderWidth: 1,
                borderColor: this.data.borderColor,
                borderRadius: [ 0, this.data.borderRadius, this.data.borderRadius, 0 ],
                boxShadow: "none",
                innerShadow: "none",
                padding: 0,
                width: 25,
                height: this.data.outerHeight
            } );

            bufferContext.beginPath();
            bufferContext.moveTo(9 + this.data.borderWidth - 2, this.data.outerHeight/3  + this.data.borderWidth + 1 );
            bufferContext.lineTo(17 - this.data.borderWidth,this.data.outerHeight/3  + this.data.borderWidth + 1 );
            bufferContext.lineTo(12, 2*this.data.outerHeight/3 - this.data.borderWidth + 2);
            bufferContext.closePath();

            bufferContext.fillStyle = "#000";
            bufferContext.fill();

            this.context.drawImage(bufferCanvas, 0, 0, 25, this.data.outerHeight, this.data.outerWidth - 25, 0, 25, this.data.outerHeight);


            // vertically align the text
            if(this.data.valign === "none" || !this.data.valign)
            {
                this.text.y = this.data.padding | 0;
            }
            else if(this.data.valign === "middle")
            {
                this.text.y = (this.data.textboxTop + ((this.data.textboxHeight - this.text.height)/2)) | 0;
            }
            else if(this.data.valign === "top")
            {
                this.text.y = this.data.textboxTop | 0;
            }
            else if(this.data.valign === "bottom")
            {
                this.text.y = (this.data.textboxTop + this.data.textboxHeight - this.text.height) | 0;
            }

            this.text.x = (this.data.textboxLeft + this.data.padding) | 0;

            this.updateTexture();
        },

        updateTransform: function()
        {
            this.update();
            PIXI.Sprite.prototype.updateTransform.call(this);
        },

        destroy: function()
        {
            if(!this.text._isBitmapFont)
            {
                this.text.destroy(true);
            }
            else
            {
                this.text = null;
            }
            if(!this.optionstext._isBitmapFont)
            {
                this.optionstext._isBitmapFont.destroy(true);
            }
            else
            {
                this.optionstext = null;
            }
            PIXI.InputObject.prototype.destroy.call(this);
        }

    }, true);

    Object.defineProperty(PIXI.Select.prototype, 'value', {
        get: function()
        {
            if(this.options[this.selectedIndex])
            {
                return this.options[this.selectedIndex];
            }
           return null;
        },
        set: function(value) {}
    });

})();