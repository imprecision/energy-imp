<?php

/**
 * The EnergyImp class
 *
 * @package EnergyImp
 * @version 1.0.0
 */
class EnergyImp
{
    /**
     * List of supported inverter systems and their respective classes
     * 
     * To add support for another inverter, add an entry here with a user-friendly name as the *key*
     * and create a new class file in the same directory using the *value* as the (partial) file and class name.
     * 
     * Any user specific attributes for the class should be defined in config.php INVERTER_SYSTEM constant.
     *
     * @const array
     */
    const INVERTER_SYSTEMS_SUPPORTED = [
        "Fronius Symo GEN24 10.0 Plus" => "FroniusSymoGen24100Plus",
    ];

    /**
     * Inverter class name template
     *
     * @const string
     */
    const INVERTER_CLASS_NAME_TEMPLATE = "EnergyImp.%s.class.php";

    /**
     * Inverter object
     *
     * @var object|null
     */
    protected ?object $inverter = null;

    /**
     * Set the inverter system configuration
     *
     * @param array $inverterSystem
     */
    public function __construct(array $inverterSystem)
    {
        if (isset($inverterSystem["MODEL"])) {
            if (isset(self::INVERTER_SYSTEMS_SUPPORTED[$inverterSystem["MODEL"]])) {
                include sprintf(self::INVERTER_CLASS_NAME_TEMPLATE, self::INVERTER_SYSTEMS_SUPPORTED[$inverterSystem["MODEL"]]);
                $this->inverter = new (self::INVERTER_SYSTEMS_SUPPORTED[$inverterSystem["MODEL"]])($inverterSystem);
            } else {
                throw new Exception("Inverter model not supported");
            }
        } else {
            throw new Exception("Inverter model not defined");
        }
    }

    /**
     * Get the data from the inverter
     *
     * @return array
     */
    public function getData(): array
    {
        return array_merge(
            [
                "ts" => time(),
                "model" => INVERTER_SYSTEM["MODEL"],
            ],
            $this->inverter->getData(),
        );
    }
}
