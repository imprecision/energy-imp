<?php
/**
 * Example configuration file for EnergyImp
 * 
 * Copy this file to config.php and edit the values to match your system
 * 
 */

/**
 * The maximum generating capacity of your system in Watts
 *
 * Watts - Maximum generation (ouput) capacity of system
 * Recommend value near real-world max generation capacity in watts
 * (i.e. not necessarily your systems rated max but usually a bit lower)
 */

define("MAX_GEN_CAPACITY_W", 8000);

/**
 * Your inverter system configuration
 * 
 * MODEL: The model of your inverter (this must match a supported model)
 * IP: The IP address of your Fronius Symo Inverter - set this to your inverter's IP address
 */

define(
    "INVERTER_SYSTEM", [
        "MODEL" => "Fronius Symo GEN24 10.0 Plus", // Your inverter's model (currently only Fronius Symo supported, see EnergyImp::INVERTER_SYSTEMS_SUPPORTED)
        "IP" => "192.168.0.123", // <--- SET THIS! To your inverter's IP address (i.e. the address it has on your local network)
    ]
);

/**
 * The frequency at which the client will make a request to the server
 * for updated data, in seconds.
 * 
 * Default: 5s (recommended, you could go lower but be aware of the load on your inverter's "server")
 */

define("UPDATE_FREQUENCY_S", 5);
