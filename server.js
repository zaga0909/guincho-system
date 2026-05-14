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
        bairro VARCHAR(100),
        endereco VARCHAR(255),
        referencia VARCHAR(255),
        latitude VARCHAR(50),
        longitude VARCHAR(50),
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
        estado VARCHAR(10),
        senha VARCHAR(100)
      )
    `);

    db.query(`
      ALTER TABLE guincheiros
      ADD COLUMN senha VARCHAR(100)
    `, () => {});

  }

});

// HOME
app.get("/", (req, res) => {

  res.sendFile(path.join(__dirname, "public", "index.html"));

});

// LOGIN GUINCHEIRO
app.post("/login-guincheiro", (req, res) => {

  const { whatsapp, senha } = req.body;

  db.query(

    `SELECT * FROM guincheiros
    WHERE whatsapp=? AND senha=?`,

    [whatsapp, senha],

    (err, result) => {

      if (err) {

        return res.json({
          erro: "Erro login"
        });

      }

      if (result.length === 0) {

        return res.json({
          erro: "WhatsApp ou senha inválidos"
        });

      }

      res.json({
        sucesso: true,
        guincheiro: result[0]
      });

    }

  );

});

// NOVO PEDIDO
app.post("/solicitar", (req, res) => {

  const {
    nome,
    whatsapp,
    cidade,
    estado,
    bairro,
    endereco,
    referencia,
    latitude,
    longitude,
    descricao
  } = req.body;

  db.query(

    `INSERT INTO solicitacoes_nova
    (nome, whatsapp, cidade, estado,
    bairro, endereco, referencia,
    latitude, longitude, descricao, status)

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    [
      nome,
      whatsapp,
      cidade,
      estado,
      bairro,
      endereco,
      referencia,
      latitude,
      longitude,
      descricao,
      "Pendente"
    ],

    (err) => {

      if (err) {

        console.log(err);

        return res.json({
          erro: "Erro ao salvar"
        });

      }

      db.query(

        `SELECT * FROM guincheiros
        WHERE LOWER(cidade)=LOWER(?)
        AND UPPER(estado)=UPPER(?)
        LIMIT 1`,

        [cidade, estado],

        (err2, result) => {

          if (result.length === 0) {

            return res.json({
              msg: "Nenhum guincheiro encontrado"
            });

          }

          const g = result[0];

          const mapa =
            latitude && longitude
            ?
            `https://www.google.com/maps?q=${latitude},${longitude}`
            :
            "Sem GPS";

          const link =
          `https://wa.me/${g.whatsapp}?text=

🚨 Novo pedido de guincho

Cliente: ${nome}

Cidade: ${cidade}/${estado}

Bairro: ${bairro}

Endereço: ${endereco}

Referência: ${referencia}

Descrição: ${descricao}

📍 ${mapa}

`;

          res.json({
            sucesso:true,
            whatsapp:link
          });

        }

      );

    }

  );

});

// PEDIDOS
app.get("/pedidos", (req, res) => {

  db.query(

    `SELECT * FROM solicitacoes_nova
    ORDER BY id DESC`,

    (err, result) => {

      res.json(result);

    }

  );

});

// STATUS
app.put("/status/:id", (req, res) => {

  const { status } = req.body;

  db.query(

    `UPDATE solicitacoes_nova
    SET status=?
    WHERE id=?`,

    [status, req.params.id],

    () => {

      res.json({
        sucesso:true
      });

    }

  );

});

// GUINCHEIROS
app.get("/guincheiros", (req, res) => {

  db.query(

    `SELECT * FROM guincheiros
    ORDER BY id DESC`,

    (err, result) => {

      res.json(result);

    }

  );

});

// CADASTRAR GUINCHEIRO
app.post("/guincheiros", (req, res) => {

  const {
    nome,
    whatsapp,
    cidade,
    estado,
    senha
  } = req.body;

  db.query(

    `INSERT INTO guincheiros
    (nome, whatsapp, cidade, estado, senha)

    VALUES (?, ?, ?, ?, ?)`,

    [
      nome,
      whatsapp,
      cidade,
      estado,
      senha
    ],

    (err) => {

      if (err) {

        return res.json({
          erro:"Erro cadastro"
        });

      }

      res.json({
        sucesso:true
      });

    }

  );

});

// EXCLUIR
app.delete("/guincheiros/:id", (req, res) => {

  db.query(

    `DELETE FROM guincheiros
    WHERE id=?`,

    [req.params.id],

    () => {

      res.json({
        sucesso:true
      });

    }

  );

});

app.listen(process.env.PORT || 3000, () => {

  console.log("🚀 Servidor online!");

});