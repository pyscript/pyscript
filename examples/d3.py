import js
from pyodide.ffi import create_proxy, to_js

d3 = js.d3

fruits = [
    {"name": "🍊", "count": 21},
    {"name": "🍇", "count": 13},
    {"name": "🍏", "count": 8},
    {"name": "🍌", "count": 5},
    {"name": "🍐", "count": 3},
    {"name": "🍋", "count": 2},
    {"name": "🍎", "count": 1},
    {"name": "🍉", "count": 1},
]

fn = create_proxy(lambda d, *_: d["count"])
data = d3.pie().value(fn)(to_js(fruits))

arc = (
    d3.arc()
    .innerRadius(210)
    .outerRadius(310)
    .padRadius(300)
    .padAngle(2 / 300)
    .cornerRadius(8)
)

py = d3.select("#py")
py.select(".loading").remove()

svg = (
    py.append("svg")
    .attr("viewBox", "-320 -320 640 640")
    .attr("width", "400")
    .attr("height", "400")
)

for d in data:
    d_py = d.to_py()

    (svg.append("path").style("fill", "steelblue").attr("d", arc(d)))

    text = (
        svg.append("text")
        .style("fill", "white")
        .attr("transform", f"translate({arc.centroid(d).join(',')})")
        .attr("text-anchor", "middle")
    )

    (
        text.append("tspan")
        .style("font-size", "24")
        .attr("x", "0")
        .text(d_py["data"]["name"])
    )

    (
        text.append("tspan")
        .style("font-size", "18")
        .attr("x", "0")
        .attr("dy", "1.3em")
        .text(d_py["value"])
    )
