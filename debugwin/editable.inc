<a:menu id="mnuContentEditable" editable="false" nomk="true">
    <a:item hotkey="Ctrl-Z" disabled="{!apf.window.undoManager.undolength}" onclick="apf.document.execCommand('undo')">Undo</a:item>
    <a:item hotkey="Ctrl-Y" disabled="{!apf.window.undoManager.redolength}" onclick="apf.document.execCommand('redo')">Redo</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-X" onclick="apf.document.execCommand('cut')">Cut</a:item>
    <a:item hotkey="Ctrl-C" onclick="apf.document.execCommand('copy')">Copy</a:item>
    <a:item hotkey="Ctrl-V" onclick="apf.document.execCommand('paste')">Paste</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-D" onclick="apf.document.execCommand('duplicate')">Duplicate</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-2" onclick="apf.document.execCommand('lock')">Lock</a:item>
    <a:item hotkey="Del" onclick="apf.document.execCommand('remove')">Remove</a:item>
    <a:divider />
    <a:item hotkey="Ctrl-Q" onclick="apf.ContentEditable2.resize.grab(apf.ContentEditable2.resize.getSelection()[0].parentNode);">
        Select Parent
    </a:item>
    <a:item hotkey="Ctrl-A" onclick="apf.ContentEditable2.resize.grabList(apf.config.selection[0].parentNode.getElementsByTagNameNS(apf.ns.aml, '*', true));">
        Select All
    </a:item>
    <a:divider />
    <a:item hotkey="Shift-Q" onclick="">Ungroup</a:item>
</a:menu>