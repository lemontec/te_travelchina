<?php
include_once(dirname(__FILE__) . "/../config.php");

class Player {

    public static function playerinfo($openid, $nickname, $headimgurl) {
        $player = db_player::inst()->get_by_openid($openid);
        if ($player == null) {
            $nn = "base64:" . base64_encode($nickname);

            $pid = db_player::inst()->add($openid, $nn, $headimgurl);
            return array(
                "id" => $pid,
                "openid" => $openid,
                "nickname" => $nickname,
                "headimgurl" => $headimgurl,
                "distance" => "0",
                "current_location" => "0",
                "loc1" => 0,
                "loc2" => 0,
                "today_steps" => 0,
                "today_cities" => 1,
            );
        }
        $pid = $player["id"];
        $cl = db_move::inst()->current_location($pid);

        $nn = $player["nickname"];
        if (substr($nn, 0, 7) == "base64:") {
            $nn = base64_decode(substr($nn, 7));
            $player["nickname"] = $nn;
        }

        $player["loc1"] = $cl["loc1"];
        $player["loc2"] = $cl["loc2"];
        $player["today_steps"] = db_move::inst()->today_steps($pid);
        $player["today_cities"] = db_move::inst()->today_cities($pid);
        return $player;
    }

    public static function update($pid, $distance, $loc1, $loc2) {
        db_player::inst()->update_distance($pid, $distance);
        db_move::inst()->add($pid, $loc1, $loc2);
    }

    public static function rank() {
        return db_move::inst()->rank();
    }

    public static function selfrank($openid) {
        return db_move::inst()->selfrank($openid);
    }

    public static function rank2() {
        return db_move::inst()->rank2();
    }

    public static function selfrank2($openid) {
        return db_move::inst()->selfrank2($openid);
    }

    public static function clear($id) {
        db_player::inst()->update_distance($id, 0);
        return db_move::inst()->clear($id);
    }

    public static function totaldistance() {
        return db_move::inst()->totaldistance();
    }

    public static function has_player_info($id) {
        return db_move::inst()->has_player_info($id);
    }

    public static function save_player_info($id, $name, $phone) {
        return db_move::inst()->save_player_info($id, $name, $phone);
    }

};

