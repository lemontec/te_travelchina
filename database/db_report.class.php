<?php

include_once(dirname(__FILE__) . "/../config.php");

class db_report extends database {

    private static $instance = null;
    public static function inst() {
        if (self::$instance == null)
            self::$instance = new db_report();
        return self::$instance;
    }

    private function db_report() {
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

    public function get_sales($begintime, $endtime) {
        $begintime = (int)$begintime;
        $endtime = (int)$endtime;

        $detail = db_productorderrecord::inst()->table_name();
        $summary = db_productorder::inst()->table_name();
        $product = db_product::inst()->table_name();

        $sql = "SELECT product.*, t.count, t.largess, t.totalprice
            FROM 
            (
                SELECT detail.productid, sum(detail.count) count, sum(detail.largess) largess, sum(detail.finalprice * detail.count) totalprice, summary.status, summary.type
                FROM
                $detail detail
                LEFT JOIN (
                    SELECT * FROM $summary
                ) summary
                on summary.id = detail.orderid
                where summary.status = 2 and summary.type < 0 and summary.type <> -4 AND summary.ensuretime >= $begintime AND summary.ensuretime <= $endtime
                group by detail.productid
            ) t
            LEFT JOIN (
                SELECT * FROM $product
            ) product
            on t.productid = product.id
            ORDER BY count DESC";
        return $this->doQuery($sql);
    }


    public function get_storage($pid) {
        $pid = (int)$pid;
        $table_summary = db_productorder::inst()->table_name();
        $table_detail = db_productorderrecord::inst()->table_name();

        $sql = "select a.productid,
                sum(if(b.type>0, a.count, a.count*(-1))) count
                from (
                    select orderid,productid, (count+largess) count from $table_detail where productid = $pid
                ) a left join (
                    select id, type, status from $table_summary
                ) b 
                on a.orderid=b.id where b.status = 2";
        return $this->doQuery($sql);

    }

    public function get_all_storages() {
        $table_summary = db_productorder::inst()->table_name();
        $table_detail = db_productorderrecord::inst()->table_name();
        $table_product = db_product::inst()->table_name();
        $table_category = db_category::inst()->table_name();

        $sql = "select b.*, categories.name categoryname from (
            select a.count, products.* 
            from (
                select detail.productid,
                sum(if(summary.type>0, detail.count, detail.count*(-1))) count
                from (
                    select orderid,productid, (count+largess) count from $table_detail 
                ) detail left join (
                    select id, type,status from $table_summary
                ) summary
                on detail.orderid=summary.id
                where summary.status = 2
                group by productid
            ) a
            left join $table_product products
            on a.productid=products.id
        )b left join $table_category categories
        on b.category = categories.id";

        return $this->doQuery($sql);
    }

    public function get_all_customer_sales($begin, $end) {
        $begin = (int)$begin;
        $end = (int)$end;

        $table_customer = db_customer::inst()->table_name();
        $table_summary = db_productorder::inst()->table_name();
        $table_detail = db_productorderrecord::inst()->table_name();


        /*
        $sql = "SELECT c.*, round(t.totalprice, 2) totalprice, t.count, t.largess 
            from 
            $table_customer c 
            LEFT JOIN (
                SELECT a.customer,sum(a.totalprice) totalprice, sum(b.count) count, sum(b.largess) largess 
                FROM 
                $table_summary a 
                LEFT JOIN (
                    SELECT orderid, sum(count) count, sum(largess) largess from $table_detail group by orderid
                ) b
                on a.id=b.orderid
                where a.status=2 and a.type=-2 and ensuretime >= $begin and ensuretime <= $end
                group by a.customer
            ) t
            on c.id=t.customer ORDER BY t.count DESC";
        */

        $sql = "SELECT cus.*, summary.* from
            (
                SELECT a.customer,sum(a.totalprice) totalprice, sum(b.count) count, sum(b.largess) largess 
                FROM 
                $table_summary a 
                LEFT JOIN (
                    SELECT orderid, sum(count) count, sum(largess) largess from $table_detail group by orderid
                ) b
                on a.id=b.orderid
                where a.status=2 and (a.type < 0 and a.type <> -4) and ensuretime >= $begin and ensuretime <= $end
                group by a.customer
            ) summary LEFT JOIN (
                select * from $table_customer
            ) cus
            on summary.customer = cus.id
            order by summary.count DESC";

        return $this->doQuery($sql);
    }

};


