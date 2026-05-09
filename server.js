require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// CONEXÃO COM BANCO
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.log("❌ Erro banco:", err);
  } else {
    console.log("✅ Banco conectado!");
  }
});

// 🔥 CRIAR SOLICITAÇÃO DE GUINCHO
app.post("/solicitar", (req, res) => {
  const { nome, whatsapp, cidade, estado, descricao } = req.body;

  db.query(
    "INSERT INTO solicitacoes (nome, whatsapp, cidade, estado, descricao) VALUES (?,?,?,?,?)",
    [nome, whatsapp, cidade, estado, descricao],
    (err) => {
      if (err) return res.json({ erro: err });

      db.query(
        "SELECT * FROM guincheiros WHERE cidade = ? AND estado = ? LIMIT 1",
        [cidade, estado],
        (err2, result) => {
          if (err2) return res.json({ erro: err2 });

          if (result.length === 0) {
            return res.json({ msg: "Nenhum guincho na região" });
          }

          const g = result[0];

          const link = `https://wa.me/${g.whatsapp}?text=🚨 Novo pedido de guincho em ${cidade} - Cliente: ${nome}`;

          res.json({
            msg: "Pedido enviado com sucesso!",
            whatsapp: link
          });
        }
      );
    }
  );
});

// 📊 LISTAR PEDIDOS (PAINEL)
app.get("/pedidos", (req, res) => {
  db.query(
    "SELECT * FROM solicitacoes ORDER BY id DESC",
    (err, result) => {
      if (err) return res.json({ erro: err });
      res.json(result);
    }
  );
});

// 🚀 RODAR SERVIDOR
app.listen(process.env.PORT, () => {
  console.log("🚀 Servidor rodando na porta", process.env.PORT);
});