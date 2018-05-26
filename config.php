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

// include_once(dirname(__FILE__) . "/database/db_category.class.php");
// include_once(dirname(__FILE__) . "/database/db_material.class.php");
// include_once(dirname(__FILE__) . "/database/db_salesman.class.php");
// include_once(dirname(__FILE__) . "/database/db_customer.class.php");
// include_once(dirname(__FILE__) . "/database/db_product.class.php");
// include_once(dirname(__FILE__) . "/database/db_user.class.php");
// include_once(dirname(__FILE__) . "/database/db_depot.class.php");
// include_once(dirname(__FILE__) . "/database/db_productorder.class.php");
// include_once(dirname(__FILE__) . "/database/db_productorderrecord.class.php");
// include_once(dirname(__FILE__) . "/database/db_materialorder.class.php");
// include_once(dirname(__FILE__) . "/database/db_materialorderrecord.class.php");
// include_once(dirname(__FILE__) . "/database/db_vendor.class.php");
// include_once(dirname(__FILE__) . "/database/db_group.class.php");
// include_once(dirname(__FILE__) . "/database/db_setting.class.php");
// include_once(dirname(__FILE__) . "/database/db_wechatuser.class.php");
// include_once(dirname(__FILE__) . "/database/db_price.class.php");
// include_once(dirname(__FILE__) . "/database/db_notice.class.php");
// include_once(dirname(__FILE__) . "/database/db_wechatadmin.class.php");
// 
// include_once(dirname(__FILE__) . "/app/category.class.php");
// include_once(dirname(__FILE__) . "/app/customer.class.php");
// include_once(dirname(__FILE__) . "/app/depot.class.php");
// include_once(dirname(__FILE__) . "/app/group.class.php");
// include_once(dirname(__FILE__) . "/app/material.class.php");
// include_once(dirname(__FILE__) . "/app/materialorder.class.php");
// include_once(dirname(__FILE__) . "/app/materialorderrecord.class.php");
// include_once(dirname(__FILE__) . "/app/permission.class.php");
// include_once(dirname(__FILE__) . "/app/product.class.php");
// include_once(dirname(__FILE__) . "/app/productorder.class.php");
// include_once(dirname(__FILE__) . "/app/productorderrecord.class.php");
// include_once(dirname(__FILE__) . "/app/salesman.class.php");
// include_once(dirname(__FILE__) . "/app/setting.class.php");
// include_once(dirname(__FILE__) . "/app/user.class.php");
// include_once(dirname(__FILE__) . "/app/vendor.class.php");
// include_once(dirname(__FILE__) . "/app/wechatuser.class.php");
// include_once(dirname(__FILE__) . "/app/price.class.php");
// include_once(dirname(__FILE__) . "/app/notice.class.php");
// include_once(dirname(__FILE__) . "/app/wechatadmin.class.php");
// include_once(dirname(__FILE__) . "/app/login.class.php");
// 
// include_once(dirname(__FILE__) . "/libs/Lock.php");
// include_once(dirname(__FILE__) . "/libs/WeChat.php");

// database
// defined('MYSQL_SERVER') or define('MYSQL_SERVER', 'localhost');
// defined('MYSQL_USERNAME') or define('MYSQL_USERNAME', 'jworder');
// defined('MYSQL_PASSWORD') or define('MYSQL_PASSWORD', 'jworder');
// defined('MYSQL_DATABASE') or define('MYSQL_DATABASE', 'jworder');
// defined('MYSQL_PREFIX') or define('MYSQL_PREFIX', 'jw_');
//
// defined("TEMP_PATH") or define("TEMP_PATH", APP_PATH . "/temp/");
// defined("ALLOW_ROOT") or define("ALLOW_ROOT", false);
//
