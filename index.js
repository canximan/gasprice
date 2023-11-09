const express = require('express')
const axios = require('axios');
const cors = require('cors')
const NodeCache = require('node-cache')

const cache = new NodeCache()
const app = express()
const port = 3003

app.use(cors())
app.options('*', cors())
app.get('/price/:network', (req, res) => {
  if (req.params.network == 'ethereum') {
    let cached = cache.get("ethereum")
    if (cached != undefined) {
        return res.json({ price: cached.SafeGasPrice })
    }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=58F719I6WFJ5T83YMJ5IYWEJGQCUWBH8YG',
      };
      
      axios.request(config)
      .then((response) => {
        if (!response.data.status || response.data.status != '1') {
            return res.status(500)
        }

        cache.set( "ethereum", response.data.result, 5 );
        return res.json({ price: response.data.result.SafeGasPrice })
      })
      .catch((error) => {
        console.log("Failed to get etherscan gas price", error)
        return res.status(500)
      });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})