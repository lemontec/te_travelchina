<?php

if (file_exists(dirname(__FILE__) . "/../PATH.php")) {
        include_once(dirname(__FILE__) . "/../PATH.php");
}

include_once(dirname(__FILE__) . "/../framework/config.php");

include_once(FRAMEWORK_PATH . "/helper.php");
include_once(FRAMEWORK_PATH . "/logging.php");
include_once(FRAMEWORK_PATH . "/tpl.php");
include_once(FRAMEWORK_PATH . "/database.php");
include_once(FRAMEWORK_PATH . "/cache.php");

include_once(dirname(__FILE__) . "/database/db_player.class.php");
include_once(dirname(__FILE__) . "/database/db_move.class.php");
include_once(dirname(__FILE__) . "/app/player.class.php");
include_once(dirname(__FILE__) . "/app/certificate.php");

include_once(dirname(__FILE__) . "/libs/Lock.php");
include_once(dirname(__FILE__) . "/libs/WeChat.php");

// database
defined('MYSQL_SERVER') or define('MYSQL_SERVER', 'localhost');
defined('MYSQL_USERNAME') or define('MYSQL_USERNAME', '');
defined('MYSQL_PASSWORD') or define('MYSQL_PASSWORD', '');
defined('MYSQL_DATABASE') or define('MYSQL_DATABASE', '');
defined('MYSQL_PREFIX') or define('MYSQL_PREFIX', '');

