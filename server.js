require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");

const logger = require("./logger");

const app = express();

const models = require("./account_schema");

const port = 3000;

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri)
  .then(() => logger.info("Database connected"))
  .catch((err) => {
    logger.error("Error", err);
  });

const User = require("./userSchema");
const USD_ACCOUNT = models.USD_account;
const EUR_ACCOUNT = models.EUR_account;
const Rate = models.Rate;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(flash());
app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    (email, password, done) => {
      try {
        User.findOne({ username: email })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "Invalid Username" });
            }
            bcrypt
              .compare(password, user.password)
              .then((isMatch) => {
                if (!isMatch) {
                  return done(null, false, { message: "Invalid Password" });
                } else {
                  return done(null, user);
                }
              })
              .catch((err) => logger.error("Error", err));
          })
          .catch((err) => logger.error("Error", err));
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((user, done) => {
  done(null, user);
});

const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/app/login");
};

const checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/app/variables");
  }
  return next();
};

app.get("/app", (req, res) => {
  res.render("index");
});

app.get("/app/login", checkLoggedIn, (req, res) => {
  res.render("login", { error: null });
});

app.post(
  "/app/login",
  passport.authenticate("local", {
    successRedirect: "/app/variables",
    failureRedirect: "/app/login",
    failureFlash: true,
  })
);

app.get("/app/variables", checkAuthenticated, async (req, res) => {
  try {
    const [usdAccount, eurAccount, rate] = await Promise.all([
      USD_ACCOUNT.find({}),
      EUR_ACCOUNT.find({}),
      Rate.find({}),
    ]);

    const accountUSD = usdAccount[0];
    const accountEUR = eurAccount[0];
    const rates = { ...rate[0] };

    res.render("variables", {
      rates: rates._doc,
      account_usd: accountUSD._doc,
      account_eur: accountEUR._doc,
    });
  } catch (err) {
    console.error(err);
  }
});

app.get("/app/update-rates", checkAuthenticated, async (req, res) => {
  try {
    const [usdAccount, eurAccount, rate] = await Promise.all([
      USD_ACCOUNT.find({}),
      EUR_ACCOUNT.find({}),
      Rate.find({}),
    ]);

    const accountUSD = usdAccount[0];
    const accountEUR = eurAccount[0];
    const rates = { ...rate[0] };

    res.render("update-rates", {
      rates: rates._doc,
      account_usd: accountUSD._doc,
      account_eur: accountEUR._doc,
    });
  } catch (err) {
    console.error(err);
  }
});

app.post("/app/update-rates", (req, res) => {
  Rate.findOneAndReplace({}, { USD: req.body.USD, EUR: req.body.EUR })
    .then((updatedRate) => {
      if (updatedRate) {
        logger.info("Rates Updated");
      }
    })
    .catch((err) => {
      logger.error("Error", err);
    });
  res.redirect("/app/variables");
});

app.get("/app/update-accounts/:currency", checkAuthenticated, (req, res) => {
  let view;
  var account = {};
  if (req.params.currency === "usd") {
    view = "update-accounts-usd";

    USD_ACCOUNT.find({})
      .then((acc) => {
        account = { ...acc[0]._doc };
        res.render(view, { account: account });
      })
      .catch((err) => logger.error("Error", err));
  } else if (req.params.currency === "eur") {
    view = "update-accounts-eur";

    EUR_ACCOUNT.find({})
      .then((acc) => {
        account = { ...acc[0]._doc };
        res.render(view, { account: account });
      })
      .catch((err) => logger.error("Error", err));
  }
});

app.post("/app/update-accounts/:currency", (req, res) => {
  if (req.params.currency === "usd") {
    USD_ACCOUNT.findOneAndReplace({}, req.body)
      .then((updated) => {
        if (updated) {
          logger.info("Account Updated");
        }
      })
      .catch((err) => {
        logger.error("Error", err);
      });
  } else if (req.params.currency === "eur") {
    EUR_ACCOUNT.findOneAndReplace({}, req.body)
      .then((updated) => {
        if (updated) {
          logger.info("Account Updated");
        }
      })
      .catch((err) => {
        logger.error("Error", err);
      });
  }
  res.redirect("/app/variables");
});

app.get("/api/variables", async (req, res) => {
  try {
    const [usdAccount, eurAccount, rate] = await Promise.all([
      USD_ACCOUNT.find({}),
      EUR_ACCOUNT.find({}),
      Rate.find({}),
    ]);

    const accountUSD = usdAccount[0];
    const accountEUR = eurAccount[0];
    const rates = { ...rate[0] };

    res.send([
      {
        rates: rates._doc,
      },
      { usd: accountUSD._doc },
      { eur: accountEUR._doc },
    ]);
  } catch (err) {
    console.error(err);
  }
});

app.post("/app/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/app/login");
  });
});

app.listen(port, () => {
  logger.info("Swapflex server is now running");
});
