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

    public function show_action() {
        if (!isset($_SESSION["OAUTH"])) {
            header("Location: //www.xiaoningmengkeji.com/OAuthDispatcher/index.php?id=te.travelchina&userinfo=1");
            exit();
        }

        $userinfo = $_SESSION["OAUTH"];
        $sp = WeChat::inst()->get_SignPackage();
        logging::d("JS-SDK", $sp);

        $player = Player::playerinfo($userinfo["openid"], $userinfo["nickname"], $userinfo["headimgurl"]);
        $_SESSION["current.player"] = $player;

        $tpl = new tpl();

        // for business
        $tpl->set("headimgurl", $userinfo["headimgurl"]);
        $tpl->set("nickname", $userinfo["nickname"]);
        $tpl->set("cityindex", $player["loc1"]);
        $tpl->set("steps_2_lastcity", $player["loc2"]);
        $tpl->set("today_steps", $player["today_steps"]);
        $tpl->set("today_arrived_city", ($player["today_cities"] <= 1 ? 0 : 1));
        $tpl->set("distance", $player["distance"]);

        // for js-sdk
        $tpl->set("appid", $sp["appid"]);
        $tpl->set("timestamp", $sp["timestamp"]);
        $tpl->set("noncestr", $sp["noncestr"]);
        $tpl->set("signature", $sp["signature"]);

        $tpl->display("index2");

    }

    public function oauth_action() {
        $userinfo = get_request("userinfo", null);
        $fn = get_request("fn", null);

        if ($userinfo != null) {
            logging::d("OAuth-1", $userinfo);
            $userinfo = json_decode($userinfo, true);
            $openid = $userinfo["openid"];
            // $userinfo = WeChat::inst()->get_user_info($openid);
            logging::d("OAuth", $userinfo);
        } else if ($fn != null) {
            logging::d("OAuth", "fn: $fn");
            $url = "http://www.xiaoningmengkeji.com/OAuthDispatcher/query.php?fn=$fn";
            $userinfo = read_url($url);
            logging::d("OAuth", "userinfo = $userinfo");
            $userinfo = json_decode($userinfo, true);
        }

        $_SESSION["OAUTH"] = $userinfo;
        header("Location: /index.php?action=index.show");
        die("");

        $sp = WeChat::inst()->get_SignPackage();
        logging::d("JS-SDK", $sp);

        $player = Player::playerinfo($userinfo["openid"], $userinfo["nickname"], $userinfo["headimgurl"]);
        $_SESSION["current.player"] = $player;

        $tpl = new tpl();

        // for business
        $tpl->set("headimgurl", $userinfo["headimgurl"]);
        $tpl->set("nickname", $userinfo["nickname"]);
        $tpl->set("cityindex", $player["loc1"]);
        $tpl->set("steps_2_lastcity", $player["loc2"]);
        $tpl->set("today_steps", $player["today_steps"]);
        $tpl->set("today_arrived_city", ($player["today_cities"] <= 1 ? 0 : 1));
        $tpl->set("distance", $player["distance"]);

        // for js-sdk
        $tpl->set("appid", $sp["appid"]);
        $tpl->set("timestamp", $sp["timestamp"]);
        $tpl->set("noncestr", $sp["noncestr"]);
        $tpl->set("signature", $sp["signature"]);

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
            $nn = $rank[$k]["nickname"];
            if (substr($nn, 0, 7) == "base64:") {
                $nn = base64_decode(substr($nn, 7));
                $rank[$k]["nickname"] = $nn;
            }
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

            $nn = $selfrank["nickname"];
            if (substr($nn, 0, 7) == "base64:") {
                $nn = base64_decode(substr($nn, 7));
                $selfrank["nickname"] = $nn;
            }


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
            $nn = $rank[$k]["nickname"];
            if (substr($nn, 0, 7) == "base64:") {
                $nn = base64_decode(substr($nn, 7));
                $rank[$k]["nickname"] = $nn;
            }

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

            $nn = $selfrank["nickname"];
            if (substr($nn, 0, 7) == "base64:") {
                $nn = base64_decode(substr($nn, 7));
                $selfrank["nickname"] = $nn;
            }

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
        logging::d("--dist", $dist);
        return array('dist' => $dist);
    }

    public function hasplayerinfo_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return $this->index_action();
        }
        $id = $player["id"];
        $ret = Player::has_player_info($id);
        return array('ret' => ($ret ? 1 : 0));
    }

    public function saveplayerinfo_action() {
        $name = get_request_assert("realname");
        $phone = get_request_assert("telephone");

        $player = get_session("current.player");
        if ($player == null) {
            return $this->index_action();
        }
        $id = $player["id"];
        Player::save_player_info($id, $name, $phone);
        return array('ret' => 1);
    }


    public function certificate_action() {
        $player = get_session("current.player");
        if ($player == null) {
            return $this->index_action();
        }
        $name = $player["nickname"];
        create_certificate($name);
        return "";
    }
};



