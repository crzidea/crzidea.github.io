function leakMemory() {
  let bigData = Array(1024 * 1024 * 16).map(() => 0)
}

for (let i = 0, l = 16; i < l; i++) {
  leakMemory()
}
