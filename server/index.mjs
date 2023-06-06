import express, { raw } from "express";
import axios from "axios";
import https from "https";
import path from 'path';
import sql from "mssql";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import passport from 'passport';
import { BearerStrategy } from 'passport-azure-ad';
import { authConfig } from './authConfig.js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

dotenv.config();


const client = jwksClient({
  timeout: 60000,
  jwksUri: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/discovery/v2.0/keys`
});

function getSigningKey(header, callback) {
  console.log(client, header);
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log("err->", err);
      console.log("key->", key);
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      console.log("signingKey->", signingKey);
      callback(null, signingKey);
    }
  });
}

async function validateAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Authorization header is missing');
  }

  const token = authHeader.split(' ')[1];
  console.log("token->", token);
  jwt.verify(token, getSigningKey, {
    // audience: process.env.AAD_ID_SCOPE,
    // issuer: `https://sts.windows.net/${process.env.AAD_TENANT_ID}/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    console.log("decoded->", decoded);
    if (err) {
      console.error(err);
      return res.status(401).send({"message":"Invalid access token", "error": err});
    }

    req.user = decoded;
    next();
  });
}



const options = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AAD_CLIENT_ID,
  audience: process.env.AAD_CLIENT_ID,
  loggingLevel: 'info',
  passReqToCallback: false,
};

// const bearerStrategy = new BearerStrategy(options, (token, done) => {
//   // Send the user info (token) to the next middleware
//   done(null, token, null);
// });

const bearerStrategy = new BearerStrategy({
  identityMetadata: `https://${authConfig.metadata.authority}/${authConfig.credentials.tenantID}/${authConfig.metadata.version}/${authConfig.metadata.discovery}`,
  issuer: `https://${authConfig.metadata.authority}/${authConfig.credentials.tenantID}/${authConfig.metadata.version}`,
  clientID: authConfig.credentials.clientID,
  audience: authConfig.credentials.clientID, // audience is this application
  validateIssuer: authConfig.settings.validateIssuer,
  passReqToCallback: authConfig.settings.passReqToCallback,
  loggingLevel: authConfig.settings.loggingLevel,
  loggingNoPII: authConfig.settings.loggingNoPII,
}, (req, token, done) => {
  /**
   * Access tokens that have neither the 'scp' (for delegated permissions) nor
   * 'roles' (for application permissions) claim are not to be honored.
   */
  // if (!token.hasOwnProperty('scp') && !token.hasOwnProperty('roles')) {
  //     return done(new Error('Unauthorized'), null, "No delegated or app permission claims found");
  // }
  console.log("token->", token);
  /**
   * If needed, pass down additional user info to route using the second argument below.
   * This information will be available in the req.user object.
   */
  return done(null, {}, token);
});



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.NODE_PORT || 3000;

app.use(passport.initialize());
passport.use(bearerStrategy);

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
};

// 让Express托管静态文件，这里假设Vue.js构建输出在'dist'目录中
// app.use(express.static(path.join(__dirname, 'dist')));


app.use(express.json());
const apiUrl =
  "https://" + process.env.VUE_APP_APIM_HOST + "/chat/completions?api-version=2023-05-15";

const apiKey = process.env.VUE_APP_APIM_KEY;

let msgid = 0;
// List apps
app.get("/api/gptapps/list", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM tblGPTApps`;
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching app list," + err.originalError);
  }
});

// Add a new app
app.post("/api/gptapps/add", async (req, res) => {
  const { name, description, dataground, temperature, max_tokens, top_p, welcome } = req.body;

  try {
    await sql.connect(config);
    await sql.query`INSERT INTO tblGPTApps (name, description, dataground, temperature, max_tokens, top_p, welcome) VALUES (${name},${description}, ${dataground}, ${temperature}, ${max_tokens}, ${top_p},  ${welcome})`;
    res.status(201).send("App added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding app");
  }
});

app.get("/api/gptapps/:appName", passport.authenticate('oauth-bearer', {
  session: false,
}), async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM tblGPTApps where name = ${req.params.appName}`;
    if (result.recordset.length > 0) {
      res.json(result.recordset);
    } else {
      res.status(404).send("App not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({"message": "Error fetching app, pls check your public IP in sql server firewall", "error": err});
  }
});


// Delete an app
app.delete("/api/gptapps/delete/:id", async (req, res) => {
  const appId = req.params.id;

  try {
    await sql.connect(config);
    await sql.query`DELETE FROM tblGPTApps WHERE app_id = ${appId}`;
    res.send("App deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting app");
  }
});

app.post("/api/chat/completions", async (req, res) => {
  try {
    const response = await axios.post(apiUrl, req.body, {
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/chat/completions/stream", validateAccessToken, (req, res) => {
  // console.log("req->", req.body);
  const requestBody = JSON.stringify(req.body);
  const proxyReq = https.request(
    {
      method: "POST",
      hostname: process.env.VUE_APP_APIM_HOST,
      path:
        "/chat/completions?api-version=2023-05-15",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
        "MsgId": msgid++,
      },
    },
    (proxyRes) => {
      let rawData = "";

      proxyRes.on("error", (error) => {
        console.error("Error with the request:", error.message);
        res.statusCode = 500;
        res.end("Error with the request", error.message);
      });
      proxyRes.on("data", (chunk) => {
        // console.log("chunk->", chunk);
        res.write(chunk);
        rawData += chunk;
      });

      proxyRes.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          // console.log("Parsed data:", rawData);
          //   res.writeHead(proxyRes.statusCode, proxyRes.headers);
          res.statusCode = proxyRes.statusCode;

          if (rawData.length > 0) {
            if (rawData.indexOf("error") > -1) {
              // console.log(parsedData.error);
              res.statusCode = 500;
            }
            // res.write(rawData);
          }
          res.end(); // Send the parsed data as a response to the client-side
        } catch (error) {
          console.error("Error parsing the response:", error.message);
          res.statusCode = 500;
          res.end("Error parsing the response");
        }
      });
    }
  );

  proxyReq.write(requestBody);
  proxyReq.end();
  // req.pipe(proxyReq, { end: true });
});

// 对于任何其他请求，均返回Vue.js的index.html文件
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`ChatGPT proxy server is running at http://localhost:${port}`);
});
