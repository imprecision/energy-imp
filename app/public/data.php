<?php

require "/var/www/private/bootstrap.php";

try {
    $set = (new EnergyImp(INVERTER_SYSTEM))->getData();
} catch (Exception $e) {
    $set = [
        "error" => $e->getMessage(),
    ];
}

header("Content-type: application/json");
echo json_encode($set, JSON_PRETTY_PRINT);
exit();
