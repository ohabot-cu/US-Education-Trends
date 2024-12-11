// add your JavaScript/D3 to this file

/*
Need to add the following features:

- Text displaying the scores of each region

*/

/*
Run local python http server:

from http.server import HTTPServer, SimpleHTTPRequestHandler


class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(CORSRequestHandler, self).end_headers()


httpd = HTTPServer(('localhost', 8003), CORSRequestHandler)
httpd.serve_forever()

*/

// json data for US state polygons. Using this as a test since reading from file is not working.
state_groups = {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania", "Maryland"],
    "Midwest": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"],
    "South": ["Florida", "Georgia", "North Carolina", "South Carolina", "Virginia", "Washington, D.C.", "Delaware", "West Virginia", "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"],
    "West": ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"],
};


// Set up the dimensions of the SVG
const width = 890;
const height = 600;

// Create a projection to convert geo-coordinates to screen coordinates
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1000);

// Create a path generator using the projection
const path = d3.geoPath()
    .projection(projection);
    
const plot = d3.select("div#plot")

plot.style("display", "grid").style("margin-bottom", "50px")

const title = plot.append("h3")
                  .style("padding-left", "40px")
                  .text(`Regional Std. Mathematics Scores (Age 9; Year 2004)`)
                  

// Create an SVG element
const svg = plot
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
plot.append("label")
    .attr("class", "hint")
    .style("font-size", "10px")
    .text("Hint: Hover over a region to view its Std. Score")
    
// Define region scores and color scale
const region_score_map = {};
const all_scores = [];
var colorScale;
const colors = ["#dbeeff", "#004f90"];
const allowedYears = [2004, 2008, 2012, 2020, 2022];

d3.csv("https://raw.githubusercontent.com/ohabot-cu/US-Education-Trends/refs/heads/main/data/mathematics/modified_region.csv").then(region_scores => {
    region_scores.forEach(row => {
        var year = row["Year"];
        var region = row["Region of the country"];
        var score = parseInt(row["Average scale score"]);
        
        if (!isNaN(score)) {
            all_scores.push(score);
            if (!region_score_map[year]) {
                region_score_map[year] = {};
            }
            region_score_map[year][region] = score;
        }
    });
}).then(() => {
    // Create color scale after the data is loaded
    const min = d3.min(all_scores)
    const max = d3.max(all_scores)
    const avg = (min + max) / 2
    colorScale = d3.scaleSequential()
        .domain([min, max])  // Centered at 0
        .range(colors);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "lightgray")
  .style("padding", "10px")
  .style("border-radius", "5px")
  .style("opacity", 0)
  .style("pointer-events", "none");

let year = "2004-01-01"

// Load the GeoJSON data and display it
d3.json("https://raw.githubusercontent.com/ohabot-cu/US-Education-Trends/refs/heads/main/data/us-states.geojson").then(geojson => {
    svg.append("g")
        .attr("id", "state-polygons")
        .selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("id", d => d.properties.name)
        .on("mouseover", function(event, d) {
          const state = d.properties.name;
          const year = `${allowedYears[slider.property("value")]}-01-01`;  // Get the current year from the slider
          
          tooltip.transition().duration(200).style("opacity", .9);
          for (const [region, states] of Object.entries(state_groups)) {
              if (states.includes(d.properties.name)) {
                  score = region_score_map[year][region]
                  tooltip.html(`${region}: ${score}`)
                      .style("left", (event.pageX + 5) + "px")
                      .style("top", (event.pageY - 28) + "px");
              }
          }
        })
        .on("mouseout", function(event, d) {
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .attr("class", d => {
          for (const [region, states] of Object.entries(state_groups)) {
                if (states.includes(d.properties.name)) {
                    return region; // Assign the region as the class
                }
            }
            return "Other"; // Default class if not matched
        })
        .attr("d", path)
        .attr("fill", d => {
            // Determine the region for the state
            for (const [region, states] of Object.entries(state_groups)) {
                if (states.includes(d.properties.name)) {
                    return colorScale(region_score_map[year][region]); // Use the score to determine color
                }
            }
            return "gray"; // Default color if not matched
        })
        .attr("stroke", "white");
});

const slider_width = 240

const year_select = plot.append("div")
                      .attr("class", "slider")
                      .style("display", "grid")
                      .style("justify-content", "center")
                      .style("justify-items", "center");
const slider_lab = year_select.append("label")
                      .attr("for", "year_slider")
                      .text("Year: 2004");
const slider = year_select.append("input")
                  .attr("type", "range")
                  .attr("value", 0)
                  .attr("min", 0)
                  .attr("max", 4)
                  .attr("id", "year_slider")
                  .attr("name", "year_slider")
                  .attr("oninput", "this.nextElementSibling.value = this.value")
                  .style("width", `${slider_width}px`)
const curr_year = year_select.append("output")
                            .style("font-size", "0")
                              
const slider_scale = d3.scaleBand()
                        .domain([2004, 2008, 2012, 2020, 2022])
                        .range([0, slider_width-20])
                        .paddingOuter(0)
                        .paddingInner(1)
const slider_axis = d3.axisBottom().scale(slider_scale);
year_select.append("svg")
          .attr("id", "slider-axis")
          .style("width", `${slider_width+2}px`)
          .style("height", "20px")
          .append("g")
          .style("transform", "translate(10px, 0px)")
          .call(slider_axis)

slider.on("input", function(event) {
  // Get the value of the slider
  const num_year = allowedYears[event.target.value]
  const year = num_year + "-01-01"; // Format as 'YYYY-01-01'
  
  title.text(`Regional Std. Mathematics Scores (Age 9; Year ${num_year})`)

  svg.select("g#state-polygons").selectAll("path")
      .transition() // Optional: add smooth transition when changing colors
      .duration(1000)
      .attr("fill", d => {
        const state = d.properties.name;
        for (let [region, states] of Object.entries(state_groups)) {
              if (states.includes(d.properties.name)) {
                  return colorScale(region_score_map[year][region]); // Use the score to determine color
              }
          }
      });
    
  slider_lab.text(`Year: ${num_year}`);
});


// Create Legend
var defs = svg.append("defs")

var legend = defs.append("linearGradient")
                .attr("id", "linear-gradient")
                .attr("x1", "0%")
                .attr("x2", "0%")
                .attr("y1", "100%")
                .attr("y2", "0%")
                
legend.selectAll("stop")
    .data([
        {offset: "0%", color: colors[0]},
        {offset: "100%", color: colors[1]},
      ])
    .enter().append("stop")
    .attr("offset", function(d) { return d.offset; })
    .attr("stop-color", function(d) { return d.color; });

var legend_group = svg.append("g")
                      .style("transform", "translate(10px, 40px)")
                      
legend_group.append("text")
            .text("Std. Score")
            .style("transform", "translate(0px, -12px)")
                      
legend_group.append("rect")
    .attr("width", 20)
    .attr("height", 200)
    .style("fill", "url(#linear-gradient)");

var legend_scale = d3.scaleLinear()
                      .domain([250, 231])
                      .range([0, 200]);
var legend_axis = d3.axisRight().scale(legend_scale);

legend_group.append("g")
            .attr("id", "legend-axis")
            .style("transform", "translate(20px, 0px)")
            .call(legend_axis);
                
                
function moveSlider() {
  const curr_val = curr_year.value
  
  console.log()
}
setInterval(moveSlider, 1000)

