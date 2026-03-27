define(function(require) {

  var Terminal = require("xterm/xterm").Terminal;
  var FitAddon = require("xterm-fit/xterm-addon-fit").FitAddon;

  /**
   * Tiling terminal window manager for Pylon IDE
   * Replaces the original floating window system with a tiling layout.
   *
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
      child.prototype = new f();
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
     * Tiling layout manager
     *
     * The layout is a binary tree of splits. Each leaf node is a Pane
     * containing a Window (which has tabs of terminals).
     * Each internal node is a Split with a direction (horizontal/vertical),
     * two children, and a splitter bar between them.
     *
     * The root container is #terminalWindow.
     */

    var tilingRoot = null;   // Root node of the tiling tree (Pane or Split)
    var focusedPane = null;  // Currently focused Pane

    /**
     * Split node - contains two children separated by a splitter bar
     */
    function Split(direction, first, second, container) {
      this.type = 'split';
      this.direction = direction; // 'horizontal' or 'vertical'
      this.parent = null;
      this.first = first;
      this.second = second;
      this.ratio = 0.5;

      first.parent = this;
      second.parent = this;

      this.element = container || document.createElement('div');
      this.element.className = 'tiling-split tiling-' + direction;

      this.splitter = document.createElement('div');
      this.splitter.className = 'tiling-splitter tiling-splitter-' + direction;

      this.element.innerHTML = '';
      this.element.appendChild(first.element);
      this.element.appendChild(this.splitter);
      this.element.appendChild(second.element);

      this._bindSplitter();
      this._applyRatio();
    }

    Split.prototype._applyRatio = function () {
      var pct1 = (this.ratio * 100).toFixed(2) + '%';
      var pct2 = ((1 - this.ratio) * 100).toFixed(2) + '%';
      var splitterSize = '4px';

      if (this.direction === 'horizontal') {
        this.first.element.style.width = 'calc(' + pct1 + ' - 2px)';
        this.first.element.style.height = '100%';
        this.second.element.style.width = 'calc(' + pct2 + ' - 2px)';
        this.second.element.style.height = '100%';
      } else {
        this.first.element.style.height = 'calc(' + pct1 + ' - 2px)';
        this.first.element.style.width = '100%';
        this.second.element.style.height = 'calc(' + pct2 + ' - 2px)';
        this.second.element.style.width = '100%';
      }
    };

    Split.prototype._bindSplitter = function () {
      var self = this;
      var splitter = this.splitter;

      splitter.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        var startX = ev.pageX;
        var startY = ev.pageY;
        var startRatio = self.ratio;
        var rect = self.element.getBoundingClientRect();

        document.body.style.cursor = self.direction === 'horizontal' ? 'col-resize' : 'row-resize';
        // Overlay to prevent iframes/xterm from eating mouse events
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;cursor:' +
          (self.direction === 'horizontal' ? 'col-resize' : 'row-resize');
        document.body.appendChild(overlay);

        function move(ev) {
          var delta, total;
          if (self.direction === 'horizontal') {
            delta = ev.pageX - startX;
            total = rect.width;
          } else {
            delta = ev.pageY - startY;
            total = rect.height;
          }
          self.ratio = Math.min(0.9, Math.max(0.1, startRatio + delta / total));
          self._applyRatio();
          fitAllPanes();
        }

        function up() {
          document.body.style.cursor = '';
          document.body.removeChild(overlay);
          document.removeEventListener('mousemove', move, false);
          document.removeEventListener('mouseup', up, false);
          fitAllPanes();
        }

        document.addEventListener('mousemove', move, false);
        document.addEventListener('mouseup', up, false);
      }, false);
    };

    Split.prototype.replaceChild = function (oldChild, newChild) {
      newChild.parent = this;
      if (this.first === oldChild) {
        this.first = newChild;
        this.element.replaceChild(newChild.element, oldChild.element);
      } else if (this.second === oldChild) {
        this.second = newChild;
        this.element.replaceChild(newChild.element, oldChild.element);
      }
      this._applyRatio();
    };

    Split.prototype.getLeaves = function () {
      var leaves = [];
      function walk(node) {
        if (node.type === 'pane') leaves.push(node);
        else {
          walk(node.first);
          walk(node.second);
        }
      }
      walk(this);
      return leaves;
    };

    Split.prototype.destroy = function () {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    };

    /**
     * Pane - a leaf node containing a Window (terminal with tabs)
     */
    function Pane(container) {
      this.type = 'pane';
      this.parent = null;
      this.window = null;

      this.element = container || document.createElement('div');
      this.element.className = 'tiling-pane';

      // The bar at the top of each pane
      this.bar = document.createElement('div');
      this.bar.className = 'tiling-pane-bar';

      // Buttons
      this.splitHBtn = document.createElement('div');
      this.splitHBtn.className = 'tiling-btn';
      this.splitHBtn.innerHTML = '&#x2507;'; // vertical dots = split horizontal
      this.splitHBtn.title = 'Split horizontal (Alt+D)';

      this.splitVBtn = document.createElement('div');
      this.splitVBtn.className = 'tiling-btn';
      this.splitVBtn.innerHTML = '&#x2509;'; // horizontal dots = split vertical
      this.splitVBtn.title = 'Split vertical (Alt+Shift+D)';

      this.closeBtn = document.createElement('div');
      this.closeBtn.className = 'tiling-btn tiling-btn-close';
      this.closeBtn.innerHTML = '&#x2715;';
      this.closeBtn.title = 'Close pane (Alt+W)';

      this.newTabBtn = document.createElement('div');
      this.newTabBtn.className = 'tiling-btn';
      this.newTabBtn.innerHTML = '+';
      this.newTabBtn.title = 'New tab / Shift+click to close tab';

      this.title = document.createElement('div');
      this.title.className = 'tiling-pane-title';

      // Container for the xterm
      this.termContainer = document.createElement('div');
      this.termContainer.className = 'tiling-term-container';

      this.bar.appendChild(this.newTabBtn);
      this.bar.appendChild(this.splitHBtn);
      this.bar.appendChild(this.splitVBtn);
      this.bar.appendChild(this.title);
      this.bar.appendChild(this.closeBtn);

      this.element.appendChild(this.bar);
      this.element.appendChild(this.termContainer);

      this._bind();
    }

    Pane.prototype._bind = function () {
      var self = this;

      this.splitHBtn.addEventListener('click', function () {
        splitPane(self, 'horizontal');
      }, false);

      this.splitVBtn.addEventListener('click', function () {
        splitPane(self, 'vertical');
      }, false);

      this.closeBtn.addEventListener('click', function () {
        closePane(self);
      }, false);

      this.newTabBtn.addEventListener('click', function (ev) {
        if (!self.window) return;
        if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.shiftKey) {
          // Close current tab
          if (self.window.focused) {
            self.window.focused.destroy();
          }
        } else {
          self.window.createTab();
        }
      }, false);

      this.element.addEventListener('mousedown', function () {
        focusPane(self);
      }, false);
    };

    Pane.prototype.getLeaves = function () {
      return [this];
    };

    Pane.prototype.destroy = function () {
      if (this.window) {
        this.window.destroy();
      }
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    };

    /**
     * Tiling operations
     */

    function createPane(container) {
      var pane = new Pane(container);
      var win = new Window(tty.socket, false, pane);
      pane.window = win;
      return pane;
    }

    function splitPane(pane, direction) {
      var newPane = createPane();

      if (pane === tilingRoot && !pane.parent) {
        // Root pane — wrap in a new split
        var rootContainer = pane.element.parentNode;
        rootContainer.removeChild(pane.element);

        // Reset inline styles that may have been set as root
        pane.element.style.width = '';
        pane.element.style.height = '';

        var split = new Split(direction, pane, newPane, null);
        split.element.style.width = '100%';
        split.element.style.height = '100%';
        rootContainer.appendChild(split.element);
        tilingRoot = split;
      } else {
        // Nested pane — replace in parent split
        var parentSplit = pane.parent;
        pane.element.style.width = '';
        pane.element.style.height = '';

        var split = new Split(direction, pane, newPane, null);
        parentSplit.replaceChild(pane, split);
      }

      focusPane(newPane);
      fitAllPanes();
    }

    function closePane(pane) {
      if (!pane.parent) {
        // Last pane — don't close, just destroy terminals
        // Actually, let's keep at least one terminal
        return;
      }

      var parentSplit = pane.parent;
      var sibling = (parentSplit.first === pane) ? parentSplit.second : parentSplit.first;

      // Detach sibling from split
      sibling.parent = parentSplit.parent;

      if (parentSplit === tilingRoot) {
        // Parent split is root
        var rootContainer = parentSplit.element.parentNode;
        rootContainer.removeChild(parentSplit.element);
        sibling.element.style.width = '100%';
        sibling.element.style.height = '100%';
        rootContainer.appendChild(sibling.element);
        tilingRoot = sibling;
        sibling.parent = null;
      } else {
        // Parent split is nested
        var grandparent = parentSplit.parent;
        grandparent.replaceChild(parentSplit, sibling);
      }

      pane.destroy();

      // Focus the sibling or first leaf
      var leaves = tilingRoot.getLeaves();
      if (leaves.length > 0) {
        focusPane(leaves[0]);
      }
      fitAllPanes();
    }

    function focusPane(pane) {
      // Remove focus from previous
      if (focusedPane && focusedPane.element) {
        focusedPane.element.classList.remove('tiling-pane-focused');
      }
      focusedPane = pane;
      if (pane && pane.element) {
        pane.element.classList.add('tiling-pane-focused');
        if (pane.window && pane.window.focused) {
          pane.window.focused.focus();
        }
      }
    }

    function getAllPanes() {
      if (!tilingRoot) return [];
      return tilingRoot.getLeaves();
    }

    function fitAllPanes() {
      // Delay to allow layout to settle
      setTimeout(function () {
        var panes = getAllPanes();
        for (var i = 0; i < panes.length; i++) {
          var pane = panes[i];
          if (pane.window && pane.window.focused) {
            var tab = pane.window.focused;
            try {
              var fit = new FitAddon();
              tab.loadAddon(fit);
              fit.fit();
              // Notify server of new size
              if (tab.cols && tab.rows && tab.id) {
                tab.socket.send(JSON.stringify({
                  cmd: 'resize', id: tab.id,
                  cols: tab.cols, rows: tab.rows
                }));
              }
            } catch (e) {
              // fit may fail if element not yet visible
            }
          }
        }
      }, 50);
    }

    function navigatePane(offset) {
      var panes = getAllPanes();
      if (panes.length <= 1) return;
      var idx = panes.indexOf(focusedPane);
      if (idx === -1) idx = 0;
      idx = (idx + offset + panes.length) % panes.length;
      focusPane(panes[idx]);
    }

    /**
     * Open
     */

    var ENGINE_IO_Socket = require("engine.io");

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
        tty.socket = new ENGINE_IO_Socket(server, {resource: resource});
      } else {
        tty.socket = new ENGINE_IO_Socket();
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
          if (!focusedPane) {
            // No panes yet, shouldn't happen but create one
            return;
          }
          // Split the focused pane horizontally
          splitPane(focusedPane, 'horizontal');
        }, false);
      }

      tty.socket.on('open', function () {
        tty.reset();
        // Create initial tiling layout with one pane
        var container = document.getElementById('terminalWindow');
        container.innerHTML = '';
        var pane = createPane(null);
        pane.element.style.width = '100%';
        pane.element.style.height = '100%';
        container.appendChild(pane.element);
        tilingRoot = pane;
        focusPane(pane);
        fitAllPanes();
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

          var container = document.getElementById('terminalWindow');
          container.innerHTML = '';
          tilingRoot = null;
          focusedPane = null;

          var termKeys = Object.keys(data.terms);
          if (termKeys.length === 0) {
            // Create a fresh pane
            var pane = createPane(null);
            pane.element.style.width = '100%';
            pane.element.style.height = '100%';
            container.appendChild(pane.element);
            tilingRoot = pane;
            focusPane(pane);
          } else {
            // Restore terminals — one pane per synced terminal
            var firstPane = null;
            termKeys.forEach(function (key, idx) {
              var tdata = data.terms[key];

              if (idx === 0) {
                var pane = createPane(null);
                pane.element.style.width = '100%';
                pane.element.style.height = '100%';
                container.appendChild(pane.element);
                tilingRoot = pane;
                firstPane = pane;

                // Replace the auto-created terminal with the synced one
                var win = pane.window;
                var tab = win.tabs[0];
                delete tty.terms[tab.id];
                tab.pty = tdata.pty;
                tab.id = tdata.id;
                tty.terms[tdata.id] = tab;
                tab.setProcessName(tdata.process);
              } else {
                // Split to create additional panes
                splitPane(focusedPane || firstPane, 'horizontal');
                var panes = getAllPanes();
                var newPane = panes[panes.length - 1];

                var win = newPane.window;
                var tab = win.tabs[0];
                delete tty.terms[tab.id];
                tab.pty = tdata.pty;
                tab.id = tdata.id;
                tty.terms[tdata.id] = tab;
                tab.setProcessName(tdata.process);
              }
            });
            if (firstPane) focusPane(firstPane);
          }

          setTimeout(function () {
            fitAllPanes();
          }, 100);
        }
      });

      // Poll process names
      setInterval(function () {
        var panes = getAllPanes();
        for (var i = 0; i < panes.length; i++) {
          if (panes[i].window && panes[i].window.focused) {
            panes[i].window.focused.pollProcessName();
          }
        }
      }, 2 * 1000);

      // Re-fit on browser resize
      window.addEventListener('resize', function () {
        fitAllPanes();
      }, false);

      // Watch for console panel resize via MutationObserver
      var termWin = document.getElementById('terminalWindow');
      if (termWin && typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function () {
          fitAllPanes();
        });
        ro.observe(termWin);
      }
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
     * Window - a terminal container with tab support
     * Now lives inside a Pane instead of floating.
     */

    function Window(socket, resume, pane) {
      var self = this;

      this.socket = socket || tty.socket;
      this.resume = resume || false;
      this.pane = pane;

      this.tabs = [];
      this.focused = null;

      this.cols = 80;
      this.rows = 24;

      // Adjust for small containers
      if (pane && pane.termContainer) {
        var w = pane.termContainer.clientWidth;
        var h = pane.termContainer.clientHeight;
        if (h > 0 && h < 370) {
          this.rows = Math.max(4, h / 27 | 0);
        }
        if (w > 0 && w < 600) {
          this.cols = Math.max(10, w / 8 | 0);
        }
      }

      tty.windows.push(this);

      this.createTab();
      this.resume = false;
    }

    Window.prototype.focus = function () {
      if (this.focused) this.focused.focus();
    };

    Window.prototype.destroy = function () {
      if (this.destroyed) return;
      this.destroyed = true;

      splice(tty.windows, this);

      this.each(function (term) {
        term.destroy();
      });
    };

    Window.prototype.resize = function (cols, rows) {
      this.cols = cols;
      this.rows = rows;

      this.each(function (term) {
        term.resize(cols, rows);
      });
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

      this.xterm = new Terminal({
        cols: cols,
        rows: rows,
        cursorBlink: false,
        tabStopWidth: 2,
        fontSize: 12
      });

      this._core = this.xterm._core;
      this._addonManager = this.xterm._addonManager;
      this._publicOptions = this.xterm._publicOptions;
      delete this.xterm;

      // Tab button in the pane's bar
      var button = document.createElement('div');
      button.className = 'tiling-tab-btn';
      button.innerHTML = '\u2022';

      if (win.pane && win.pane.bar) {
        // Insert before title
        win.pane.bar.insertBefore(button, win.pane.title);
      }

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

      this.open(win.pane.termContainer);

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

    Tab.prototype.handler = function (data) {
      this.socket.send(JSON.stringify({cmd: 'data', id: this.id, payload: data}));
    };

    Tab.prototype.handleTitle = function (title) {
      if (!title) return;

      title = sanitize(title);
      this.title = title;

      if (this.window.focused === this && this.window.pane) {
        this.window.pane.bar.title = title;
      }
    };

    Tab.prototype._write = Tab.prototype.write;

    Tab.prototype.write = function (data) {
      if (this.window.focused !== this) this.button.style.color = 'green';
      return this._write(data);
    };

    Tab.prototype._focus = Tab.prototype.focus;

    Tab.prototype.focus = function () {
      var win = this.window;
      var container = win.pane ? win.pane.termContainer : null;
      if (!container) return;

      if (win.focused !== this) {
        if (win.focused) {
          if (win.focused.element && win.focused.element.parentNode) {
            win.focused.element.parentNode.removeChild(win.focused.element);
          }
          win.focused.button.style.fontWeight = '';
        }

        container.appendChild(this.element);
        win.focused = this;

        if (win.pane) {
          win.pane.title.innerHTML = this.process;
        }
        this.button.style.fontWeight = 'bold';
        this.button.style.color = '';
      }

      this.handleTitle(this.title);

      if (ppc.isIphone) {
        this.element.focus();
      }
      else {
        this._focus();
      }
    };

    Tab.prototype._resize = Tab.prototype.resize;

    Tab.prototype.resize = function (cols, rows) {
      this.socket.send(JSON.stringify({cmd: 'resize', id: this.id, cols: cols, rows: rows}));
      this._resize(cols, rows);
    };

    Tab.prototype.__destroy = Tab.prototype.dispose;

    Tab.prototype._destroy = function () {
      if (this.destroyed) return;
      this.destroyed = true;

      var win = this.window;

      if (this.button.parentNode) this.button.parentNode.removeChild(this.button);
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      if (tty.terms[this.id]) delete tty.terms[this.id];
      splice(win.tabs, this);

      if (win.focused === this) {
        win.previousTab();
      }

      if (!win.tabs.length) {
        // No more tabs — close the pane if there are other panes
        if (win.pane && win.pane.parent) {
          closePane(win.pane);
        }
        // If it's the last pane, create a new tab
        else if (win.pane) {
          win.createTab();
        }
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
      if (ppc.isWin) {
        this.attachCustomKeyEventHandler(function (e) {
          if (e.ctrlKey == true && e.keyCode == 86) {
            return false;
          }
        });
      }

      // Handle space in iOS
      if (ppc.isIphone) {
        self.element.addEventListener('keydown', function (ev) {
          if (ev.charCode === 0 && ev.code === "Space") {
            self.handler(" ");
          }
        });

        self.element.addEventListener('keyup', function (ev) {
          self.element.focus();
        });
      }

      this.onData(function (data) {
        self.handler(data);
      });

      // Keyboard shortcuts for tiling
      this.attachCustomKeyEventHandler(function (key) {
        if (key.type !== 'keydown') return true;

        // Alt+D: split horizontal
        if (key.altKey && !key.shiftKey && !key.ctrlKey && key.key === 'd') {
          var pane = self.window.pane;
          if (pane) splitPane(pane, 'horizontal');
          return false;
        }

        // Alt+Shift+D: split vertical
        if (key.altKey && key.shiftKey && !key.ctrlKey && key.key === 'D') {
          var pane = self.window.pane;
          if (pane) splitPane(pane, 'vertical');
          return false;
        }

        // Alt+W: close pane
        if (key.altKey && !key.shiftKey && !key.ctrlKey && key.key === 'w') {
          var pane = self.window.pane;
          if (pane && pane.parent) closePane(pane);
          return false;
        }

        // Alt+J / Alt+K: navigate between panes
        if (key.altKey && !key.shiftKey && !key.ctrlKey) {
          if (key.key === 'j') {
            navigatePane(-1);
            return false;
          } else if (key.key === 'k') {
            navigatePane(1);
            return false;
          }
        }

        // Alt+T: new tab in current pane
        if (key.altKey && !key.shiftKey && !key.ctrlKey && key.key === 't') {
          self.window.createTab();
          return false;
        }

        // Alt+Shift+T or Alt+number to switch tabs? Keep it simple for now.

        return true;
      });
    };

    Tab.prototype.hookMouse = function () {
      var self = this;

      self.element.addEventListener('mouseup', function (ev) {
        if (ev.which == 1 && self.hasSelection()) {
          var termTextarea = self._core.textarea;

          ppc.clipboard.put(self.getSelection());
          termTextarea.value = self.getSelection();
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
        else if (ev.which == 3 && !ppc.clipboard.empty) {
          if (typeof ppc.clipboard.store === 'string') {
            self.handler(ppc.clipboard.store);
          }
        }
      }, false);

      self.element.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
      }, false);
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
          self.keyDown({keyCode: 33});
        } else {
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

      if (this.window.focused === this && this.window.pane) {
        this.window.pane.title.innerHTML = name;
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
      return (text + '').replace(/[&<>]/g, '');
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
    tty.splitPane = splitPane;
    tty.closePane = closePane;
    tty.navigatePane = navigatePane;
    tty.getAllPanes = getAllPanes;
    tty.fitAllPanes = fitAllPanes;

    this.tty = tty;

  }).call(function () {
    return this || (typeof window !== 'undefined' ? window : global);
  }());

});
