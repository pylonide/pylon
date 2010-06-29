<?php
$succ = false;
if (array_key_exists("Filedata", $_FILES)) {
    echo "Attempting to move " . $_FILES["Filedata"]["tmp_name"] . " to ./" . $_FILES["Filedata"]["name"] . "\n";
    if (move_uploaded_file($_FILES["Filedata"]["tmp_name"], "./".$_FILES["Filedata"]["name"]))
        $succ = true;
}
header("HTTP/1.0 " . (!$succ ? "500 Internal Server Error" : "200 Success"));