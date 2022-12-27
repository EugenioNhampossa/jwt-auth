const e = require("express");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const users = [
  {
    id: "1",
    username: "eugenio",
    password: "eugenio123",
    isAdmin: true,
  },
  {
    id: "2",
    username: "nhampossa",
    password: "nhampossa123",
    isAdmin: false,
  },
];

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
  //take the refresh token from the user,
  const refreshToken = req.body.token;
  //send error if there is no token or its invalid,
  if (!refreshToken) {
    return res.status(401).json("You are not authenticaded");
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid");
  }
  jwt.verify(refreshToken, "refreshSecretKey", (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newrefreshToken = generateRefreshToken(user);

    refreshTokens.push(refreshToken);

    res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newrefreshToken });
  });

  //if everything is ok, create nem access token
});

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    "secretKey",
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    "refreshSecretKey"
  );
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    //Generate Web token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json("Username or password incorect!");
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, "secretKey", (err, user) => {
      if (err) {
        res.status(403).json("Token is not valid");
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated");
  }
};

app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("You logued out successfully");
});

app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User Deleted");
  } else {
    throw new Error();
    res.status(200).json("You are not allowed to delete this user");
  }
});

app.listen(3333, () => console.log("Server Started"));
