<?php
include_once(dirname(__FILE__) . "/../config.php");

class Player {
    private $mSummary = null;
    private $mGroups = null;

    public function __construct($summary = array()) {
        if (empty($summary)) {
            $summary = array(
                "id" => 0,
                "openid" => "",
                "headimgurl" => "",
                "nickname" => "",
            );
        }
        $this->mSummary = $summary;
    }

    public function id() {
        return $this->mSummary["id"];
    }

    public function openid() {
        return $this->mSummary["openid"];
    }

    public function headimgurl() {
        return $this->mSummary["headimgurl"];
    }

    public function nickname() {
        return $this->mSummary["nickname"];
    }

    public function setNickname($n) {
        $this->mSummary["nickname"] = $n;
    }

    public function setHeadimgurl($n) {
        $this->mSummary["headimgurl"] = $n;
    }

    public function setOpenid($c) {
        $this->mSummary["openid"] = $c;
    }


    public function save() {
        $id = $this->id();
        // if ($id == 0) {
        //     $id = db_player::inst()->add($this->username(), $this->password(), $this->nickname(), $this->telephone(), $this->email(), $this->mSummary["groups"], $this->comments());
        //     if ($id !== false) {
        //         $this->mSummary["id"] = $id;
        //     }
        // } else {
        //     $id = db_player::inst()->modify($id, $this->username(), $this->password(), $this->nickname(), $this->telephone(), $this->email(), $this->mSummary["groups"], $this->comments());
        // }
        return $id;
    }

    public function packInfo($pack_all_groups = true) {
        // $groupInfo = array();
        // if ($pack_all_groups) {
        //     $groups = self::cachedAllGroups();
        //     $gids = $this->gids();
        //     foreach ($groups as $gid => $group) {
        //         $groupInfo[$gid] = $group->packInfo(false);
        //         $groupInfo[$gid]["join"] = 0;
        //     }
        //     foreach ($gids as $gid) {
        //         if (isset($groups[$gid])) {
        //             $groupInfo[$gid]["join"] = 1;
        //         }
        //     }
        // } else {
        //     $groups = $this->groups();
        //     $groupInfo = array();
        //     foreach ($groups as $group) {
        //         $groupInfo []= $group->packInfo(false);
        //     }
        // }

        // return array(
        //     "id" => $this->id(),
        //     "username" => $this->username(), 
        //     "password" => $this->password(), 
        //     "nickname" => $this->nickname(), 
        //     "telephone" => $this->telephone(), 
        //     "email" => $this->email(), 
        //     "comments" => $this->comments(), 
        //     "groups" => $groupInfo
        // );
    }

    public static function create($uid) {
        $user = db_player::inst()->get($uid);
        return new Player($user);
    }

    public static function createByOpenId($openid) {
        $user = db_player::inst()->get_by_openid($openid);
        return new Player($user);

    }

    // public static function all($include_deleted = false) {
    //     $users = db_player::inst()->all();
    //     $arr = array();
    //     foreach ($users as $uid => $user) {
    //         if (!$include_deleted) {
    //             if ($user["status"] == db_player::STATUS_DELETED) {
    //                 continue;
    //             }
    //         }
    //         $arr[$uid] = new Player($user);
    //     }
    //     return $arr;
    // }

    // public static function oneByName($username) {
    //     $users = self::cachedAll();
    //     foreach ($users as $user) {
    //         if ($user->username() == $username) {
    //             return $user;
    //         }
    //     }
    //     return null;
    // }

};

