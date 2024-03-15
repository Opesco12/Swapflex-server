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
const app = express();

const port = 3000;

const uri = "mongodb://127.0.0.1:27017/swapflex";

mongoose
  .connect(uri)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));

const store = new MongoStore({
  uri: "mongodb://127.0.0.1:27017/swapflex", //process.env.MONGODB_URI, // Replace with your MongoDB connection string
  collection: "sessions", // Name of the MongoDB collection to store sessions
});

// SwapFlex-admin     unconditional
// swapflex           unremorseful

const User = require("./userSchema");

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
              .catch((err) => console.log(err));
          })
          .catch((err) => console.log(err));
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
  res.redirect("/api/login");
};

const checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/api/variables");
  }
  return next();
};

const variables = [
  {
    rate: [{ USD: 1520 }, { EUR: 2000 }],
  },
  {
    MAX: [{ USD: 2100 }, { EUR: 2300 }],
  },
  {
    ACCOUNT_USD: {
      "Account Holder": "Emmanuel Agburum",
      "Bank Name": "WELLS FARGO BANK, N.A",
      "Account Number": "40630152542797550",
      "Routing Number": "121000248",
      "Account Type": "Checking",
      Address:
        "651, North Broad Street, Suite 206, Middletown, 19709 Delaware, USA",
    },
  },
  {
    ACCOUNT_EUR: {
      "Account Holder": "Emmanuel Agburum",
      "Bank Name": "Clear Junction Limited",
      IBAN: "GB47CLJU04130739195984",
      "Bic code": "GB47CLJU",
      "Sort Code": "041307",
      "Swift Code": "CLJUGB21XXX",
      Address: "16 Mortimer Street, London, W1T 3JL, United Kingdom",
    },
  },
];

// The max values are in their respective currencies...either USD or EUR

app.get("/api", (req, res) => {
  res.render("index");
});

app.get("/api/login", checkLoggedIn, (req, res) => {
  res.render("login", { error: null });
});

app.post(
  "/api/login",
  passport.authenticate("local", {
    successRedirect: "/api/variables",
    failureRedirect: "/api/login",
    failureFlash: true,
  })
);

app.get("/api/variables", checkAuthenticated, (req, res) => {
  res.render("variables", {
    rates: variables[0].rate,
    max: variables[1].MAX,
    account_usd: variables[2].ACCOUNT_USD,
    account_eur: variables[3].ACCOUNT_EUR,
  });
});

app.post("/api/rates", (req, res) => {
  res.send("New Global Variables have been set...");
});

app.get("/api/update-rates", (req, res) => {
  res.render("update-rates", {
    rates: variables[0].rate,
    max: variables[1].MAX,
  });
});

// app.get("/api/create-user", (req, res) => {
//   const user = new User({
//     username: "SwapFlex-admin",
//     password: "unconditional",
//   });

//   user
//     .save()
//     .then(() => console.log("SUccesfully created a new admin user"))
//     .catch((error) => console.log(error));
//   res.send("Details received");
// });

app.post("/api/update-rates", (req, res) => {
  // console.log(req.body.USD[0]);
  variables[0].rate[0].USD = req.body.USD[0];
  variables[0].rate[1].EUR = req.body.EUR[0];
  variables[1].MAX[0].USD = req.body.USD[1];
  variables[1].MAX[1].EUR = req.body.EUR[1];
  res.redirect("/api/variables");
});

app.get("/api/update-accounts/:currency", (req, res) => {
  let view;
  let account;
  if (req.params.currency === "usd") {
    view = "update-accounts-usd";
    account = variables[2].ACCOUNT_USD;
  } else if (req.params.currency === "eur") {
    view = "update-accounts-eur";
    account = variables[3].ACCOUNT_EUR;
  }
  res.render(view, { account: account });
});

app.post("/api/update-accounts/:currency", (req, res) => {
  if (req.params.currency === "usd") {
    variables[2].ACCOUNT_USD = req.body;
  } else if (req.params.currency === "eur") {
    variables[3].ACCOUNT_EUR = req.body;
  }
  res.redirect("/api/variables");
});

app.post("/api/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/api/login");
  });
});

app.listen(port, () => {
  console.log("Swapflex server is now running");
});
