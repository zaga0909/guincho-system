require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {

  if (err) {

    console.log("❌ Erro banco:", err);

  } else {

    console.log("✅ Banco conectado!");

    db.query(`
      CREATE TABLE IF NOT EXISTS solicitacoes_nova (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100),
        whatsapp VARCHAR(20),
        cidade VARCHAR(100),
        estado VARCHAR(10),
        descricao TEXT,
        status VARCHAR(30) DEFAULT 'Pendente'
      )
    `);

    db.query(`
      CREATE TABLE IF NOT EXISTS guincheiros (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100),
        whatsapp VARCHAR(20),
        cidade VARCHAR(100),
        estado VARCHAR(10)
      )
    `);

  }

});

// HOME
app.get("/", (req, res) => {

  res.sendFile(path.join(__dirname, "public", "index.html"));

});

// NOVO PEDIDO
app.post("/solicitar", (req, res) => {

  const {
    nome,
    whatsapp,
    cidade,
    estado,
    descricao
  } = req.body;

  db.query(

    `INSERT INTO solicitacoes_nova
    (nome, whatsapp, cidade, estado, descricao)
    VALUES (?, ?, ?, ?, ?)`,

    [nome, whatsapp, cidade, estado, descricao],

    (err) => {

      if (err) {

        console.log(err);

        return res.json({
          erro: "Erro ao salvar solicitação"
        });

      }

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

          if (result.length === 0) {

            return res.json({
              msg: "Nenhum guincheiro encontrado"
            });

          }

          const g = result[0];

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

    "SELECT * FROM solicitacoes_nova ORDER BY id DESC",

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

// ALTERAR STATUS
app.put("/status/:id", (req, res) => {

  const { status } = req.body;

  db.query(

    "UPDATE solicitacoes_nova SET status=? WHERE id=?",

    [status, req.params.id],

    (err) => {

      if (err) {

        console.log(err);

        return res.json({
          erro: "Erro ao atualizar status"
        });

      }

      res.json({
        sucesso: true
      });

    }

  );

});

app.listen(process.env.PORT || 3000, () => {

  console.log("🚀 Servidor online!");

});