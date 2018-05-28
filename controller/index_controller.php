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
        logging::d("OAuth", $userinfo);

        // $player = Player::createByOpenId($userinfo["openid"]);
        // dump_var($userinfo);
        $tpl = new tpl();
        $tpl->set("headimgurl", $userinfo["headimgurl"]);
        // $tpl->set("player", $player);
        $tpl->display("index2");
    }

    public function demo_action() {
        $tpl = new tpl();
        $tpl->set("headimgurl", "/te/travelchina/img/wx_icon.jpg");
        $tpl->display("index2");
    }
};

