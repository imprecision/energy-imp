"use strict";

/**
 * Other settings (best to leave everything below as it is)
 */

const UPDATE_URL = "/data.json";
const THOUSAND_CHAR = "";
const ANIMSPEED_MS = 1000;
const UPDATE_FREQ_S = 5;
const DECIMAL_PLACES = 0;

let histMade = [];
let histUsed = [];
let histGrid = [];
let histBatt = [];

/**
 * smooth
 *
 * data array List of data points
 * item float New data point to add
 * back integer How many previous data points to use to smooth the new item (+1 including new item, eg back=4 then range used is 4+1 = 5)
 *
 * return array New list of data points
 */
function smooth(data, item, back = 2) {
    let maxListLength = 500; // Max number of data points in a list

    item = parseFloat(item);

    let divBy = 1;
    let divSum = item;
    for (let i = 0; i < back; i++) {
        // As we add new items to the front, count out the front first N (back)
        if (typeof data[i] !== "undefined") {
            divBy++;
            divSum += data[i];
        }
    }

    const finalData = data;
    finalData.unshift(divSum / divBy);

    if (finalData.length > maxListLength) {
        finalData.pop();
    }

    return finalData;
}

function stdNum(num) {
    return parseFloat(num).toLocaleString("en-GB", { minimumFractionDigits: DECIMAL_PLACES, maximumFractionDigits: DECIMAL_PLACES }).replace(/,/g, THOUSAND_CHAR);
}

