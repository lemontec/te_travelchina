<?php

include_once(dirname(__FILE__) . "/../config.php");

class index_controller {
    public function index_action() {
        $tpl = new tpl();
        $tpl->display("index2");
    }

    public function test_action() {
        return array("abc" => 123);
    }
};

