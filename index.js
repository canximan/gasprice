const express = require('express')
const axios = require('axios');
const cors = require('cors');
const web3 = require('web3')
const NodeCache = require('node-cache')

const cache = new NodeCache()
const app = express()
const port = 5203

app.use(cors())
app.options('*', cors())
app.get('/price/:network', (req, res) => {
  if (req.params.network == 'ethereum') {
    let cached = cache.get("ethereum")
    if (cached != undefined) {
        const wei = web3.utils.toWei(cached.SafeGasPrice, 'Gwei')
        return res.json({ price: wei })
    }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=58F719I6WFJ5T83YMJ5IYWEJGQCUWBH8YG',
      };
      
      axios.request(config)
      .then((response) => {
        if (!response.data.status || response.data.status != '1') {
          return res.status(500).send("Internal Server Error")
        }

        cache.set("ethereum", response.data.result, 5);
        const wei = web3.utils.toWei(response.data.result.SafeGasPrice, 'Gwei')
        return res.json({ price: wei })
      })
      .catch((error) => {
        console.log("Failed to get etherscan gas price", error)
        return res.status(500).send("Internal Server Error")
      });
    }
})

app.get('/:coin/price', (req, res) => {
  if (req.params.coin == 'eth') {
    let cached = cache.get("eth")
    if (cached != undefined) {
        return res.json({ ethereum: { usd: cached } })
    }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=cb7b9aee-09ac-4fb1-9147-ca66c188084f&id=1027',
      };
      
      axios.request(config)
      .then((response) => {
        if (!response.data.status || response.data.status.error_code != 0) {
          return res.status(500).send("Internal Server Error")
        }

        cache.set("eth", response.data.data["1027"].quote.USD.price, 300);
        return res.json({ ethereum: { usd: response.data.data["1027"].quote.USD.price } })
      })
      .catch((error) => {
        console.log("Failed to get ethereum price", error)
        return res.status(500).send("Internal Server Error")
      });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})