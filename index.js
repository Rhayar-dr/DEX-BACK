const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const axios = require('axios');

app.get("/tokenPrice", async (req, res) => {

  const {query} = req;

  const responseOne = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressOne
  })

  const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressTwo
  })

  const usdPrices = {
    tokenOne: responseOne.raw.usdPrice,
    tokenTwo: responseTwo.raw.usdPrice,
    ratio: responseOne.raw.usdPrice/responseTwo.raw.usdPrice
  }

  return res.status(200).json(usdPrices);
});

// Rota de proxy para 'approve/allowance'
app.get("/1inch/approve/allowance", async (req, res) => {
  const config = {
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY_1INCH}`
    },
    params: {}
  };
  const { tokenAddress, walletAddress } = req.query;
  try {
    const url = `https://api.1inch.dev/swap/v5.2/1/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;
    const response = await axios.get(url,config);
    await delay(1000);
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao fazer a requisição para a API da 1inch:", error);
    if(error.response && error.response.status === 429) {
      // Tratar o erro 429 especificamente
      return res.status(429).send("Too Many Requests");
    }
    res.status(500).send("Internal Server Error");
  }
});

// Rota de proxy para 'approve/transaction'
app.get("/1inch/approve/transaction", async (req, res) => {
  const { tokenAddress } = req.query;
  const config = {
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY_1INCH}`
    },
    params: {}
  };
  try {
    const url = `https://api.1inch.dev/swap/v5.2/1/approve/transaction?tokenAddress=${tokenAddress}`;
    const response = await axios.get(url,config);
    await delay(1000);
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao fazer a requisição para a API da 1inch:", error);
    if(error.response && error.response.status === 429) {
      // Tratar o erro 429 especificamente
      return res.status(429).send("Too Many Requests");
    }
    res.status(500).send("Internal Server Error");
  }
});

app.get("/1inch/swap", async (req, res) => {
  const config = {
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY_1INCH}`
    }
  };
  const { fromTokenAddress, toTokenAddress, amount, fromAddress, slippage } = req.query;

  try {
    const url = `https://api.1inch.dev/swap/v5.2/1/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}`;
    const response = await axios.get(url, config);
    res.json(response.data);
  } catch (error) {
    console.error("Error in 1inch swap request:", error);
    res.status(500).send("Internal Server Error");
  }
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
});
