import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    require: true,
  },

  conta: {
    type: Number,
    require: true,
  },

  name: {
    type: String,
    require: true,
  },

  balance: {
    type: Number,
    require: true,
    validate(balance) {
      if (balance < 0) throw new Error('Valor negativo para nota');
    },
  },
});

const accountModel = mongoose.model('account', accountSchema, 'account');

export { accountModel };
