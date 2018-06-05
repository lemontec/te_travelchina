<?php

include_once(dirname(__FILE__) . "/../config.php");

class index_controller {
    public function index_action() {
        header("Location: //www.xiaoningmengkeji.com/OAuthDispatcher/index.php?id=te.travelchina&userinfo=1");
        exit();
        // $tpl = new tpl();
        // $tpl->set("userinfo", $userinfo);
        // $tpl->display("index2");
    }

    public function oauth_action() {
        $userinfo = get_request_assert("userinfo");
        logging::d("OAuth-1", $userinfo);
        $userinfo = json_decode($userinfo, true);
        $openid = $userinfo["openid"];
        // $userinfo = WeChat::inst()->get_user_info($openid);
        logging::d("OAuth", $userinfo);

        $player = Player::playerinfo($userinfo["openid"], $userinfo["nickname"], $userinfo["headimgurl"]);
        $_SESSION["current.player"] = $player;

        $tpl = new tpl();
        $tpl->set("headimgurl", $userinfo["headimgurl"]);
        $tpl->set("nickname", $userinfo["nickname"]);
        $tpl->set("cityindex", $player["loc1"]);
        $tpl->set("steps_2_lastcity", $player["loc2"]);
        $tpl->set("today_steps", $player["today_steps"]);
        $tpl->set("today_arrived_city", ($player["today_cities"] <= 1 ? 0 : 1));
        $tpl->set("distance", $player["distance"]);
        $tpl->display("index2");
    }

    public function demo_action() {
        $demo = get_request("player", "demoid");
        $player = Player::playerinfo($demo, "nick", "/te/travelchina/img/wx_icon.jpg");
        $_SESSION["current.player"] = $player;

        $tpl = new tpl();
        $tpl->set("headimgurl", $player["headimgurl"]);
        $tpl->set("nickname", $player["nickname"]);
        $tpl->set("cityindex", $player["loc1"]);
        $tpl->set("steps_2_lastcity", $player["loc2"]);
        $tpl->set("today_steps", $player["today_steps"]);
        $tpl->set("today_arrived_city", ($player["today_cities"] <= 1 ? 0 : 1));
        $tpl->set("distance", $player["distance"]);
        $tpl->display("index2");
    }

    public function move_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return $this->index_action();
        }
        $loc1 = get_request_assert("loc1");
        $loc2 = get_request_assert("loc2");
        $distance = get_request_assert("distance");
        Player::update($player["id"], $distance, $loc1, $loc2);

        $player = Player::playerinfo($player["openid"], $player["nickname"], $player["headimgurl"]);
        $_SESSION["current.player"] = $player;

        $player["cityindex"] = $player["loc1"];
        $player["steps_2_lastcity"] = $player["loc2"];
        $player["today_arrived_city"] = ($player["today_cities"] <= 1 ? 0 : 1);
 
        return $player;
    }

    public function rank_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return "fail: need login";
        }
        $openid = $player["openid"];
        // $openid = "ojLZa0qymX-Eo2FZSvdY03MVVt5E";

        $rank = Player::rank();
        $head10 = false;
        foreach ($rank as $k => $p) {
            if ($p["openid"] == $openid) {
                $rank[$k]["self"] = 1;
                $head10 = true;
            } else {
                $rank[$k]["self"] = 0;
            }
            $rank[$k]["date"] = Date("m-d", $rank[$k]["time"]);
        }
        if (!$head10) {
            $selfrank = Player::selfrank($openid);
            if (empty($selfrank)) {
                $selfrank = array(
                    "rank" => "-1",
                    "nickname" => $player["nickname"],
                    "headimgurl" => $player["headimgurl"],
                    "loc1" => 0,
                    "loc2" => 0,
                    "distance" => "0",
                    "time" => 0,
                    "date" => Date("m-d"),
                );
            } else {
                $selfrank["date"] = Date("m-d", $selfrank["time"]);
            }
            $selfrank["self"] = 1;
            array_pop($rank);
            $rank [] = $selfrank;
        }
        return $rank;
    }

    public function rank2_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return "fail: need login";
        }
        $openid = $player["openid"];
        // $openid = "ojLZa0qymX-Eo2FZSvdY03MVVt5E";

        $rank = Player::rank2();
        $head10 = false;
        foreach ($rank as $k => $p) {
            if ($p["openid"] == $openid) {
                $rank[$k]["self"] = 1;
                $head10 = true;
            } else {
                $rank[$k]["self"] = 0;
            }
            $rank[$k]["date"] = Date("m-d", $rank[$k]["time"]);
        }
        if (!$head10) {
            $selfrank = Player::selfrank2($openid);
            if (empty($selfrank)) {
                $selfrank = array(
                    "rank" => "-1",
                    "nickname" => $player["nickname"],
                    "headimgurl" => $player["headimgurl"],
                    "loc1" => 0,
                    "loc2" => 0,
                    "distance" => "0",
                    "time" => 0,
                    "date" => Date("m-d"),
                );
            } else {
                $selfrank["date"] = Date("m-d", $selfrank["time"]);
            }
            $selfrank["self"] = 1;
            array_pop($rank);
            $rank [] = $selfrank;
        }
        return $rank;
    }



    public function reset_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return $this->index_action();
        }
        $id = $player["id"];
        Player::clear($id);
        return $player;
    }

    public function totaldistance_action() {
        $dist = Player::totaldistance();
        return $dist;
    }

};



