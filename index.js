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
        url: 'https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=58F719I6WFJ5T83YMJ5IYWEJGQCUWBH8YG',
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
  if (req.params.coin == 'eth' || req.params.coin == 'ether') {
    let cached = cache.get("eth")
    if (cached != undefined) {
        if (req.params.coin == 'eth') {
          return res.json({ ethereum: { usd: cached } })
        } else {
          return res.json({ price: { usd: cached } })
        }
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
        if (req.params.coin == 'eth') {
          return res.json({ ethereum: { usd: response.data.data["1027"].quote.USD.price } })
        } else {
          return res.json({ price: { usd: response.data.data["1027"].quote.USD.price } })
        }
      })
      .catch((error) => {
        console.log("Failed to get ethereum price", error)
        return res.status(500).send("Internal Server Error")
      });
    } else if (req.params.coin == "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" || req.params.coin == '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {// usdc
      return res.json({ price: { usd: 1 } })
    }  else if (req.params.coin == "0xC93a6cd4FDe9f1Ff69DbEA4081c368804581BFBB" || req.params.coin == '0xc93a6cd4fde9f1ff69dbea4081c368804581bfbb') {// wcau
      let cached = cache.get(req.params.coin)
      if (cached != undefined) {
          return res.json({ price: { usd: cached } })
      }

      let data = JSON.stringify({
        "currency": "USD",
        "code": "CAU",
        "meta": true
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.livecoinwatch.com/coins/single',
        headers: { 
          'accept': '*/*', 
          'accept-language': 'en-US,en;q=0.9', 
          'content-type': 'application/json', 
          'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
          'sec-ch-ua-mobile': '?0', 
          'sec-ch-ua-platform': '"macOS"', 
          'sec-fetch-dest': 'empty', 
          'sec-fetch-mode': 'cors', 
          'sec-fetch-site': 'same-site', 
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 
          'x-api-key': '79f44f6f-6610-4509-83ff-2afc72cf4297'
        },
        data : data
      };

      axios.request(config)
      .then((response) => {
        if (!response.data.rate) {
          return res.status(500).send("Internal Server Error")
        }

        cache.set(req.params.coin, response.data.rate, 60);
        return res.json({ price: { usd: response.data.rate } })
      })
      .catch((error) => {
        console.log("Failed to get token price", error)
        return res.status(500).send("Internal Server Error")
      });

    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})