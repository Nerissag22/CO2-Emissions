const width = 1200;
const height = 600;

const svg = d3.select("#visualization").append("svg")
    .attr("width", width)
    .attr("height", height);

let scene = 1;

const parameters = {
    country: 'All',
    year: 'All'
};

let data;
let topojsonData;

const tooltip = d3.select("#tooltip");

// Populate the country and year dropdowns
function populateDropdowns(data) {
    const countrySelect = d3.select("#country-select");
    const yearSelect = d3.select("#year-select");

    const countries = Array.from(new Set(data.map(d => d.Country))).sort();
    countries.unshift('All');
    
    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);
    years.unshift('All');

    countrySelect.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d);

    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d);

    countrySelect.on("change", function() {
        parameters.country = this.value;
        updateVisualization();
    });

    yearSelect.on("change", function() {
        parameters.year = this.value === 'All' ? 'All' : +this.value;
        updateVisualization();
    });
}

// Scene 1: Map visualization
function showScene1() {
    svg.html(""); // Clear the SVG

    let filteredData = data;

    if (parameters.country !== 'All') {
        filteredData = filteredData.filter(d => d.Country === parameters.country);
    }
    
    if (parameters.year !== 'All') {
        filteredData = filteredData.filter(d => d.Year === parameters.year);
    }

    if (filteredData.length === 0) return;

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(filteredData, d => d['Life expectancy ']));

    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 1.5]);

    const path = d3.geoPath()
        .projection(projection);

    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(topojsonData, topojsonData.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const countryData = filteredData.find(country => country.Country === d.properties.name);
            console.log(`Country: ${d.properties.name}, Life Expectancy: ${countryData ? countryData['Life expectancy '] : 'N/A'}`);
            return countryData ? colorScale(countryData['Life expectancy ']) : '#ccc';
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            const countryData = filteredData.find(country => country.Country === d.properties.name);
            if (countryData) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Country: ${countryData.Country}<br>Life Expectancy: ${countryData['Life expectancy ']}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    svg.append("path")
        .datum(topojson.mesh(topojsonData, topojsonData.objects.countries, (a, b) => a !== b))
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

    const legendHeight = 200;
    const legendWidth = 20;

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - legendWidth - 20}, ${height / 2 - legendHeight / 2})`);

    const legendScale = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d['Life expectancy ']))
        .range([0, legendHeight]);

    const legendAxis = d3.axisRight(legendScale)
    .ticks(6);

    legend.selectAll("rect")
        .data(d3.range(0, 1, 0.01))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => legendScale(d * d3.extent(filteredData, d => d['Life expectancy '])[1]))
        .attr("width", legendWidth)
        .attr("height", 2)
        .attr("fill", d => colorScale(d * d3.extent(filteredData, d => d['Life expectancy '])[1]));

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);
}

// Function to show the second scene
function showScene2() {
    svg.html(""); // Clear the SVG

    const filteredData = data.filter(d => d.Country === parameters.country);

    if (filteredData.length === 0) return;

    const x = d3.scaleLinear()
        .domain([2000, 2020])
        .range([50, width - 50]);

    const y = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d['Life expectancy ']), d3.max(filteredData, d => d['Life expectancy '])])
        .range([height - 50, 50]);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(50, 0)`)
        .call(d3.axisLeft(y));

    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d['Life expectancy ']))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`Year: ${d.Year}<br>Life Expectancy: ${d['Life expectancy ']}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add annotations
    const annotations = [
        {
            note: { label: "Trend of Life Expectancy" },
            x: width / 2,
            y: height / 2,
            dy: -70,
            dx: 70
        }
    ];

    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
}

// Function to show the third scene
function showScene3() {
    svg.html(""); // Clear the SVG

    const filteredData = data.filter(d => d.Country === parameters.country && d.Year === parameters.year);

    if (filteredData.length === 0) return;

    const barData = [
        { label: 'Adult Mortality', value: filteredData[0]['Adult Mortality'] },
        { label: 'Infant Deaths', value: filteredData[0]['infant deaths'] }
    ];

    const x = d3.scaleBand()
        .domain(barData.map(d => d.label))
        .range([50, width - 50])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value)])
        .range([height - 50, 50]);

    svg.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(50, 0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(barData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - 50 - y(d.value))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${d.label}: ${d.value}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add annotations
    const annotations = [
        {
            note: {
                label: `Adult Mortality: ${barData[0].value}`,
                title: 'Adult Mortality'
            },
            x: x(barData[0].label) + x.bandwidth() / 2,
            y: y(barData[0].value) - 10,
            dy: -10,
            dx: 0,
            color: ["#000"]
        },
        {
            note: {
                label: `Infant Deaths: ${barData[1].value}`,
                title: 'Infant Deaths'
            },
            x: x(barData[1].label) + x.bandwidth() / 2,
            y: y(barData[1].value) - 10,
            dy: -10,
            dx: 0,
            color: ["#000"]
        }
    ];

    const makeAnnotations = d3.annotation()
        .annotations(annotations)
        .type(d3.annotationLabel)
        .accessors({
            x: d => d.x,
            y: d => d.y
        });

    svg.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
}

// Load the data and initialize the scenes
async function loadData() {
    try {
        // Load the CSV data
        data = await d3.csv("Life Expectancy Data.csv");

        // Parse the data
        data.forEach(d => {
            d.Year = +d.Year;
            d['Life expectancy '] = parseFloat(d['Life expectancy ']);
            d['Adult Mortality'] = +d['Adult Mortality'];
            d['infant deaths'] = +d['infant deaths'];
        });

        // Populate the dropdowns
        populateDropdowns(data);

        // Load the TopoJSON data
        topojsonData = await d3.json("https://unpkg.com/world-atlas@2.0.2/countries-50m.json");

        // Initialize the first scene
        updateVisualization();
    } catch (error) {
        console.error("Error loading data: ", error);
    }
}

function updateVisualization() {
    if (scene === 1) {
        showScene1();
    } else if (scene === 2) {
        showScene2();
    } else if (scene === 3) {
        showScene3();
    }

    d3.select("#prev-scene").style("display", scene === 1 ? "none" : "inline-block");
    d3.select("#next-scene").style("display", scene === 3 ? "none" : "inline-block");
}

// Event listeners for navigation buttons
document.getElementById("prev-scene").addEventListener("click", () => {
    if (scene > 1) {
        scene--;
        updateVisualization();
    }
});

document.getElementById("next-scene").addEventListener("click", () => {
    if (scene < 3) {
        scene++;
        updateVisualization();
    }
});

// Load data and initialize visualization
loadData();
