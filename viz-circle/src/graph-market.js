module.exports = class MarketGraph {
  constructor (target = '#viz-depth') {
    this.svg = d3.select(target).append('svg')
    this.marketWidth = 300
    this.marketHeight = this.svg.node().clientHeight
    this.x = d3.scale.linear().range([0, this.marketWidth])
    this.y = d3.scale.linear().range([this.marketHeight, 0])

    this.g = this.svg.append('g')

    this.g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${this.marketHeight})`)
    //     // .call(d3.svg.axis())

    this.g.append('g')
        .attr('class', 'axis axis--y')
    //     // .call(d3.axisLeft(y))

    // Define the div for the tooltip
    const tooltip = d3.select('#viz-depth').append('div')
      .attr('class', 'orderbook-visualisation-tooltip')
      .style('width', '200px')
      .style('opacity', 0)
      .html('')
  }

  Draw (data) {
    const asks = prefixSum(data, 'ask')
    const bids = prefixSum(data, 'bid')
    data = asks.concat(bids)

    data = data.sort((a, b) => (a.price > b.price ? 1 : -1))

    this.x.domain([
      d3.min(data, d => d.price),
      d3.max(data, d => d.price) + 1
    ])
    this.y.domain([0, d3.max(data, d => d.total)])

    const market = this.g.selectAll('.bar')
      .data(data)

    market.exit().remove()

    market.enter()
      .append('rect')
      .attr('class', 'bar')

    market
        .attr('x', d => this.x(d.price))
        .attr('y', d => this.y(d.total))
        .attr('class', d => `bar ${d.type}`)
        .attr('width', (d, i) => {
          // is there a next element and do they have the same type:
          // fill until the next order
          if (data[i + 1] && data[i + 1].type === d.type) {
            return this.x(data[i + 1].price) - this.x(d.price)
          // is there a next element and they don't have the same type:
          // market price valley
          } else if (data[i + 1]) {
            return (this.x.range()[1] - this.x.range()[0]) / data.length
          }
          // this is the last element: fill until the end of the graph
          return this.x.range()[1] - this.x(d.price)
        })
        .attr('height', d => this.marketHeight - this.y(d.total))
        .on('mouseover', (d) => {
          tooltip.transition()
            .duration(500)
            .style('opacity', 1)

          let html = '<table>'

          Object.keys(d).forEach((key) => {
            html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`
          })

          html += '</table>'

          tooltip.html(html)
        })
        .on('mouseout', () =>
          tooltip.transition().duration(500).style('opacity', 0)
        )
  }
}

function prefixSum (orders, type) {
  let sorted = orders
    .filter(d => d.type === type)
    .sort((a, b) => {
      if (type == 'ask') {
        return (a.price > b.price ? 1 : -1)
      } else {
        return (a.price < b.price ? 1 : -1)
      }
    })

  if (sorted.length === 0) {
    return []
  }

  let arr = [{total: 0, price: sorted[0].price, type}]
  sorted.forEach(d => {
    const total = d.price * d.size
    const last = arr[arr.length - 1]
    if (last.price === d.price) {
      last.total += total
    } else {
      arr.push({price: d.price, total: last.total + total, type})
    }
  })

  return arr
}
