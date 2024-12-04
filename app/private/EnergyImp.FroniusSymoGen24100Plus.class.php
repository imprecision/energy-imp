<?php

/**
 * The Fronius Symo GEN24 10.0 Plus inverter class
 * 
 * (Use this as a template to create support for other inverters)
 *
 * @package EnergyImp
 * @version 1.0.0
 */
class FroniusSymoGen24100Plus
{
    /**
     * Configuration options
     *
     * @var array|null
     */
    protected ?array $config = null;

    /**
     * Constructor, sets config on initialisation
     *
     * @param array $config
     */
    public function __construct(array $config)
    {
        $this->config = $config;
    }

    /**
     * Get the data from the Fronius Symo GEN24 10.0 Plus inverter
     *
     * @return array
     */
    public function getData(): array
    {
        $url_template = "http://%s/status/powerflow";
        $json = file_get_contents(sprintf($url_template, $this->config["IP"]));
        $data = json_decode($json, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $set = [
                "kwh_total_generated_ever" => $data["site"]["E_Total"], // total ever
                "w_current_made" => $data["site"]["P_PV"], // being generated
                "w_current_grid" => $data["site"]["P_Grid"], // to grid (negative - being sent to grid, positive - being drawn from grid)
                "w_current_used" => $data["site"]["P_Load"], // being used
                "w_battery" => $data["site"]["P_Akku"], // being used
                "w_max_factor" => MAX_GEN_CAPACITY_W, // factor to calc the bar charts percentages with - recommend value near real-world max generation capacity in watts
                "w_max_factor_battery" => MAX_BAT_CAPACITY_W, 
                "original" => $data, // not required but can be useful for debugging on client side
            ];
        } else {
            $set = [
                "error" => "Unable to decode JSON from inverter",
                "json_last_error" => json_last_error(),
                "json_last_error_msg" => json_last_error_msg(),
                "json" => $json,
            ];
        }
        return $set;
    }
}
