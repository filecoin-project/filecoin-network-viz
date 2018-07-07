const _ = require('underscore')

module.exports = class HeartbeatGraph {
  constructor (target = '#viz-heartbeat .viz') {
    this.rows = {}
    this.mountPoint = document.querySelector(target)
    this.DrawSkeleton()
  }

  DrawSkeleton() {
    this.mountPoint.innerHTML = `
      <table class="viz-table">
        <thead>
          <tr>
            <th>PEER</th>
            <th>CHAIN HEAD</th>
            <th># PEERS</th>
            <th># ASKS (latest)</th>
            <th># BIDS (latest)</th>
            <th># DEALS</th>
            <th>WALLETS</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `
  }

  Draw(heartbeats) {
    for (let [peerID, heartbeat] of Object.entries(heartbeats)) {
      if (!this.rows[peerID]) {
        this.NewRow(peerID)
      }
      this.rows[peerID].Draw(heartbeat)
    }
  }

  NewRow(peerID) {
    var tbody = this.mountPoint.querySelector('tbody')
    var tr = document.createElement('tr')
    tbody.appendChild(tr)
    this.rows[peerID] = new HeartbeatRow(peerID, tr)
  }
}

class HeartbeatRow {
  constructor(peerID, el) {
    this.peerID = peerID
    this.el = el
  }

  Draw(nextH) {
    var next = this.extract(nextH)
    var last = this._last
    this._last = next

    if (_.isEqual(next, last))
      return // no change

    // first time.
    if (this.el.children.length < 7 || !last) {
      this.el.innerHTML = `
        <td>${this.peerID}</td>
        <td>${next.chainhead}</td>
        <td>${next.totalPeers}</td>
        <td>${next.totalAsks} (${next.highestAsk})</td>
        <td>${next.totalBids} (${next.highestBid})</td>
        <td>${next.totalDeals}</td>
        <td>${next.wallets.join('<br />')}</td>
      `
      return
    }

    if (last.chainhead != next.chainhead)
      this.el.children[1].innerText = next.chainhead
    if (last.totalPeers != next.totalPeers)
      this.el.children[2].innerText = next.totalPeers
    if (last.totalAsks != next.totalAsks)
      this.el.children[3].innerText = `${next.totalAsks} (${next.highestAsk})`
    if (last.totalBids != next.totalBids)
      this.el.children[4].innerText = `${next.totalBids} (${next.highestBid})`
    if (last.totalDeals != next.totalDeals)
      this.el.children[5].innerText = next.totalDeals
    if (_.isEqual(last.wallets, next.wallets))
      this.el.children[6].innerHTML = next.wallets.join('<br />')
  }

  extract(h) {
    if (h.from != this.peerID) {
      console.log('oh uh, not the right hb:', h.from, this.peerID)
    }

    var askStats = orderStats(h.asks)
    var bidStats = orderStats(h.bids)
    return {
      chainhead: h['best-block'],
      totalAsks: askStats.total,
      highestAsk: askStats.max,
      totalBids: bidStats.total,
      highestBid: bidStats.max,
      totalDeals: (h.deals || []).length,
      totalPeers: (h.peers || []).length,
      wallets: h['wallet-addrs']
    }
  }
}


function heartbeatsEqual(h1, h2) {
  // only change when best-block changes.
  return h1['best-block'] == h2['best-block']
}

function orderStats(list) {
  if (!list) {
    return { total: 0, max: 0 }
  }

  const ids = Object.keys(list).map(id => +id)
  ids.push(0) // default
  return {
    total: ids.length - 1,
    max: _.max(ids),
  }
}
