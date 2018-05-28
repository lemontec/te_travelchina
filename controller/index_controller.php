<?php

include_once(dirname(__FILE__) . "/../config.php");

class index_controller {
    public function index_action() {
        header("Location: //www.xiaoningmengkeji.com/OAuthDispatcher/index.php?id=te.travelchina&userinfo=0");
        exit();
        // $tpl = new tpl();
        // $tpl->set("userinfo", $userinfo);
        // $tpl->display("index2");
    }

    public function oauth_action() {
        $userinfo = get_request_assert("userinfo");
        $userinfo = json_decode($userinfo, true);
        $openid = $userinfo["openid"];
        $userinfo = WeChat::inst()->get_user_info($openid);
        dump_var($userinfo);
    }
};

