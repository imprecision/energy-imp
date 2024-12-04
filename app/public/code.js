"use strict";

/**
 * Other settings (best to leave everything below as it is)
 */

const UPDATE_URL = "/data.json";

let UPDATE_FREQ_S = 5;

let histMade = [];
let histUsed = [];
let histGrid = [];

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

function load() {
    let thousandChar = "";
    let animSpeed_ms = 1000;
    $.post(UPDATE_URL)
        .done(function (data_orig) {
            const data = {};

            if (typeof data_orig.s_update_frequency !== "undefined") {
                UPDATE_FREQ_S = data_orig.s_update_frequency;
            }

            if (typeof data_orig.w_current_made !== "undefined") {
                data.kwh_total_generated_ever = data_orig.kwh_total_generated_ever; // total ever
                data.w_current_made = data_orig.w_current_made; // being generated
                data.w_battery = data_orig.w_battery; // being generated
                data.w_current_grid = data_orig.w_current_grid; // to grid (negative - being sent to grid, positive - being drawn from grid)
                data.w_current_used = data_orig.w_current_used; // being used
                data.w_max_factor = data_orig.w_max_factor; // factor to calc the bar charts percentages with - recommend value near real-world max generation capacity in watts

                data.w_current_grid_positive = data.w_current_grid > 0;
                data.w_current_grid = data.w_current_grid < 0 ? data.w_current_grid * -1 : data.w_current_grid;
                data.w_current_used = data.w_current_used < 0 ? data.w_current_used * -1 : data.w_current_used;

                data.pc_current_made = Math.round((data.w_current_made / data.w_max_factor) * 100);
                data.pc_battery = Math.round((data.w_battery / data.w_max_factor_battery) * 100);
                data.pc_current_grid = Math.round((data.w_current_grid / data.w_max_factor) * 100);
                data.pc_current_used = Math.round((data.w_current_used / data.w_max_factor) * 100);

                data.pc_battery = isNaN(data.pc_battery) ? 0 : data.pc_battery;
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
                    .animate({ width: data.pc_current_made + "%" }, animSpeed_ms)
                    .css("overflow", "visible");
                $(".w_current_made").html(
                    parseFloat(data.w_current_made).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, thousandChar)
                );
                histMade = smooth(histMade, data.w_current_made);
                $("#sparkline-made").sparkline(histMade, { type: "bar", height: "8vw", barColor: "rgb(255, 193, 7)", barWidth: 2, barSpacing: 1 });

                // w_battery
                $(".pc_battery")
                .animate({ width: data.pc_battery + "%" }, animSpeed_ms)
                .css("overflow", "visible");
                $(".w_battery").html(
                    parseFloat(data.w_battery).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, thousandChar)
                );
                histMade = smooth(histMade, data.w_battery);
                $("#sparkline-battery").sparkline(histMade, { type: "bar", height: "8vw", barColor: "rgb(13, 110, 253)", barWidth: 2, barSpacing: 1 });
                // w_battery_positive
                if (data.pc_battery >= 0) {
                    $(".w_battery_positive").html('<i class="mdi mdi-battery-plus"></i>');
                } else {
                    $(".w_battery_positive").html('<i class="mdi mdi-battery-minus"></i>');
                }

                // Used - Being used
                $(".pc_current_used")
                    .animate({ width: data.pc_current_used + "%" }, animSpeed_ms)
                    .css("overflow", "visible");
                $(".w_current_used").html(
                    parseFloat(data.w_current_used).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, thousandChar)
                );
                histUsed = smooth(histUsed, data.w_current_used);
                $("#sparkline-used").sparkline(histUsed, { type: "bar", height: "8vw", barColor: "rgb(13, 202, 240)", barWidth: 2, barSpacing: 1 });

                // Grid - Recieve to / send from grid
                $(".pc_current_grid")
                    .animate({ width: data.pc_current_grid + "%" }, animSpeed_ms)
                    .css("overflow", "visible");
                $(".w_current_grid").html(
                    parseFloat(data.w_current_grid).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, thousandChar)
                );
                $(".pc_current_grid").removeClass("chart-bar-green-bg chart-bar-red-bg");
                $(".w_current_grid_positive_A").removeClass("chart-bar-green-line chart-bar-red-line");
                $(".w_current_grid_positive_B").removeClass("text-success text-danger");
                if (data.w_current_grid_positive) {
                    $(".pc_current_grid").addClass("chart-bar-red-bg");
                    $(".w_current_grid_positive_A").addClass("chart-bar-red-line");
                    $(".w_current_grid_positive_B").addClass("text-danger");
                    $(".pc_current_grid").html("Receiving (Insufficiency)");
                    $(".w_current_grid_positive").html('<i class="mdi mdi-transmission-tower-export" title="Taking from grid (not enough self-generated)"></i>');
                } else {
                    $(".pc_current_grid").addClass("chart-bar-green-bg");
                    $(".w_current_grid_positive_A").addClass("chart-bar-green-line");
                    $(".w_current_grid_positive_B").addClass("text-success");
                    $(".pc_current_grid").html("Grid - Sending (Surplus)");
                    $(".w_current_grid_positive").html('<i class="mdi mdi-transmission-tower-import" title="Sending to grid (surplus)"></i>');
                }
                histGrid = smooth(histGrid, data.w_current_grid_positive ? parseFloat(data.w_current_grid) * -1 : parseFloat(data.w_current_grid));
                $("#sparkline-grid").sparkline(histGrid, { type: "bar", height: "8vw", barColor: "rgb(25, 135, 84)", barWidth: 2, barSpacing: 1, negBarColor: "rgb(220, 53, 69)" });

                // Lifetime generation
                $(".kwh_total_generated_ever").html(
                    parseFloat(data.kwh_total_generated_ever).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, " ")
                );
            }
        })
        .always(function () {
            setTimeout(load, UPDATE_FREQ_S * 1000);
        });
}

load();
