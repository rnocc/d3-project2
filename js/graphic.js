var $graphic = $('#graphic');
var graphic_data_url = 'data.csv';
var graphic_data;
var graphic_aspect_width = 16;
var graphic_aspect_height = 9;
var mobile_threshold = 500;
var error;

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function drawGraphic() {
    if (error) {
        return;
    } else {
        d3.select("body").selectAll(".error").remove();
    }
    var margin = { top: 10, right: 15, bottom: 25, left: 35 };
    var width = $graphic.width() - margin.left - margin.right;
    var height = Math.ceil((width * graphic_aspect_height) / graphic_aspect_width) - margin.top - margin.bottom;
    var num_ticks = 13;

    if ($graphic.width() < mobile_threshold) {
        num_ticks = 5;
    }

    // clear out existing graphics
    $graphic.empty();

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickFormat(function(d,i) {
            if (width <= mobile_threshold) {
                var fmt = d3.time.format('%y');
                return '\u2019' + fmt(d);
            } else {
                var fmt = d3.time.format('%Y');
                return fmt(d);
            }
        });

    var x_axis_grid = function() { return xAxis; }

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(num_ticks);

    var y_axis_grid = function() { return yAxis; }

    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.amt); });

    // parse data into columns
    var lines = {};
    for (var column in graphic_data[0]) {
        if (column == 'date') continue;
        lines[column] = graphic_data.map(function(d) {
            return {
                'date': d.date,
                'amt': d[column]
            };
        });
    }

    var svg = d3.select('#graphic').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    x.domain(d3.extent(graphic_data, function(d) { return d.date; }));

    y.domain([
        d3.min(d3.entries(lines), function(c) {
            return d3.min(c.value, function(v) {
                var n = v.amt;
                return Math.floor(n);
            });
        }),
        d3.max(d3.entries(lines), function(c) {
            return d3.max(c.value, function(v) {
                var n = v.amt;
                return Math.ceil(n);
            });
        })
    ]);

    var barWidth = width / graphic_data.length;
    var bar = svg.selectAll("g")
                .data(graphic_data)
            .enter().append("g")
                .attr("transform", function(d, i) { 
                    var x = i * barWidth;
                    var h = y(d.jobs); 
                    return "translate(" + x + "," + h + ")"; 
                }).on("mouseover", function(d) {
                    tooltip.style("opacity", 0.8);
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(d.jobs.toFixed(2))
                        .style("left", (d3.event.pageX + 5) + "px")
                        .style("top", (d3.event.pageY - 5) + "px");
                    })
                .on("mouseout", function(d) {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

    bar.append("rect")
    .attr("width", barWidth + "px")
    .attr("height", function(d) { return height - y(d.jobs) + "px"; });

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
}

function displayError(errorData) {
    $graphic.empty();

    d3.select("body").select(".error").remove();
    d3.select("body").append("div")
        .attr("class", "error")
        .style("opacity", 0)
        .text("Sorry, there was an error with your data: " + errorData.date + ',' + errorData.jobs)
        .transition()
            .duration(1000)
            .style("opacity", 100);
}
function GetCsvData(csv) {
    error = false;
    if (Modernizr.svg) { // if svg is supported, draw dynamic chart
        graphic_data = d3.csv.parse(csv);

        graphic_data.forEach(function(d) {
            var formattedJobs = d.jobs / 1000;
            var formattedDate = d3.time.format('%Y-%m').parse(d.date);

            if (!formattedDate || !formattedJobs && formattedJobs !== 0) {
                displayError(d);
                error = true;
            } else {
                d.jobs = formattedJobs;
                d.date = formattedDate;
            }
        });

        if (!error) {
            drawGraphic();
        }
        window.onresize = drawGraphic;
    }
}
