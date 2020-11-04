import mongoose from 'mongoose';
import express from 'express';

import { accountRouter } from './routers/accountRouter.js';
mongoose.set('useFindAndModify', false);
const app = express();

//conexão com o MongoDB Atlas
(async () => {
  try {
    mongoose.connect(
      'mongodb+srv://abmaelrodrigo:8802@cluster0.gcynw.mongodb.net/accounts?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado ao MongoDB Atlas');
  } catch (error) {
    console.log('Erro ao conectar ao MongoDB Atlas ' + error);
  }
})();

app.use(express.json());
app.use(accountRouter);
app.listen(3000, () => console.log('API iniciada'));
app.listen(process.env.PORT, () => console.log('Servidor em execucao'));
