import pg from "pg";
import dotenv from "dotenv";

//carrega variaveis do arquivo .env (environment, mas o que é o dotenv e o pg?)

dotenv.config();
//o que exatamente é esse const pool?
const { Pool } = pg;

//eu entendi que isso aqui são as variaveis criadas no env... mas
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export default pool;
