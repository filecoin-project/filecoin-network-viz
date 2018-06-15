module.exports = class OrderbookGraph {
  constructor(target = '#viz-orderbook .viz') {
    this.svg = d3.select(target).append('svg')
    .attr('id', 'blockchain')
    .attr('width', 200)
    .attr('height', 800)
  }

  Draw(data) {

    data = data.filter(Boolean).slice(-20)

    console.log(data)

    const blockchain = this.svg.selectAll('g.orders')
      .data(data, d => `${d.type}${d.id}`)

    // on blocks being added
    let block = blockchain.enter()
      .append('g')
      .attr('class', d => 'orders o-' + d.id)

    block.append('image')
      .attr('href', d => 'img/' + d.type + '.png')
      .attr('width', 60)

    block.append('text')
      .attr('class', 'order-from')
      .attr('x', 65)
      .attr('y', 5)
      .text(d => 'from:  ' + d.from.slice(0, 10))

    block.append('text')
      .attr('class', 'order-size')
      .attr('x', 65)
      .attr('y', 20)
      .text(d => 'size:  ' + d.size)

    block.append('text')
      .attr('class', 'order-price')
      .attr('x', 65)
      .attr('y', 35)
      .text(d => 'price: ' + d.price)

    // on blocks being removed
    blockchain.exit()
      .remove()

    // on blocks being updated
    blockchain
      .transition()
      .attr('transform', (d, i) => {
        return 'translate(0,' + (data.length - i) * 50 + ')'
      })
  }
}
