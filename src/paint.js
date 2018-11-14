/* global d3, $ */

import d3cloud from 'd3-cloud';

function draw(words, layout, element, selectValuesFunc, scaleColor, id, width, height) {
  const data = words.map(d => ({
    text: d.text,
    elemNumber: d.elemNumber,
    value: d.value,
    size: d.size,
    x: d.x,
    y: d.y,
    rotate: d.rotate
  }));

  let fill = null;
  if (layout.customRange) {
    fill = d3.scale.linear()
      .domain([0, words.length])
      .interpolate(d3.interpolateHcl)
      .range([layout.colorTo, layout.colorFrom]);
  } else {
    fill = d3.scale[scaleColor]();
  }

  const svg = d3.select(`#${id}`).append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "wordcloud")
    .append("g")
    .attr("transform", "translate(" + [width / 2, height / 2] + ")");

  svg.selectAll("text")
    .data(data)
    .enter().append("text")
    .style("fill", function (d, i) { return fill(i); })
    .attr("class", "selectable")
    .attr("data-value", function (d) { return d.elemNumber; })
    .attr("text-anchor", "middle")
    .attr("transform", function (d) { return "translate(" + [d.x, d.y] + ") rotate(" + d.rotate + ")"; })
    .style("font-size", function (d) { return d.size + "px"; })
    .text(function (d) { return d.text; })
    .append("svg:title").text(function (d) { return d.text + ':' + d.value; });

  //when an item is clicked, add it to the selected values and show the Sense UI for selections
  element
    .find('.selectable')
    .on('qv-activate', ({ target }) => {
      if (!target.hasAttribute("data-value")) {
        return;
      }

      if ($(target).hasClass('selected')) {
        const selClass = $(target).attr("class");
        $(target).attr("class", selClass.replace("selected", "selectable"));
      }
      else {
        $(target).attr("class", "selected");
      }

      const value = parseInt(target.getAttribute("data-value"), 10);
      selectValuesFunc(0, [value], true);
    });
}

const wordcloud = () => ({
  Id: '',
  Width: 0,
  Height: 0,
  fill: null,

  go: function (words, layout, element, selectValuesFunc) {

    var maxSize = d3.max(words, function(d) {
      return d.value;
    });
    var minSize = d3.min(words, function(d) {
      return d.value;
    });
    // var fontScale =(s)=>{return d3.scale.linear() // scale algo which is used to map the domain to the range
    //   .domain([minSize, maxSize]) //set domain which will be mapped to the range values
    //   .range([5, 40]);};
    const max = layout.qHyperCube.qMeasureInfo[0].qMax;
    const min = layout.qHyperCube.qMeasureInfo[0].qMin;
    const scale = d3.scale[layout.Scale]()
      .domain([minSize, maxSize])
      .rangeRound([layout.MinSize, layout.MaxSize]);
    const from = Math.max(-90, Math.min(90, +layout.RadStart));
    const to = Math.max(-90, Math.min(90, +layout.RadEnd));
    const scaleRotate = d3.scale
      .linear()
      .domain([0, +layout.Orientations - 1])
      .range([from, to]); // Input [0,1] convert into output [-90,90]

    d3cloud().size([this.Width, this.Height])
      .words(words)
      .padding(5)
      .timeInterval(10)
      .rotate(function () {
        return scaleRotate(Math.round(Math.random() * (+layout.Orientations - 1)));
      })
      .fontSize(function (d) { return scale(+d.value); })
      // .fontSize(function(d) {
      //   return fontScale(d.size);
      // })
      .on("end", words => draw(words, layout, element, selectValuesFunc, layout.ScaleColor, this.Id, this.Width, this.Height))
      .start();
  },
  id: function (x) {
    if (!arguments.length) {
      return this.Id;
    }
    this.Id = x;
    return this;
  },
  width: function (x) {
    if (!arguments.length) {
      return this.Width;
    }
    this.Width = x;
    return this;
  },

  height: function (x) {
    if (!arguments.length) {
      return this.Height;
    }
    this.Height = x;
    return this;
  }
});

function paint($element, layout) {
  var id = "wordcloud_" + layout.qInfo.qId;

  $('<div />')
    .attr("id", id)
    .width($element.width())
    .height($element.height())
    .appendTo($element.empty());

  const words = layout.qHyperCube.qDataPages[0].qMatrix.map(row => ({
    text: row[0].qText,
    elemNumber: row[0].qElemNumber,
    value: row[1].qText
  }));

  const cloud = wordcloud().id(id).width($element.width()).height($element.height());
  cloud.go(words, layout, $element, this.selectValues.bind(this));
}

export default paint;
