<?php
include_once(dirname(__FILE__) . "/../config.php");

class Player {

    public static function playerinfo($openid, $nickname, $headimgurl) {
        $player = db_player::inst()->get_by_openid($openid);
        if ($player == null) {
            $pid = db_player::inst()->add($openid, $nickname, $headimgurl);
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
};

