import express from 'express';
import { formatNumber, formatMoney } from '../helpers/format.js';
import { accountModel } from '../models/accountModels.js';

const app = express();

//1 - Endpoint de deposito
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
      res.status(404).send('Conta nao encontrada na colecao');
      return;
    }
    res.status(200).send('Saldo na conta: ' + account.balance);
  } catch (error) {
    res.status(500).send(error);
  }
});

//2 - Endpoint de saque
app.patch('/account/saque', async (req, res) => {
  let { agencia, conta, saque } = req.body;
  saque = -(saque + 1);
  try {
    const account = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });
    if (!account) {
      res.status(404).send('Conta nao encontrada na colecao');
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

//3 - endpoint de consulta do saldo
app.post('/account/getClient', async (req, res) => {
  const { agencia, conta } = req.body;
  //const account = await accountModel.find({});
  try {
    const account = await accountModel.findOne({
      $and: [{ agencia: agencia }, { conta: conta }],
    });
    if (!account) {
      res.status(404).send('Conta nao encontrada na colecao');
      return;
    }
    res.send(
      `O saldo da conta ${conta} na agencia ${agencia} é: ${account.balance}`
    );
  } catch (err) {
    res.status(5000).send(err);
  }
});

//4 - Endpoint delete
app.delete('/account/delete', async (req, res) => {
  const { agencia, conta } = req.body;

  try {
    const account = await accountModel.findOneAndDelete({
      $and: [{ agencia: agencia }, { conta: conta }],
    });

    if (!account) {
      res.status(404).send('Documento nao encontrado na colecao');
      return;
    }

    let newNumberOfAccounts = await accountModel.aggregate([
      {
        $match: {
          agencia: {
            $eq: agencia,
          },
        },
      },
      {
        $count: 'number_of_accounts',
      },
    ]);

    res
      .status(200)
      .send(
        `Número de contas ativas da agencia ${agencia}: ${newNumberOfAccounts[0].number_of_accounts}`
      );
  } catch (err) {
    res.status(500).send(err);
  }
});

//5 - Endpoint de transferência:
app.post('/account/transfer', async (req, res) => {
  const { accountFrom, accountTo, value } = req.body;
  let transferTax = 0;
  let valueToBeTransfered = 0;
  try {
    const bankBranchFrom = await accountModel.findOne(
      { conta: accountFrom },
      { _id: 0, agencia: 1, balance: 1 }
    );

    if (!bankBranchFrom) {
      res.status(404).send(`Conta ${accountFrom} nao encontrada na colecao`);
      return;
    }

    const bankBranchTo = await accountModel.findOne(
      { conta: accountTo },
      { _id: 0, agencia: 1, balance: 1 }
    );

    if (!bankBranchTo) {
      res.status(404).send(`Conta ${accountTo} nao encontrada na colecao`);
      return;
    }

    //console.log(bankBranchFrom.agencia);
    //console.log(bankBranchTo.agencia);

    if (bankBranchFrom.agencia !== bankBranchTo.agencia) transferTax = 8;
    valueToBeTransfered = value + transferTax;
    console.log(valueToBeTransfered);

    const destinyAccount = await accountModel.findOneAndUpdate(
      {
        $and: [{ agencia: bankBranchTo.agencia }, { conta: accountTo }],
      },
      { $inc: { balance: value } },
      { new: true }
    );

    const newOriginAccountValue = bankBranchFrom.balance - valueToBeTransfered;
    const originAccount = await accountModel.findOneAndUpdate(
      {
        $and: [{ agencia: bankBranchFrom.agencia }, { conta: accountFrom }],
      },
      { $set: { balance: newOriginAccountValue } },
      { new: true }
    );

    //await account.save();
    console.log(destinyAccount);
    res.send(
      `O saldo da conta ${originAccount.conta} é: ${originAccount.balance}`
    );
  } catch (err) {
    res.status(5000).send(err);
  }
});

//6 - endpoint de consulta da média de uma conta
app.post('/account/getAverage', async (req, res) => {
  const agencia = req.body.agencia;
  //const account = await accountModel.find({agencia:agencia});
  try {
    //const account = await accountModel.find({ agencia });
    //console.log(account);

    const bankBranch = await accountModel.find({ agencia: agencia });
    if (!bankBranch) {
      res.status(404).send('Conta nao encontrada na colecao');
      return;
    }

    let newNumberOfAccounts = await accountModel.aggregate([
      {
        $match: {
          agencia: {
            $eq: agencia,
          },
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $avg: '$balance',
          },
        },
      },
    ]);
    console.log(newNumberOfAccounts);
    //${newNumberOfAccounts[0].number_of_accounts
    res
      .status(200)
      .send(
        `A média dos valores da agencia ${agencia} é: ${formatMoney(
          newNumberOfAccounts[0].count
        )}`
      );
  } catch (err) {
    res.status(500).send(err);
  }
});

//7 - endpoint de consulta dos clientes com menor valor em conta
app.post('/account/smallerBalance', async (req, res) => {
  const limite = req.body.limite;

  try {
    const account = await accountModel
      .find({}, { _id: 0, name: 0 })
      .sort({ balance: 1 })
      .limit(limite);
    if (!account) {
      res.status(404).send('Nenhum valor encontrado');
      return;
    }
    res.send(account);
  } catch (err) {
    res.status(5000).send(err);
  }
});

//8 - endpoint de consulta dos clientes com maior valor em conta
app.post('/account/biggerBalance', async (req, res) => {
  const limite = req.body.limite;

  try {
    const account = await accountModel
      .find({}, { _id: 0 })
      .sort({ balance: -1, name: 1 })
      .limit(limite);
    if (!account) {
      res.status(404).send('Nenhum valor encontrado');
      return;
    }
    //console.log(account[2]);
    res.send(account);
  } catch (err) {
    res.status(5000).send(err);
  }
});

//8 - endpoint dos clientes private
app.post('/account/privateClients', async (req, res) => {
  //const limite = req.body.limite;

  try {
    const accounts = await accountModel.aggregate([
      {
        $sort: { balance: -1 },
      },

      {
        $group: {
          _id: '$agencia',
          id: { $first: '$_id' },
          name: { $first: '$name' },
          agencia: { $first: '$agencia' },
          conta: { $first: '$conta' },
          balance: { $first: '$balance' },
        },
      },
    ]);

    accounts.forEach(async (account) => {
      await accountModel.findOneAndUpdate(
        { _id: account.id },
        {
          $set: {
            agencia: 99,
          },
        }
      );
    });
    const accountsOfPrivateAggency = await accountModel.find({ agencia: 99 });
    res.send(accountsOfPrivateAggency);
  } catch (err) {
    res.status(5000).send(err);
  }
});

export { app as accountRouter };
