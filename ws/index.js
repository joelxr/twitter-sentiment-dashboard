const WebSocket = require('ws');
const request = require('request');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

const post = util.promisify(request.post);
const allow_origins = process.env.ALLOW_ORIGINS;
const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const port = process.env.PORT;
const bearerTokenURL = 'https://api.twitter.com/oauth2/token';
const streamURL = 'https://api.twitter.com/labs/1/tweets/stream/sample';
const userAgent = 'TwitterDevSampledStreamQuickStartJS';

async function bearerToken(auth) {
  const requestConfig = {
    url: bearerTokenURL,
    auth: {
      user: auth.consumer_key,
      pass: auth.consumer_secret,
    },
    form: {
      grant_type: 'client_credentials',
    },
    headers: {
      'User-Agent': userAgent,
    },
  };

  const response = await post(requestConfig);
  return JSON.parse(response.body).access_token;
}

function streamConnect(token, onData) {
  const config = {
    url: `${streamURL}?format=detailed&expansions=geo.place_id&place.format=detailed`,
    auth: {
      bearer: token,
    },
    headers: {
      'User-Agent': userAgent,
    },
    timeout: 20000,
  };

  const stream = request.get(config);

  stream
    .on('data', (data) => {
      try {
        onData(data.toString());
      } catch (e) {}
    })
    .on('error', (error) => {
      if (error.code === 'ETIMEDOUT') {
        stream.emit('timeout');
      }
    });

  return stream;
}

(async () => {
  const wss = new WebSocket.Server({
    port,
    verifyClient: ({ origin }) => {
      const allow = !!~allow_origins.split(',').indexOf(origin);
      if (allow) {
        console.log(`New connection, sending data to ${origin}`);
        return true;
      } else {
        console.log(`Denied connection from ${origin}`);
        return false;
      }
    },
  });

  let token;

  try {
    token = await bearerToken({ consumer_key, consumer_secret });
  } catch (e) {
    console.error(
      `Could not generate a Bearer token. Please check that your credentials are correct and that the Sampled Stream preview is enabled in your Labs dashboard. (${e})`
    );
    process.exit(-1);
  }

  const onData = (data) => {
    if (wss.clients.size) {
      wss.clients.forEach((ws) => {
        ws.send(data);
      });
    }
  };

  const stream = streamConnect(token, onData);

  stream.on('timeout', () => {
    console.warn('A connection error occurred. Reconnecting...');
    streamConnect(token, onData);
  });

  console.log(`Started web socket! Listening at :${process.env.PORT}`);
})();
