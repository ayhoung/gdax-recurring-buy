# WARNING: USE AT YOUR OWN RISK, I TAKE NO RESPONSIBILITY FOR ANY TRANSACTIONS THAT TAKE PLACE

# GDAX Recurring Buy Script

Recurring Buy of Coinbase

### Prerequisites
1. You will need an account with GDAX, with API credentials. To be safe, only give your api credentials "trade" permissions.
2. You will need to be able to run NodeJS 8.0+
3. (Optional) Mailgun account to send yourself buy notifications.

### Installing
1. Clone this repository
2. Run `npm install`
3. Fill in configuration file at `./config.json`, see `./config.example.json` for an example.

## To do
1. Use gdax restful API instead of nodejs client to make market buys

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