function load() {
    $.post(UPDATE_URL)
        .done(function (data_orig) {
            const data = {};

            if (typeof data_orig.w_current_made !== "undefined") {
                data.kwh_total_generated_ever = data_orig.kwh_total_generated_ever; // total ever
                data.w_current_made = data_orig.w_current_made; // being generated
                data.w_battery = data_orig.w_battery; // being generated
                data.w_current_grid = data_orig.w_current_grid; // to grid (negative - being sent to grid, positive - being drawn from grid)
                data.w_current_used = data_orig.w_current_used; // being used
                data.w_max_factor = data_orig.w_max_factor; // factor to calc the bar charts percentages with - recommend value near real-world max generation capacity in watts
                data.w_max_factor_battery = data_orig.w_max_factor_battery;
                data.w_battery_state_of_charge = data_orig.w_battery_state_of_charge;

                data.w_current_grid_positive = data.w_current_grid > 0;
                data.w_current_grid = data.w_current_grid < 0 ? data.w_current_grid * -1 : data.w_current_grid;
                data.w_current_used = data.w_current_used < 0 ? data.w_current_used * -1 : data.w_current_used;

                data.pc_current_made = Math.round((data.w_current_made / data.w_max_factor) * 100);
                data.pc_battery = Math.round((data.w_battery / data.w_max_factor_battery) * 100);
                data.pc_current_grid = Math.round((data.w_current_grid / data.w_max_factor) * 100);
                data.pc_current_used = Math.round((data.w_current_used / data.w_max_factor) * 100);
            } else if (typeof data_orig.error !== "undefined") {
                data.error = data_orig.error;
            } else {
                data.error = "Unexpected response from inverter";
            }

            if (typeof data.error !== "undefined") {
                $(".problem-loading-msg").html("Problem Loading (" + data.error + ")");
                $(".problem-loading").removeClass("d-none");
                $(".ok-loading").addClass("d-none");
                console.warn(data.error, data_orig);
            } else {
                $(".problem-loading").addClass("d-none");
                $(".ok-loading").removeClass("d-none");

                // Made - Solar generation
                $(".pc_current_made")
                    .animate({ width: data.pc_current_made + "%" }, ANIMSPEED_MS)
                    .css("overflow", "visible");
                $(".w_current_made").html(
                    stdNum(data.w_current_made)
                );
                histMade = smooth(histMade, data.w_current_made);
                $("#sparkline-made").sparkline(histMade, { type: "bar", height: "8vw", barColor: "rgb(255, 193, 7)", barWidth: 2, barSpacing: 1 });

                // w_battery
                let batSym = "";
                if (data.w_battery < 0) {
                    batSym = "+";
                } else if (data.w_battery > 0) {
                    batSym = "-";
                }
                let batPos = data.w_battery < 0 ? data.w_battery * -1 : data.w_battery;
                let batTxt = batPos == 0 ? "" : '<div class="' + (batSym == "+" ? 'text-success' : 'text-danger') + '">' + batSym + "" + stdNum(batPos) + "<em>W</em></div>"
                batTxt += data.w_battery_state_of_charge;
                $(".pc_battery")
                    .animate({ width: data.w_battery_state_of_charge + "%" }, ANIMSPEED_MS)
                    .css("overflow", "visible");
                $(".w_battery").html(batTxt);
                histBatt = smooth(histBatt, (data.w_battery * -1));
                $("#sparkline-battery").sparkline(histBatt, { type: "bar", height: "8vw", barColor: "rgb(253, 103, 13)", barWidth: 2, barSpacing: 1 });
                if (batSym == "+") {
                    $(".pc_battery").html("Battery Charging");
                    $(".w_battery_positive").html('<i class="mdi mdi-battery-plus"></i>');
                } else if (batSym == "-") {
                    $(".pc_battery").html("Battery Using");
                    $(".w_battery_positive").html('<i class="mdi mdi-battery-minus"></i>');
                } else {
                    $(".pc_battery").html("Battery");
                    $(".w_battery_positive").html('<i class="mdi mdi-battery"></i>');
                }

                // Used - Being used
                $(".pc_current_used")
                    .animate({ width: data.pc_current_used + "%" }, ANIMSPEED_MS)
                    .css("overflow", "visible");
                $(".w_current_used").html(
                    stdNum(data.w_current_used)
                );
                histUsed = smooth(histUsed, data.w_current_used);
                $("#sparkline-used").sparkline(histUsed, { type: "bar", height: "8vw", barColor: "rgb(13, 202, 240)", barWidth: 2, barSpacing: 1 });

                // Grid - Recieve to / send from grid
                $(".pc_current_grid")
                    .animate({ width: data.pc_current_grid + "%" }, ANIMSPEED_MS)
                    .css("overflow", "visible");
                $(".w_current_grid").html(
                    stdNum(data.w_current_grid)
                );
                $(".pc_current_grid").removeClass("chart-bar-green-bg chart-bar-red-bg");
                $(".w_current_grid_positive_A").removeClass("chart-bar-green-line chart-bar-red-line");
                $(".w_current_grid_positive_B").removeClass("text-success text-danger");
                if (data.w_current_grid_positive) {
                    $(".pc_current_grid").addClass("chart-bar-red-bg");
                    $(".w_current_grid_positive_A").addClass("chart-bar-red-line");
                    $(".w_current_grid_positive_B").addClass("text-danger");
                    $(".pc_current_grid").html("Grid Using (Insufficiency)");
                    $(".w_current_grid_positive").html('<i class="mdi mdi-transmission-tower-export" title="Taking from grid (not enough self-generated)"></i>');
                } else {
                    $(".pc_current_grid").addClass("chart-bar-green-bg");
                    $(".w_current_grid_positive_A").addClass("chart-bar-green-line");
                    $(".w_current_grid_positive_B").addClass("text-success");
                    $(".pc_current_grid").html("Grid Sending (Surplus)");
                    $(".w_current_grid_positive").html('<i class="mdi mdi-transmission-tower-import" title="Sending to grid (surplus)"></i>');
                }
                histGrid = smooth(histGrid, data.w_current_grid_positive ? parseFloat(data.w_current_grid) * -1 : parseFloat(data.w_current_grid));
                $("#sparkline-grid").sparkline(histGrid, { type: "bar", height: "8vw", barColor: "rgb(25, 135, 84)", barWidth: 2, barSpacing: 1, negBarColor: "rgb(220, 53, 69)" });

                // Lifetime generation
                $(".kwh_total_generated_ever").html(
                    stdNum(data.kwh_total_generated_ever)
                );
            }

            // Dim display if late
            let d = new Date();
            let n = d.getHours();
            if (n >= 23 || n < 6) {
                document.body.style.opacity = 0.2;
            } else {
                document.body.style.opacity = 1;
            }
        })
        .always(function () {
            setTimeout(load, UPDATE_FREQ_S * 1000);
        });
}

load();

document.addEventListener("click", function () {
    document.body.style.opacity = "1";
});

document.body.addEventListener("dblclick", function () {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari/older Chrome
            document.webkitExitFullscreen();
        }
    } else {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Safari/older Chrome
            document.documentElement.webkitRequestFullscreen();
        }
    }
});
