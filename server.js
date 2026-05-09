require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// CONFIG
app.use(cors());
app.use(express.json());

// FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// MYSQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// TESTAR CONEXÃO
db.connect((err) => {

  if (err) {
    console.log("❌ Erro banco:", err);
  } else {
    console.log("✅ Banco conectado!");
  }

});

// ROTA INICIAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// SOLICITAR GUINCHO
app.post("/solicitar", (req, res) => {

  const {
    nome,
    whatsapp,
    cidade,
    estado,
    descricao
  } = req.body;

  // SALVAR NO BANCO
  db.query(

    `INSERT INTO solicitacoes
    (id, nome, whatsapp, cidade, estado, descricao)
    VALUES (NULL, ?, ?, ?, ?, ?)`,

    [nome, whatsapp, cidade, estado, descricao],

    (err) => {

      if (err) {
        console.log(err);

        return res.json({
          erro: "Erro ao salvar solicitação"
        });
      }

      // BUSCAR GUINCHEIRO
      db.query(

        `SELECT * FROM guincheiros
        WHERE cidade = ?
        AND estado = ?
        LIMIT 1`,

        [cidade, estado],

        (err2, result) => {

          if (err2) {

            console.log(err2);

            return res.json({
              erro: "Erro ao buscar guincheiro"
            });

          }

          // SEM GUINCHEIRO
          if (result.length === 0) {

            return res.json({
              msg: "Nenhum guincheiro encontrado"
            });

          }

          const g = result[0];

          // LINK WHATSAPP
          const link = `https://wa.me/${g.whatsapp}?text=🚨 Novo pedido de guincho

Cliente: ${nome}
Cidade: ${cidade}
Estado: ${estado}
Descrição: ${descricao}`;

          res.json({
            sucesso: true,
            whatsapp: link
          });

        }

      );

    }

  );

});

// LISTAR PEDIDOS
app.get("/pedidos", (req, res) => {

  db.query(
    "SELECT * FROM solicitacoes ORDER BY id DESC",

    (err, result) => {

      if (err) {

        console.log(err);

        return res.json({
          erro: "Erro ao buscar pedidos"
        });

      }

      res.json(result);

    }

  );

});

// INICIAR SERVIDOR
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Servidor online!");
});