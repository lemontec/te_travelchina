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
};


