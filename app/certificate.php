<?php

include_once(dirname(__FILE__) . "/../config.php");

function filterEmoji($str)  
{  
    $str = preg_replace_callback('/./u', function (array $match) {
        return strlen($match[0]) >= 4 ? '' : $match[0];  
    }, $str);
    return $str;
} 

function create_certificate($name) {
    $name = filterEmoji($name);

    $fontfile = dirname(__FILE__) . "/../font/SourceHanSansCN-Regular.otf";

    $img = imagecreatefrompng(dirname(__FILE__) . "/../img/certificate1.png");

    $imagewidth = imagesx($img);

    $fontsize = 25;
    while (true) {
        if ($fontsize <= 0) {
            imagedestroy($img);
            return;
        }
        $box = imageftbbox($fontsize, 0, $fontfile, $name);
        logging::d("Certificate", "font size = $fontsize");
        logging::d("Certificate", $box);
        if ($box[2] - $box[0] < $imagewidth) {
            break;
        }
        $fontsize--;
    }

    $textwidth = $box[2] - $box[0];
    $cx = ($imagewidth - $textwidth) / 2;

    $color = imagecolorexact($img, 137, 137, 137);
    imagefttext($img, $fontsize, 0, $cx, 300, $color, $fontfile, $name);

    header("Content-Type: image/png");
    imagepng($img);
    imagedestroy($img);
}


