const Promise = require('bluebird');
const Gdax = require('gdax');
const bunyan = require('bunyan');
const bformat = require('bunyan-format');

const formatOut = bformat({ outputMode: 'long' });
const logger = bunyan.createLogger({ name: 'app', stream: formatOut, level: 'debug' });

const btcClient = new Gdax.PublicClient('BTC-USD');
const ethClient = new Gdax.PublicClient('ETH-USD');
const ltcClient = new Gdax.PublicClient('LTC-USD');

const config = require('./config');

// mail gun settings
const mailgun = config.mailgun.apiKey.length ? require('mailgun-js')({
    apiKey: config.mailgun.apiKey,
    domain: config.mailgun.domain,
}) : null;

const SCRIPT_TIME_INTERVAL = 60 * 1000; // 1 hour
const apiURI = config.sandboxMode ? 'https://api-public.sandbox.gdax.com' : 'https://api.gdax.com';
const authedClient = new Gdax.AuthenticatedClient(
    config.gdax.apiKey,
    config.gdax.secret,
    config.gdax.passPhrase,
    apiURI,
);

function _getDifferenceInDays(lastFillUTCString) {
    return ((new Date().getTime() - new Date(lastFillUTCString).getTime()) / (1000 * 60 * 60 * 24)).toFixed(2);
}

async function _executeBuy(marketPrice, product) {
    const buyParams = {
        price: marketPrice, // USD
        size: 0.01,
        product_id: product,
    };
    const buyOrder = await authedClient.buy(buyParams);

    logger.info(buyOrder);

    const data = {
        from: config.email,
        to: config.email,
        subject: `Order executed for ${product}`,
        text: `A buy order has been made for ${buyParams.size} ${buyParams.product_id} at $${parseFloat(marketPrice).toFixed(2)}\n\nDetails:\n${JSON.stringify(buyOrder, null, 2)}`,
    };

    return mailgun ? mailgun.messages().send(data) : Promise.resolve();
}

async function _confirmCoin(coin) {
    const fills = await authedClient.getFills({ product_id: coin.id });
    logger.info(`Last ${coin.name} fill was ${_getDifferenceInDays(fills[0].created_at)} days ago...`);

    if (!fills.length || (fills.length && _getDifferenceInDays(fills[0].created_at) >= config.btc.occurrence)) {
        logger.info(`Executing order for ${config.eth.size} ${coin.name}s at ${parseFloat(coin.ticker.price).toFixed(2)}`);
        await _executeBuy(coin.ticker.price, coin.id);
    }
}

async function main() {
    const coins = [];
    const coinTypes = {
        btc: {
            id: 'BTC-USD',
            name: 'Bitcoin',
            ticker: await btcClient.getProductTicker(),
            size: config.btc.size,
        },
        eth: {
            id: 'ETH-USD',
            name: 'Ethereum',
            ticker: await ethClient.getProductTicker(),
            size: config.eth.size,
        },
        ltc: {
            id: 'LTC-USD',
            name: 'Litecoin',
            ticker: await ltcClient.getProductTicker(),
            size: config.ltc.size,
        },
    };

    if (config.btc) coins.push(coinTypes.btc);
    if (config.eth) coins.push(coinTypes.eth);
    if (config.ltc) coins.push(coinTypes.ltc);

    try {
        logger.info('Getting gdax information...');
        await Promise.mapSeries(coins, coin => _confirmCoin(coin));
        setTimeout(() => {
            main();
        }, SCRIPT_TIME_INTERVAL);
    } catch (err) {
        logger.error(err);
    }
}

main();
