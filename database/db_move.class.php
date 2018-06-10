<?php

include_once(dirname(__FILE__) . "/../config.php");

class db_move extends database {
    const STATUS_NORMAL = 0;
    const STATUS_DELETED = 1;
    const STATUS_LEAVE = 2;

    private static $instance = null;
    public static function inst() {
        if (self::$instance == null)
            self::$instance = new db_move();
        return self::$instance;
    }

    public function __construct() {
        // parent::__construct(MYSQL_DATABASE, MYSQL_PREFIX . "moves");
        $this->init(MYSQL_DATABASE);
    }

    private function doQuery($sql) {
        $result = $this->query($sql);
        $resArray = array();
        if ($result !== false) {
            while ($tmpArray = $result->fetch(PDO::FETCH_ASSOC)) {
                $tmpArray = $this->do_unescape($tmpArray);
                if (isset($tmpArray["id"]))
                    $resArray[$tmpArray["id"]] = $tmpArray;
                else
                    $resArray[] = $tmpArray;
            }
        }
        return $resArray;
    }


    public function current_location($playerid) {
        $playerid = (int)$playerid;
        $sql = "SELECT * FROM `moves` WHERE player = $playerid ORDER BY id DESC LIMIT 1";
        $res = $this->doQuery($sql);
        if (empty($res)) {
            return array("loc1" => 0, "loc2" => 0);
        }
        return array_shift($res);
    }

    public function today_steps($playerid) {
        $playerid = (int)$playerid;
        $today = strtotime(date("Y-m-d 00:00:00"), time());
        $sql = "SELECT count(*)count FROM `moves` WHERE player = $playerid AND time >= $today";
        $res = $this->doQuery($sql);
        if (empty($res)) {
            return 0;
        }
        $head = array_shift($res);
        return $head["count"];
    }

    public function today_cities($playerid) {
        $playerid = (int)$playerid;
        $today = strtotime(date("Y-m-d 00:00:00"), time());
        $sql = "SELECT count(*), loc1 FROM `moves` WHERE player = $playerid AND time >= $today GROUP BY loc1";
        $res = $this->doQuery($sql);
        return count($res);
    }

    public function add($player, $loc1, $loc2) {
        $player = (int)$player;
        $loc1 = (int)$loc1;
        $loc2 = (int)$loc2;
        return $this->insert("moves", array(
            "player" => $player,
            "loc1" => $loc1,
            "loc2" => $loc2,
            "time" => time(),
        ));
    }

    public function rank() {
        $sql = "SELECT @rownum:=@rownum+1 as rank, a.* from (
            SELECT player,loc1,loc2,time,openid,nickname,headimgurl,distance from moves m 
            LEFT JOIN players p 
            on m.player = p.id
            where m.id in (
                SELECT max(id) from moves group by player
            )
        ) a, (select @rownum:=0) t 
        where a.openid is not null AND loc1 = 14
        order by loc1 desc, loc2 desc, time LIMIT 10";
        return $this->doQuery($sql);
    }

    public function rank2() {
        $sql = "SELECT @rownum:=@rownum+1 as rank, a.* from (
            SELECT player,loc1,loc2,time,openid,nickname,headimgurl,distance from moves m 
            LEFT JOIN players p 
            on m.player = p.id
            where m.id in (
                SELECT max(id) from moves group by player
            )
        ) a, (select @rownum:=0) t 
        where a.openid is not null AND loc1 <> 14
        order by loc1 desc, loc2 desc, time LIMIT 10";
        return $this->doQuery($sql);

    }

    public function selfrank($openid) {
        $openid = $this->escape($openid);
        $sql = "SELECT * from (
            SELECT @rownum:=@rownum+1 as rank, a.* from (
                SELECT m.player,m.loc1,m.loc2,m.time, p.nickname, p.openid, p.headimgurl, p.distance
                from moves m
                left JOIN players p
                on m.player=p.id
                where m.id in (SELECT max(id) from moves group by player)
                order by m.loc1 desc, m.loc2 desc,m.time
            ) a, (SELECT @rownum:=0) t
            where a.openid is not null
        ) aa 
        where aa.openid=$openid";
        $rank = $this->doQuery($sql);
        if (empty($rank)) {
            return $rank;
        }
        return array_shift($rank);
    }

    public function selfrank2($openid) {
        $openid = $this->escape($openid);
        $sql = "SELECT * from (
            SELECT @rownum:=@rownum+1 as rank, a.* from (
                SELECT m.player,m.loc1,m.loc2,m.time, p.nickname, p.openid, p.headimgurl, p.distance
                from moves m
                left JOIN players p
                on m.player=p.id
                where m.id in (SELECT max(id) from moves group by player) AND m.loc1 <> 14
                order by m.loc1 desc, m.loc2 desc,m.time
            ) a, (SELECT @rownum:=0) t
            where a.openid is not null
        ) aa 
        where aa.openid=$openid";
        $rank = $this->doQuery($sql);
        if (empty($rank)) {
            return $rank;
        }
        return array_shift($rank);
    }

    public function clear($id) {
        $id = (int)$id;
        return $this->delete("moves", "player = $id");
    }

    public function totaldistance() {
        $sql = "SELECT sum(distance) dist FROM players";
        $res = $this->doQuery($sql);
        $res = array_shift($res);
        $dist = $res["dist"];
        return $dist;
    }

    public function save_player_info($id, $realname, $telephone) {
        $id = (int)$id;
        return $this->insert("players_info", array(
            "player" => $id,
            "realname" => $realname,
            "telephone" => $telephone
        ));
    }

    public function has_player_info($id) {
        $id = (int)$id;
        if ($id == 0) {
            return true;
        }
        $sql = "SELECT * FROM players_info WHERE player = $id";
        $res = $this->doQuery($sql);
        return !empty($res);
    }
};


