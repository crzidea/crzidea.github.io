setInterval(async () => {
  console.log('start');
  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  })
  console.log('end');
}, 1000)
