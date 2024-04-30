const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const USD_schema = new mongoose.Schema({
    account_holder: {
      type: String,
      required: true,
    },
    bank_name: {
      type: String,
      required: true,
    },
    account_number: {
      type: String,
      required: true,
      unique: true
    },
    routing_number: {
      type: String,
      required: true,
    },
    account_type: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    max_amount_receivable: {
      type: Number,
      required: true   //The max amount receivable is in that particular currency
    }
  });

  const EUR_schema = new mongoose.Schema({
    account_holder: {
      type: String,
      required: true
    },
    bank_name: {
      type: String,
      required: true
    },
    iban: {
      type: String,
      required: true
    },
    bic_code: {
      type:String,
      required: true
    },
    sort_code: {
      type: String,
      required: true
    },
    swift_code: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    max_amount_receivable: {
      type: Number,
      required: true    //The max amount receivable is in that particular currency
    }
  });

  const rateSchema = new mongoose.Schema({
      USD: {
        type: Number,
        required: true
      },
      EUR: {
        type: Number,
        required: true
      }
  });

  const models = {
    USD_account: mongoose.model('USD_account', USD_schema),
    EUR_account: mongoose.model('EUR_account', EUR_schema),
    Rate: mongoose.model('Rate', rateSchema)
  };
  
  
  module.exports = models;