function leakMemory() {
  let bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData
  }, 1)           // it will be freed
}

setInterval(() => {
  leakMemory()
}, 1)
