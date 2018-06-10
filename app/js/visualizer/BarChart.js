/* jshint expr: true */

var BarChart = function (container) {
    
    var scope = this;
    
    var selectedMonth = !selectedMonth ?  "january" : selectedMonth.toLowerCase();
    var threshold = 9;
    var dom = container;

    var margin = {
            top: 40,
            right: 20,
            bottom: 30,
            left: 40
        },
        width = dom.clientWidth - margin.left - margin.right,
        height = dom.clientHeight - margin.top - margin.bottom;

    var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left");

    var tip = d3.tip().attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            return "<strong>Frequency:</strong> <span style='color:red'>" + d.values + "</span>";
        });

    var svg = d3.select( container ).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    this.init = function (selectedMonth) {

        var selectedMonth = !selectedMonth ?  "january" : selectedMonth.toLowerCase();

        d3.json("/resources/data/MonthlyData.json", function (error, data) {

            x.domain(data[selectedMonth].map(function (d) { return d.date; }));
            y.domain([0, d3.max(data[selectedMonth], function(d) { return d.values; })]);
    
            svg.append("g")
                .attr("class", "x axis")
                .attr("height", 1)
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
    
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em");
    
            svg.selectAll(".bar")
                .data(data[selectedMonth])
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.date); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.values); })
                .attr("height", function (d) {
                    return height - y(d.values);
                })
                .attr("fill", function (d) {
                    return colorPicker(d.values);
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);
    
        });
    };

    this.update = function (selectedMonth) {
        selectedMonth = selectedMonth.toLowerCase();
        
        d3.json("/resources/data/MonthlyData.json", function(error, data) {
            
            var bars = svg.selectAll('.bar')
                .data(data[selectedMonth]);

            bars.exit().remove();
            bars.enter().append('rect');

            // Update 
            bars.attr('x', function(d) { return x(d.date); })
                .attr('width', x.rangeBand())
                .attr('y', function(d) { return y(d.values); })
                .attr("height", function(d) { return height - y(d.values); })
                .attr("fill", function (d) {
                    return colorPicker(d.values);
                }); 
        
        });


        
    
    };

    function colorPicker(v) {
        if (v < 10 && v > 5) {
            return "#eec200";
        } else if (v < 6) {
            return "#e6503a";
        } else {
             return "#33d66e";
        }

    }

};