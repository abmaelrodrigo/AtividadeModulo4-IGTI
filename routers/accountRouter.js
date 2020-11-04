import express from 'express';
import { accountModel } from '../models/accountModels.js';

const app = express();

app.get('/account', async (req, res) => {
  const account = await accountModel.find({});
  try {
    res.send(account);
  } catch (err) {
    res.status(5000).send(err);
  }
});

//Endpoint de deposito
app.patch('/account/deposito', async (req, res) => {
  try {
    const { agencia, conta, deposito } = req.body;
    const account = await accountModel.findOneAndUpdate(
      {
        $and: [{ agencia: agencia }, { conta: conta }],
      },
      { $inc: { balance: deposito } },
      { new: true }
    );

    if (!account) {
      res.status(404).send('Conta nao encontroda na colecao');
      return;
    }
    res.status(200).send('Saldo na conta: ' + account.balance);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Endpoint de saque
app.patch('/account/saque', async (req, res) => {
  let { agencia, conta, saque } = req.body;
  saque = -(saque + 1);
  try {
    //console.log(req.body);
    //saque = -(saque + 1);
    const account = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });
    if (!account) {
      res.status(404).send('Conta nao encontroda na colecao');
      return;
    }
    if (account.balance + saque < 0) {
      res.send('Saldo insuficiente');
      return;
    }
    const balance = account.balance + saque;
    const reponse = await accountModel.findOneAndUpdate(
      {
        $and: [{ agencia: agencia }, { conta: conta }],
      },
      { $set: { balance: balance } },
      { new: true }
    );
    res.status(200).send('Saldo na conta: ' + reponse.balance);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/account', async (req, res) => {
  const account = new accountModel(req.body);

  try {
    await account.save();
    res.send(account);
  } catch (err) {
    res.status(5000).send(err);
  }
});

app.delete('/account/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const student = await accountModel.findByIdAndDelete({ _id: id });

    if (!student) {
      res.status(404).send('Documento nao encontrodo na colecao');
      return;
    }
    res.status(200).send();
  } catch (err) {
    res.status(500).send(err);
  }
});

export { app as accountRouter };
