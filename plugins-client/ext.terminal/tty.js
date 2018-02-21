define(function(require) {

  var Terminal = require("xterm/xterm");
  var fit = require("xterm/addons/fit/fit");

  /**
   * Based on tty.js
   * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
   */

  ;(function () {

    /**
     * Elements
     */

    var document = this.document
      , window = this
      , root
      , body
      , pgOutput
      , pgTerminal
      , newTerminal;

    /**
     * Helpers
     */

    function cancel(ev, force) {
      if (!this.cancelEvents && !force) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }
    
    function inherits(child, parent) {
      function f() {
        this.constructor = child;
      }
      f.prototype = parent.prototype;
      child.prototype = new f;
    }


    /**
     * tty
     */

    var EventEmitter = require("ace/lib/event_emitter").EventEmitter;
    var tty = Object.create(EventEmitter);

    /**
     * Shared
     */

    tty.socket;
    tty.windows;
    tty.terms;
    tty.elements;

    /**
     * Open
     */

    var ENGINE_IO = require("engine.io");

    tty.open = function () {
      if (document.location.pathname) {
        var parts = document.location.pathname.split('/')
          , base = parts.slice(0, parts.length - 1).join('/') + '/'
          , resource = base.substring(1) + 'engine.io'
          , server;

        if (window.location.href.split(":")[0] === 'https')
          server = 'wss://';
        else
          server = 'ws://';

        server = server + window.location.href.split("\/")[2];
        tty.socket = new ENGINE_IO.Socket(server, {resource: resource});
      } else {
        tty.socket = new ENGINE_IO.Socket();
      }

      tty.windows = [];
      tty.terms = {};

      tty.elements = {
        root: document.documentElement,
        body: document.body,
        pgOutput: document.getElementsByClassName('pgOutput')[0],
        pgTerminal: document.getElementsByClassName('pgTerminal')[0],
        newTerminal: document.getElementsByClassName('newTerminalBtn')[0]
      };

      root = tty.elements.root;
      body = tty.elements.body;
      pgOutput = tty.elements.pgOutput;
      pgTerminal = tty.elements.pgTerminal;
      newTerminal = tty.elements.newTerminal;

      var settings = require("core/settings");
      var c9console = require('ext/console/console');

      if (pgTerminal) {
        pgTerminal.addEventListener('mousedown', function () {
          if (c9console.hiddenInput == false && settings.model.queryValue("auto/console/@showinput") == 'true') {
            c9console.hideInput();
            settings.model.setQueryValue("auto/console/@showinput", true);

            document.getElementsByClassName('pgOutput')[0].addEventListener('click', function () {
              if (settings.model.queryValue("auto/console/@showinput") == 'true') c9console.showInput();
            });

            var length = document.getElementsByClassName('pgConsole').length;

            for (var i = 0; i < length; i++) {
              document.getElementsByClassName('pgConsole')[i].addEventListener('click', function () {
                if (settings.model.queryValue("auto/console/@showinput") == 'true') c9console.showInput();
              });
            }
          }
        }, false);
      }

      if (newTerminal) {
        newTerminal.addEventListener('click', function () {
          new Window;
        }, false);
      }

      tty.socket.on('open', function () {
        tty.reset();
      });

      tty.socket.on('close', function (reason) {
        console.log("Disconnect: " + reason + ". Reconnecting...");
        tty.socket.open();
      });

      tty.socket.on('message', function (data) {
        data = JSON.parse(data);
        if (data.cmd == 'data') {
          if (!tty.terms[data.id]) return;
          tty.terms[data.id].write(data.payload);
        }
        else if (data.cmd == 'killACK') {
          if (!tty.terms[data.id]) return;
          tty.terms[data.id]._destroy();
        }
        else if (data.cmd == 'sync') {
          if (!require('ext/console/console').hidden) {
            var evt1 = document.createEvent('MouseEvents');
            evt1.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            var evt2 = document.createEvent('MouseEvents');
            evt2.initMouseEvent('mouseup', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            var termElement = document.getElementsByClassName('pgTerminal')[0];
            termElement.dispatchEvent(evt1);
            termElement.dispatchEvent(evt2);
          }

          console.log('Attempting to sync...');

          tty.reset();

          Object.keys(data.terms).forEach(function (key) {
            var tdata = data.terms[key]
              , win = new Window(tty.socket, true)
              , tab = win.tabs[0];

            delete tty.terms[tab.id];
            tab.pty = tdata.pty;
            tab.id = tdata.id;
            tty.terms[tdata.id] = tab;
            win.resize(tdata.cols, tdata.rows);
            win.move(tdata.left, tdata.top);
            tab.setProcessName(tdata.process);
            console.log(' - ' + tdata.id)

            /* This is a hack but otherwise the focus remains on the hidden
             * console at the bottom of the page
             */
            setTimeout(function () {
              win.focus();
            }, 50);
          });
        }
      });

      // We would need to poll the os on the serverside
      // anyway. there's really no clean way to do this.
      // This is just easier to do on the
      // clientside, rather than poll on the
      // server, and *then* send it to the client.
      setInterval(function () {
        var i = tty.windows.length;
        while (i--) {
          if (!tty.windows[i].focused) continue;
          tty.windows[i].focused.pollProcessName();
        }
      }, 2 * 1000);

      // Keep windows maximized when browser size changes
      window.addEventListener('resize', function () {
        var i = tty.windows.length
          , win;

        while (i--) {
          win = tty.windows[i];
          if (win.minimize) {
            win.minimize();
            win.maximize();
          }
        }
      }, false);
    };

    /**
     * Reset
     */

    tty.reset = function () {
      var i = tty.windows.length;
      while (i--) {
        tty.windows[i].destroy();
      }

      tty.windows = [];
      tty.terms = {};
    };

    /**
     * Window
     */

    function Window(socket, resume) {
      var self = this;

      var el
        , grip
        , xterm
        , bar
        , button
        , title
        , defaultS
        , container;

      el = document.createElement('div');
      el.className = 'window';

      grip = document.createElement('div');
      grip.className = 'grip';

      xterm = document.createElement('div');
      xterm.className = 'xterm-container';

      bar = document.createElement('div');
      bar.className = 'bar';

      button = document.createElement('div');
      button.innerHTML = '~';
      button.title = 'new/close';
      button.className = 'tabT';

      title = document.createElement('div');
      title.className = 'title';
      title.innerHTML = '';

      defaultS = document.createElement('div');
      defaultS.innerHTML = '=';
      defaultS.title = 'Default size';
      defaultS.className = 'tabT';

      this.socket = socket || tty.socket;
      this.resume = resume || false;
      this.element = el;
      this.grip = grip;
      this.bar = bar;
      this.button = button;
      this.defaultS = defaultS;
      this.title = title;

      this.tabs = [];
      this.focused = null;

      this.cols = 80;
      this.rows = 24;

      // The following is to accomodate very small console areas
      container = document.getElementsByClassName('page pgTerminal curpage')[0]

      if (container != undefined && container.clientHeight < 370) {
        this.rows = container.clientHeight / 27 | 0;
      }
      if (container != undefined && container.clientWidth < 600) {
        this.cols = container.clientWidth / 8 | 0;
      }
      
      el.appendChild(grip);
      el.appendChild(xterm);
      el.appendChild(bar);
      bar.appendChild(button);
      bar.appendChild(defaultS);
      bar.appendChild(title);
      document.getElementById('terminalWindow').appendChild(el);

      tty.windows.push(this);

      this.createTab();
      this.focus();
      this.bind();

      this.resume = false;
    }

    Window.prototype.bind = function () {
      var self = this
        , el = this.element
        , bar = this.bar
        , grip = this.grip
        , button = this.button
        , defaultS = this.defaultS
        , last = 0;

      button.addEventListener('click', function (ev) {
        if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.shiftKey) {
          self.destroy();
        } else {
          self.createTab();
        }
      }, false);

      defaultS.addEventListener('click', function (ev) {
        self.resize(80, 24);
        return cancel(ev);
      }, false);

      grip.addEventListener('mousedown', function (ev) {
        self.focus();
        self.resizing(ev);
      }, false);

      el.addEventListener('mousedown', function (ev) {
        if (ev.target !== el && ev.target !== bar) {
          if (apf.document.activeElement == null) return;
          return apf.document.activeElement.blur();
        }

        self.focus();

        if (new Date - last < 600) {
          return self.maximize();
        }
        last = new Date;

        self.drag(ev);
      }, false);
    };

    Window.prototype.focus = function () {
      // Restack
      var parent = this.element.parentNode;
      if (parent) {
        parent.removeChild(this.element);
        parent.appendChild(this.element);
        if (document.getElementsByClassName('ace_text-input')[0] != undefined) {
          var length = document.getElementsByClassName('ace_text-input').length;
          for (var i = 0; i < length; i++) {
            document.getElementsByClassName('ace_text-input')[i].blur();
          }
        }
      }

      // Focus Foreground Tab
      this.focused.focus();
    };

    Window.prototype.destroy = function () {
      if (this.destroyed) return;
      this.destroyed = true;

      if (this.minimize) this.minimize();

      splice(tty.windows, this);
      if (tty.windows.length) tty.windows[0].focus();

      this.element.parentNode.removeChild(this.element);

      this.each(function (term) {
        term.destroy();
      });
    };

    Window.prototype.drag = function (ev) {
      var self = this
        , el = this.element
        , socket = this.socket
        , id = this.tabs[0].id;

      if (this.minimize) return;

      var drag = {
        left: el.offsetLeft,
        top: el.offsetTop,
        pageX: ev.pageX,
        pageY: ev.pageY
      };

      el.style.opacity = '0.60';
      el.style.cursor = 'move';
      root.style.cursor = 'move';

      function move(ev) {
        el.style.left =
          (drag.left + ev.pageX - drag.pageX) + 'px';
        el.style.top =
          (drag.top + ev.pageY - drag.pageY) + 'px';
      }

      function up() {
        el.style.opacity = '';
        el.style.cursor = '';
        root.style.cursor = '';

        document.removeEventListener('mousemove', move, false);
        document.removeEventListener('mouseup', up, false);

        var ev = {
          left: el.style.left.replace(/\w+/g, ''),
          top: el.style.top.replace(/\w+/g, '')
        };

        socket.send(JSON.stringify({cmd: 'move', id: id, left: el.style.left, top: el.style.top}));

        tty.terms[id].focus();

      }

      document.addEventListener('mousemove', move, false);
      document.addEventListener('mouseup', up, false);
    };

    Window.prototype.resizing = function (ev) {
      var self = this
        , el = this.element
        , term = this.focused;

      if (this.minimize) delete this.minimize;
      
      var resize = {
        w: el.clientWidth,
        h: el.clientHeight
      };

      el.style.overflow = 'hidden';
      el.style.opacity = '0.70';
      el.style.cursor = 'se-resize';
      root.style.cursor = 'se-resize';
      term.element.style.height = '100%';

      function move(ev) {
        var x, y;
        y = window.innerHeight - document.getElementsByClassName('page pgTerminal curpage')[0].clientHeight + 15;
        x = ev.pageX - el.offsetLeft;
        y = (ev.pageY - el.offsetTop) - y;
        el.style.width = x + 'px';
        el.style.height = y + 'px';
      }

      function up() {
        var x, y;

        x = el.clientWidth / resize.w;
        y = el.clientHeight / resize.h;
        x = (x * term.cols) | 0;
        y = (y * term.rows) | 0;

        self.resize(x, y);

        el.style.width = '';
        el.style.height = '';

        el.style.overflow = '';
        el.style.opacity = '';
        el.style.cursor = '';
        root.style.cursor = '';
        term.element.style.height = '';
        term.element.focus();
         
        document.removeEventListener('mousemove', move, false);
        document.removeEventListener('mouseup', up, false);
      }

      document.addEventListener('mousemove', move, false);
      document.addEventListener('mouseup', up, false);
    };

    Window.prototype.maximize = function () {
      if (this.minimize) return this.minimize();

      var self = this
        , el = this.element
        , term = this.focused
        , x
        , y;

      var m = {
        cols: term.cols,
        rows: term.rows,
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.style.width,
        height: el.style.height,
        root: root.className
      };

      this.minimize = function () {
        delete this.minimize;

        el.style.left = m.left + 'px';
        el.style.top = m.top + 'px';
        el.style.width = m.width;
        el.style.height = m.height;
        term.element.style.width = '';
        term.element.style.height = '';
        el.style.boxSizing = '';
        self.grip.style.display = '';
        root.className = m.root;

        self.resize(m.cols, m.rows);

        // This seems to be required by Chrome for proper focusing
        setTimeout(function() {
          term.element.focus();
        }, 50);
      };

      window.scrollTo(0, 0);

      var xterm = el.getElementsByClassName('xterm-container')[0];
      xterm.style.width = '100%';
      xterm.style.height = '100%';

      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.boxSizing = 'border-box';
      this.grip.style.display = 'none';
      root.className = 'maximized';

      fit.fit(term);
      term.element.focus();
    };

    Window.prototype.resize = function (cols, rows) {
      this.cols = cols;
      this.rows = rows;

      this.each(function (term) {
        term.resize(cols, rows);
      });
    };

    Window.prototype.move = function (left, top) {
      this.element.style.left = left;
      this.element.style.top = top;
    };

    Window.prototype.each = function (func) {
      var i = this.tabs.length;
      while (i--) {
        func(this.tabs[i], i);
      }
    };

    Window.prototype.createTab = function () {
      return new Tab(this, this.socket, this.resume);
    };

    Window.prototype.highlight = function () {
      var self = this;

      this.element.style.borderColor = 'orange';
      setTimeout(function () {
        self.element.style.borderColor = '';
      }, 200);

      this.focus();
    };

    Window.prototype.focusTab = function (next) {
      var tabs = this.tabs
        , i = indexOf(tabs, this.focused)
        , l = tabs.length;

      if (!next) {
        if (tabs[--i]) return tabs[i].focus();
        if (tabs[--l]) return tabs[l].focus();
      } else {
        if (tabs[++i]) return tabs[i].focus();
        if (tabs[0]) return tabs[0].focus();
      }

      return this.focused && this.focused.focus();
    };

    Window.prototype.nextTab = function () {
      return this.focusTab(true);
    };

    Window.prototype.previousTab = function () {
      return this.focusTab(false);
    };

    /**
     * Tab
     */

    function Tab(win, socket, resume) {
      var self = this;

      var cols = win.cols
        , rows = win.rows;

      Terminal.call(this, {
        cols: cols,
        rows: rows,
        cursorBlink: false,
        tabStopWidth: 4,
        fontSize: 12
      });

      var button = document.createElement('div');
      button.className = 'tabT';
      button.innerHTML = '\u2022';
      win.bar.appendChild(button);

      button.addEventListener('click', function (ev) {
        if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.shiftKey) {
          self.destroy();
        } else {
          self.focus();
        }
      }, false);

      this.id = '';
      this.socket = socket || tty.socket;
      this.window = win;
      this.button = button;
      this.element = null;
      this.process = '';
      this.open(document.getElementById('xterm-container'), false);

      this.hookKeys();
      this.hookMouse();

      win.tabs.push(this);

      if (!resume) {
        this.socket.send(JSON.stringify({cmd: 'create', cols: cols, rows: rows}));

        this.socket.on('message', function (data) {
          data = JSON.parse(data);
          if (data.cmd == 'createACK' && self.id == '') {
            if (data.error) return self._destroy();
            self.pty = data.pty;
            self.id = data.id;
            tty.terms[self.id] = self;
            self.setProcessName(data.process);
          }
        });
      }

      this.focus();

    }

    inherits(Tab, Terminal);

// We could just hook in `tab.on('data', ...)`
// in the constructor, but this is faster.
    Tab.prototype.handler = function (data) {
      this.socket.send(JSON.stringify({cmd: 'data', id: this.id, payload: data}));
    };

// We could just hook in `tab.on('title', ...)`
// in the constructor, but this is faster.
    Tab.prototype.handleTitle = function (title) {
      if (!title) return;

      title = sanitize(title);
      this.title = title;

      if (this.window.focused === this) {
        this.window.bar.title = title;
        // this.setProcessName(this.process);
      }
    };

    Tab.prototype._write = Tab.prototype.write;

    Tab.prototype.write = function (data) {
      if (this.window.focused !== this) this.button.style.color = 'green';
      return this._write(data);
    };

    Tab.prototype._focus = Tab.prototype.focus;

    Tab.prototype.focus = function () {

      if (Terminal.focus === this) {
        this.element.focus();
        return;
      }

      var win = this.window;

      var xterm = win.element.getElementsByClassName('xterm-container')[0];

      // maybe move to Tab.prototype.switch
      if (win.focused !== this) {
        if (win.focused) {
          if (win.focused.element.parentNode) {
            win.focused.element.parentNode.removeChild(win.focused.element);
          }
          win.focused.button.style.fontWeight = '';
        }

        xterm.appendChild(this.element);
        win.focused = this;

        win.title.innerHTML = this.process;
        this.button.style.fontWeight = 'bold';
        this.button.style.color = '';
      }

      this.handleTitle(this.title);

      this._focus();
    };

    Tab.prototype._resize = Tab.prototype.resize;

    Tab.prototype.resize = function (cols, rows) {
      this.socket.send(JSON.stringify({cmd: 'resize', id: this.id, cols: cols, rows: rows}));
      this._resize(cols, rows);
    };

    Tab.prototype.__destroy = Tab.prototype.destroy;

    Tab.prototype._destroy = function () {
      if (this.destroyed) return;
      this.destroyed = true;

      var win = this.window;

      this.button.parentNode.removeChild(this.button);
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      if (tty.terms[this.id]) delete tty.terms[this.id];
      splice(win.tabs, this);

      if (win.focused === this) {
        win.previousTab();
      }

      if (!win.tabs.length) {
        win.destroy();
      }

      this.__destroy();
    };

    Tab.prototype.destroy = function () {
      if (this.destroyed) return;
      this.socket.send(JSON.stringify({cmd: 'kill', id: this.id}));
      this._destroy();
    };

    Tab.prototype.hookKeys = function () {
      var self = this;
      
      // Ctrl-V (Paste on Windows)
      if(apf.isWin) {
        this.attachCustomKeyEventHandler(function (e) {
          if (e.ctrlKey == true && e.keyCode == 86) {
            return false; // Do nothing
          }
        });
      }
      
      // Handle space in iOS
      if(apf.isIphone) {
        self.element.addEventListener('keydown', function (ev) {
          if(ev.charCode === 0 && ev.code === "Space") {
            self.send(" ");
          }
        });
      }

      // Alt-[jk] to quickly swap between windows.
      this.on('key', function (key, ev) {
        // focusKeys no longer supported by xterm
        if (Terminal.focusKeys === false) {
          return;
        }

        var offset
          , i;

        if (key === '\x1bj') {
          offset = -1;
        } else if (key === '\x1bk') {
          offset = +1;
        } else {
          return;
        }

        i = indexOf(tty.windows, this.window) + offset;

        this._ignoreNext();

        if (tty.windows[i]) return tty.windows[i].highlight();

        if (offset > 0) {
          if (tty.windows[0]) return tty.windows[0].highlight();
        } else {
          i = tty.windows.length - 1;
          if (tty.windows[i]) return tty.windows[i].highlight();
        }

        return this.window.highlight();
      });

      this.on('request paste', function (key) {
        this.socket.send(JSON.stringify({cmd: 'request paste'}));
        this.socket.on('message', function (data) {
          data = JSON.parse(data);
          if (data.cmd == 'pasteACK') {
            if (data.error) return;
            self.send(data.stdout);
          }
        });
      });

      this.on('request create', function () {
        this.window.createTab();
      });

      this.on('request term', function (key) {
        if (this.window.tabs[key]) {
          this.window.tabs[key].focus();
        }
      });

      this.on('request term next', function (key) {
        this.window.nextTab();
      });

      this.on('request term previous', function (key) {
        this.window.previousTab();
      });
    };

    Tab.prototype.hookMouse = function () {
      var self = this;

      self.element.addEventListener('mouseup', function (ev) {
        // Left mouse button
        if (ev.which == 1 && self.selectionManager.hasSelection) {
          var termTextarea = document.getElementsByClassName('xterm-helper-textarea')[0];

          apf.clipboard.put(self.selectionManager.selectionText);
          termTextarea.value = self.selectionManager.selectionText;
          termTextarea.focus();

          document.execCommand('SelectAll');

          try {
            if (document.execCommand("copy")) {
              termTextarea.value = "";
              return;
            }
          } catch (e) {
          }

          termTextarea.value = "";
        }
        // Right mouse button
        else if (ev.which == 3 && !apf.clipboard.empty) {
          if (typeof apf.clipboard.store === 'string') {
            self.send(apf.clipboard.store);
          }
        }
      }, false);

      self.element.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
      }, false);
    };

    Tab.prototype._ignoreNext = function () {
      // Don't send the next key.
      var handler = this.handler;
      this.handler = function () {
        this.handler = handler;
      };
      var showCursor = this.showCursor;
      this.showCursor = function () {
        this.showCursor = showCursor;
      };
    };

    /**
     * Program-specific Features
     */

    Tab.scrollable = {
      irssi: true,
      man: true,
      less: true,
      htop: true,
      top: true,
      w3m: true,
      lynx: true,
      mocp: true
    };

    Tab.prototype._bindMouse = Tab.prototype.bindMouse;

    Tab.prototype.bindMouse = function () {
      if (!Terminal.programFeatures) return this._bindMouse();

      var self = this;

      var wheelEvent = 'onmousewheel' in window
        ? 'mousewheel'
        : 'DOMMouseScroll';

      on(self.element, wheelEvent, function (ev) {
        if (self.mouseEvents) return;
        if (!Tab.scrollable[self.process]) return;

        if ((ev.type === 'mousewheel' && ev.wheelDeltaY > 0)
          || (ev.type === 'DOMMouseScroll' && ev.detail < 0)) {
          // page up
          self.keyDown({keyCode: 33});
        } else {
          // page down
          self.keyDown({keyCode: 34});
        }

        return cancel(ev);
      });

      return this._bindMouse();
    };

    Tab.prototype.pollProcessName = function (func) {
      var self = this;
      this.socket.send(JSON.stringify({cmd: 'process', id: this.id}));

      this.socket.on('message', function (data) {
        data = JSON.parse(data);
        if (data.cmd == 'processACK' && data.id == self.id) {
          if (data.error) return func && func(data.error);
          self.setProcessName(data.name);
          return func && func(null, name);
        }
      });
    };

    Tab.prototype.setProcessName = function (name) {
      name = sanitize(name);

      this.process = name;
      this.button.title = name;

      if (this.window.focused === this) {
        this.window.title.innerHTML = name;
      }
    };

    /**
     * Helpers
     */

    function indexOf(obj, el) {
      var i = obj.length;
      while (i--) {
        if (obj[i] === el) return i;
      }
      return -1;
    }

    function splice(obj, el) {
      var i = indexOf(obj, el);
      if (~i) obj.splice(i, 1);
    }

    function sanitize(text) {
      if (!text) return '';
      return (text + '').replace(/[&<>]/g, '')
    }

    /**
     * Load
     */

    function load() {
      if (load.done) return;
      load.done = true;

      document.removeEventListener('load', load, false);
      document.removeEventListener('DOMContentLoaded', load, false);
      tty.open();
    }

    document.addEventListener('load', load, false);
    document.addEventListener('DOMContentLoaded', load, false);
    setTimeout(load, 1000);

    /**
     * Expose
     */

    tty.Window = Window;
    tty.Tab = Tab;
    tty.Terminal = Terminal;

    this.tty = tty;

  }).call(function () {
    return this || (typeof window !== 'undefined' ? window : global);
  }());

});