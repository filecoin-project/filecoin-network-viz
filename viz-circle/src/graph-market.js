module.exports = class MarketGraph {
  constructor (target = '#viz-depth') {
    const margin = { top: 0, right: 0, bottom: 20, left: 0 }

    this.svg = d3.select(target).append('svg')
    this.height = +this.svg.node().clientHeight
    this.width = +this.svg.node().clientWidth
    this.marketWidth = +this.svg.node().clientWidth - margin.left - margin.right
    this.marketHeight = +this.svg.node().clientHeight - margin.top - margin.bottom

    this.x = d3.scale.linear().range([0, this.marketWidth])
    this.y = d3.scale.linear().range([this.marketHeight, 0])

    this.g = this.svg.append('g')
      .attr('transform', `translate(0,0)`)

    this.g.append('g')
      .attr('transform', `translate(0,${this.marketHeight})`)
      .attr('class', 'x axis')

    this.g.append('g')
      .attr('transform', `translate(0,0)`)
      .attr('class', 'y-left axis')

    this.g.append('g')
      .attr('transform', `translate(${this.marketWidth},0)`)
      .attr('class', 'y-right axis')

    this.market = this.g.append('g')
      .attr('transform', `translate(0,0)`)


    // Define the div for the tooltip
    this.tooltip = d3.select('#viz-depth').append('div')
      .attr('class', 'orderbook-visualisation-tooltip')
      .style('width', '200px')
      .style('opacity', 0)
      .html('')
  }

  Draw (dataOne) {
    const asks = prefixSum(dataOne, 'ask')
    const bids = prefixSum(dataOne, 'bid')
    var data = asks.concat(bids)

    data = data.sort((a, b) => (a.price > b.price ? 1 : -1))

    this.x.domain([
      d3.min(data, d => d.price),
      d3.max(data, d => d.price) + 1
    ])
    this.y.domain([0, d3.max(data, d => d.total)])

    const market = this.market.selectAll('.bar')
      .data(data)

    market.exit().remove()

    market.enter()
      .append('rect')
      .attr('class', 'bar')

    const xAxis = d3.svg.axis().scale(this.x).orient('bottom').ticks(10)
    const yAxisLeft = d3.svg.axis().scale(this.y).orient('right').ticks(10)
    const yAxisRight = d3.svg.axis().scale(this.y).orient('left').ticks(10)

    this.svg.selectAll('g.y-left.axis')
        .call(yAxisLeft)
        .call(g => {
          g.select('.domain').remove()
        })

    this.svg.selectAll('g.y-right.axis')
        .call(yAxisRight)
        .call(g => {
          g.select('.domain').remove()
        })

    this.svg.selectAll('g.x.axis')
        .call(xAxis)

    market
        .attr('x', d => this.x(d.price))
        .attr('y', d => this.y(d.total))
        .attr('class', d => `bar ${d.type}`)
        .attr('width', (d, i) => {
          if (data[i + 1]) {
            return this.x(data[i + 1].price) - this.x(d.price)
          } else {
            return this.x.range()[1] - this.x(d.price)
          }
        })
        .attr('height', d => this.marketHeight - this.y(d.total))
        .on('mouseover', (d) => {
          this.tooltip.transition()
            .duration(500)
            .style('opacity', 1)

          let html = '<table>'

          Object.keys(d).forEach((key) => {
            html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`
          })

          html += '</table>'

          this.tooltip.html(html)
        })
        .on('mouseout', () =>
          this.tooltip.transition().duration(500).style('opacity', 0)
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
