<?php

include_once(dirname(__FILE__) . "/../config.php");

class db_player extends database_table {
    const STATUS_NORMAL = 0;
    const STATUS_DELETED = 1;
    const STATUS_LEAVE = 2;

    private static $instance = null;
    public static function inst() {
        if (self::$instance == null)
            self::$instance = new db_player();
        return self::$instance;
    }

    public function __construct() {
        parent::__construct(MYSQL_DATABASE, MYSQL_PREFIX . "players");
    }

    public function get($id) {
        $id = (int)$id;
        return $this->get_one("id = $id");
    }

    public function all() {
        return $this->get_all();
    }

    public function get_by_openid($openid) {
        $openid = $this->escape($openid);
        return $this->get_one("openid = $openid");
    }

    public function add($openid, $nickname, $headimgurl) {
        return $this->insert(array(
            "openid" => $openid,
            "nickname" => $nickname,
            "headimgurl" => $headimgurl,
            "distance" => 0,
        ));
    }

    public function update_distance($id, $distance) {
        $id = (int)$id;
        $distance = (int)$distance;
        return $this->update(array(
            "distance" => $distance
        ), "id = $id");
    }

};


