function leakMemory() {
  let bigData = Array(1024 * 1024 * 16).map(() => 0)
  setTimeout(() => {
    bigData       // leak
  }, 3600 * 1000) // 1 hour
}

for (let i = 0, l = 16; i < l; i++) {
  leakMemory()
}
