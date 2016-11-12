function leakMemory() {
  let bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    return
    setTimeout(() => {
      bigData       // not reachable
    }, 3600 * 1000) // 1 hour
  }, 1)
}

setInterval(() => {
  leakMemory()
}, 1)
