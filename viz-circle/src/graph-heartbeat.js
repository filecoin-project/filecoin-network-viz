module.exports = class HeartbeatGraph {
  constructor (target = '#viz-heartbeat .viz') {
    this.mountPoint = document.querySelector(target)
  }

  Draw(heartbeats) {
    const rows = []
    const header = `
      <thead>
        <tr>
          <th>PEER</th>
          <th>CHAINHEAD</th>
          <th># PEERS</th>
          <th># ASKS (latest)</th>
          <th># BIDS (latest)</th>
          <th># DEALS</th>
          <th>WALLETS</th>
        </tr>
      </thead>
    `

    const len = a => a ? a.length : 0
    const msgInfo = info => {
      if (!info) {
        return {
          total: 0,
          top: 0
        }
      }

      const ids = Object.keys(info).map(id => +id)

      return {
        total: ids.length,
        top: d3.max(ids, id => id) || 0
      }
    }

    for (let [peerID, heartbeat] of Object.entries(heartbeats)) {
      console.log(heartbeat)
      const chainhead = heartbeat['best-block']
      const { total: totalAsks, top: highestAsk } = msgInfo(heartbeat.asks)
      const { total: totalBids, top: highestBid } = msgInfo(heartbeat.bids)
      const totalDeals = (heartbeat.deals || []).length
      const totalPeers = (heartbeat.peers || []).length
      const wallets = heartbeat['wallet-addrs'].join('<br />')

      rows.push(`
        <tr>
          <td>${peerID}</td>
          <td>${chainhead}</td>
          <td>${totalPeers}</td>
          <td>${totalAsks} (${highestAsk})</td>
          <td>${totalBids} (${highestBid})</td>
          <td>${totalDeals}</td>
          <td>${wallets}</td>
        </tr>
      `)
    }

    this.mountPoint.innerHTML = `
      <table class="viz-table">
        ${header}
        ${rows.join('\n')}
      </table>
    `
  }
}
