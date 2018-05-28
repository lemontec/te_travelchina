<?php
include_once(dirname(__FILE__) . "/WeChat.php");


$wx = WeChat::inst();
$users = $wx->get_all_users();

print_r($users);

$ret = $wx->get_user_info($users);
print_r($ret);

