<a:menu id="mnuContentEditable" editable="false" nomk="true">
    <a:item hotkey="Ctrl-Z" disabled="{!ppc.window.undoManager.undolength}" onclick="ppc.document.execCommand('undo')">Undo</a:item>
    <a:item hotkey="Ctrl-Y" disabled="{!ppc.window.undoManager.redolength}" onclick="ppc.document.execCommand('redo')">Redo</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-X" onclick="ppc.document.execCommand('cut')">Cut</a:item>
    <a:item hotkey="Ctrl-C" onclick="ppc.document.execCommand('copy')">Copy</a:item>
    <a:item hotkey="Ctrl-V" onclick="ppc.document.execCommand('paste')">Paste</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-D" onclick="ppc.document.execCommand('duplicate')">Duplicate</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-2" onclick="ppc.document.execCommand('lock')">Lock</a:item>
    <a:item hotkey="Del" onclick="ppc.document.execCommand('remove')">Remove</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-Q" onclick="
      var s = ppc.document.getSelection();
      var p = s.$getFirstNode().parentNode;
      if (p &amp;&amp; p.focus) p.focus();
    ">
        Select Parent
    </a:item>
    <a:item hotkey="Ctrl-A" onclick="
      var s = ppc.document.getSelection();
      var n = s.$getFirstNode().parentNode.childNodes;
      var c = [];
      for (var i = 0; i &lt; n.length; i++) {
        if (n[i].editable &amp;&amp; n[i].$ext) 
            c.push(n[i]);
      }
      if (c.length)
        s.$selectList(c);
    ">
        Select All
    </a:item>
    <a:divider />
    <a:item hotkey="Shift-Q" onclick="">Ungroup</a:item>
</a:menu>