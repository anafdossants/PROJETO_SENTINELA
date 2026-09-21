const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();


// ======================================================
// CONFIGURAÇÕES
// ======================================================

app.use(cors());

app.use(express.json());


// ======================================================
// BANCO DE DADOS
// ======================================================

// IMPORTANTE:
// Se o server.js estiver dentro da pasta backend,
// use:
// const DB_FILE = path.join(__dirname, "db.json");

const DB_FILE = path.join(
    __dirname,
    "../backend/db.json"
);


// ======================================================
// BANCO VAZIO
// ======================================================

function bancoVazio() {

    return {
        usuarios: [],
        pacientes: [],
        triagens: [],
        consultas: []
    };

}


// ======================================================
// LER BANCO
// ======================================================

function readDB() {

    try {

        if (!fs.existsSync(DB_FILE)) {

            const db = bancoVazio();

            writeDB(db);

            return db;

        }

        const data =
            fs.readFileSync(
                DB_FILE,
                "utf8"
            );

        if (!data.trim()) {

            return bancoVazio();

        }

        const db =
            JSON.parse(data);

        db.usuarios =
            Array.isArray(db.usuarios)
                ? db.usuarios
                : [];

        db.pacientes =
            Array.isArray(db.pacientes)
                ? db.pacientes
                : [];

        db.triagens =
            Array.isArray(db.triagens)
                ? db.triagens
                : [];

        db.consultas =
            Array.isArray(db.consultas)
                ? db.consultas
                : [];

        return db;

    }

    catch (error) {

        console.error(
            "Erro ao ler banco:",
            error
        );

        return bancoVazio();

    }

}


// ======================================================
// SALVAR BANCO
// ======================================================

function writeDB(data) {

    try {

        const pasta =
            path.dirname(DB_FILE);

        if (!fs.existsSync(pasta)) {

            fs.mkdirSync(
                pasta,
                {
                    recursive: true
                }
            );

        }

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

        return true;

    }

    catch (error) {

        console.error(
            "Erro ao salvar banco:",
            error
        );

        return false;

    }

}


// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {

    res.status(200).send(`
        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Sistema Sentinela</title>

            <style>

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    background: #f4f7fb;
                    color: #1f2937;
                }

                .container {
                    width: 90%;
                    max-width: 600px;
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow:
                        0 10px 30px
                        rgba(0, 0, 0, 0.08);
                    text-align: center;
                }

                .status {
                    display: inline-block;
                    margin-top: 10px;
                    padding: 10px 18px;
                    border-radius: 999px;
                    background: #dcfce7;
                    color: #166534;
                    font-weight: bold;
                }

            </style>

        </head>

        <body>

            <div class="container">

                <h1>
                    🩺 Sistema Sentinela
                </h1>

                <div class="status">
                    API funcionando
                </div>

                <p>
                    A API está online e pronta para receber solicitações.
                </p>

            </div>

        </body>

        </html>
    `);

});


// ======================================================
// STATUS
// ======================================================

app.get("/status", (req, res) => {

    res.json({

        sistema: "Sentinela",

        status: "online",

        mensagem:
            "API funcionando corretamente",

        data:
            new Date().toISOString()

    });

});


// ======================================================
// LOGIN
// ======================================================

app.post("/login", (req, res) => {

    try {

        const db = readDB();

        const usuario =
            req.body.usuario;

        const senha =
            req.body.senha;

        if (!usuario || !senha) {

            return res.status(400).json({

                erro:
                    "Usuário e senha são obrigatórios"

            });

        }

        const user =
            db.usuarios.find(
                (u) =>
                    u.usuario === usuario &&
                    u.senha === senha
            );

        if (!user) {

            return res.status(401).json({

                erro:
                    "Login inválido"

            });

        }

        return res.json(user);

    }

    catch (error) {

        console.error(
            "Erro no login:",
            error
        );

        return res.status(500).json({

            erro:
                "Erro interno no servidor"

        });

    }

});


// ======================================================
// ATENDIMENTO / CADASTRAR PACIENTE
// ======================================================

app.post("/atendimento", (req, res) => {

    try {

        const db = readDB();

        const nome =
            req.body.nome;

        const cpf =
            req.body.cpf || "";

        const tipo =
            req.body.tipo || "Particular";

        if (!nome) {

            return res.status(400).json({

                erro:
                    "Nome do paciente é obrigatório"

            });

        }

        const paciente = {

            id: Date.now(),

            nome: nome,

            cpf: cpf,

            tipo: tipo,

            status: "triagem",

            createdAt:
                new Date().toISOString()

        };

        db.pacientes.push(
            paciente
        );

        if (!writeDB(db)) {

            return res.status(500).json({

                erro:
                    "Não foi possível salvar o paciente"

            });

        }

        return res.status(201).json(
            paciente
        );

    }

    catch (error) {

        console.error(
            "Erro no atendimento:",
            error
        );

        return res.status(500).json({

            erro:
                "Erro interno no servidor"

        });

    }

});


// ======================================================
// LISTAR PACIENTES
// ======================================================

app.get("/pacientes", (req, res) => {

    try {

        const db = readDB();

        return res.json(
            db.pacientes
        );

    }

    catch (error) {

        console.error(
            "Erro ao listar pacientes:",
            error
        );

        return res.status(500).json({

            erro:
                "Não foi possível carregar os pacientes"

        });

    }

});


// ======================================================
// PACIENTES AGUARDANDO TRIAGEM
// ======================================================

app.get(
    "/pacientes/triagem",
    (req, res) => {

        try {

            const db = readDB();

            const pacientes =
                db.pacientes.filter(
                    (paciente) =>
                        paciente.status ===
                        "triagem"
                );

            return res.json(
                pacientes
            );

        }

        catch (error) {

            console.error(
                "Erro na fila de triagem:",
                error
            );

            return res.status(500).json({

                erro:
                    "Não foi possível carregar a fila de triagem"

            });

        }

    }
);


// ======================================================
// CRIAR TRIAGEM
// ======================================================

app.post("/triagem", (req, res) => {

    try {

        const db = readDB();

        const pacienteId =
            req.body.pacienteId || null;

        const nome =
            req.body.nome;

        const cpf =
            req.body.cpf || "";

        const sintoma =
            req.body.sintoma;

        const temperatura =
            Number(req.body.temperatura);

        const alergia =
            req.body.alergia || "";

        const observacao =
            req.body.observacao || "";

        if (!nome) {

            return res.status(400).json({

                erro:
                    "Nome do paciente é obrigatório"

            });

        }

        if (!sintoma) {

            return res.status(400).json({

                erro:
                    "Sintoma é obrigatório"

            });

        }

        if (
            !Number.isFinite(temperatura) ||
            temperatura <= 0
        ) {

            return res.status(400).json({

                erro:
                    "Temperatura inválida"

            });

        }

        // ----------------------------------------------
        // DEFINIR RISCO
        // ----------------------------------------------

        let risco =
            req.body.risco || "";

        if (temperatura >= 39) {

            risco = "vermelho";

        }

        else if (temperatura >= 38) {

            risco = "amarelo";

        }

        else {

            risco = "verde";

        }

        // ----------------------------------------------
        // CRIAR TRIAGEM
        // ----------------------------------------------

        const triagem = {

            id: Date.now(),

            pacienteId:
                pacienteId,

            nome: nome,

            cpf: cpf,

            sintoma: sintoma,

            temperatura: temperatura,

            alergia: alergia,

            observacao: observacao,

            risco: risco,

            status:
                "aguardando_medico",

            createdAt:
                new Date().toISOString()

        };

        db.triagens.push(
            triagem
        );

        // ----------------------------------------------
        // ATUALIZAR PACIENTE
        // ----------------------------------------------

        if (pacienteId) {

            const paciente =
                db.pacientes.find(
                    (p) =>
                        Number(p.id) ===
                        Number(pacienteId)
                );

            if (paciente) {

                paciente.status =
                    "aguardando_medico";

            }

        }

        if (!writeDB(db)) {

            return res.status(500).json({

                erro:
                    "Não foi possível salvar a triagem"

            });

        }

        return res.status(201).json(
            triagem
        );

    }

    catch (error) {

        console.error(
            "Erro na triagem:",
            error
        );

        return res.status(500).json({

            erro:
                "Erro interno no servidor"

        });

    }

});


// ======================================================
// LISTAR TODAS AS TRIAGENS
// ======================================================

app.get("/triagens", (req, res) => {

    try {

        const db = readDB();

        return res.json(
            db.triagens
        );

    }

    catch (error) {

        console.error(
            "Erro ao listar triagens:",
            error
        );

        return res.status(500).json({

            erro:
                "Não foi possível carregar as triagens"

        });

    }

});


// ======================================================
// TRIAGENS AGUARDANDO MÉDICO
// ======================================================

app.get(
    "/triagens/aguardando",
    (req, res) => {

        try {

            const db = readDB();

            const triagens =
                db.triagens.filter(
                    (triagem) =>
                        triagem.status ===
                        "aguardando_medico"
                );

            return res.json(
                triagens
            );

        }

        catch (error) {

            console.error(
                "Erro ao carregar fila médica:",
                error
            );

            return res.status(500).json({

                erro:
                    "Não foi possível carregar a fila médica"

            });

        }

    }
);


// ======================================================
// BUSCAR TRIAGEM POR ID
// ======================================================

app.get(
    "/triagens/:id",
    (req, res) => {

        try {

            const db = readDB();

            const id =
                Number(req.params.id);

            const triagem =
                db.triagens.find(
                    (t) =>
                        Number(t.id) === id
                );

            if (!triagem) {

                return res.status(404).json({

                    erro:
                        "Triagem não encontrada"

                });

            }

            return res.json(
                triagem
            );

        }

        catch (error) {

            console.error(
                "Erro ao buscar triagem:",
                error
            );

            return res.status(500).json({

                erro:
                    "Erro interno do servidor"

            });

        }

    }
);


// ======================================================
// MEDICAÇÕES
// ======================================================

app.get(
    "/lista-medicacoes",
    (req, res) => {

        return res.json([

            "Dipirona",

            "Paracetamol",

            "Ibuprofeno",

            "Amoxicilina",

            "Azitromicina",

            "Loratadina",

            "Omeprazol",

            "Buscopan",

            "Dramin",

            "Soro fisiológico"

        ]);

    }
);


// ======================================================
// CONSULTA MÉDICA
// ======================================================

app.post("/consulta", (req, res) => {

    try {

        const db = readDB();

        const pacienteId =
            req.body.pacienteId || null;

        const triagemId =
            req.body.triagemId || null;

        const paciente =
            req.body.paciente;

        const diagnostico =
            req.body.diagnostico;

        const medicacao =
            req.body.medicacao || "";

        const obs =
            req.body.obs || "";

        // ----------------------------------------------
        // VALIDAÇÃO
        // ----------------------------------------------

        if (!paciente) {

            return res.status(400).json({

                erro:
                    "Paciente é obrigatório"

            });

        }

        if (!diagnostico) {

            return res.status(400).json({

                erro:
                    "Diagnóstico é obrigatório"

            });

        }

        // ----------------------------------------------
        // CRIAR CONSULTA
        // ----------------------------------------------

        const consulta = {

            id: Date.now(),

            pacienteId:
                pacienteId,

            triagemId:
                triagemId,

            paciente:
                paciente,

            diagnostico:
                diagnostico,

            medicacao:
                medicacao,

            obs:
                obs,

            createdAt:
                new Date().toISOString()

        };

        db.consultas.push(
            consulta
        );

        // ----------------------------------------------
        // LOCALIZAR TRIAGEM
        // ----------------------------------------------

        let triagem = null;

        // Primeiro pelo ID da triagem
        if (triagemId) {

            triagem =
                db.triagens.find(
                    (t) =>
                        Number(t.id) ===
                        Number(triagemId) &&
                        t.status ===
                        "aguardando_medico"
                );

        }

        // Depois pelo pacienteId
        if (!triagem && pacienteId) {

            triagem =
                db.triagens.find(
                    (t) =>
                        Number(t.pacienteId) ===
                        Number(pacienteId) &&
                        t.status ===
                        "aguardando_medico"
                );

        }

        // Por último pelo nome
        if (!triagem) {

            triagem =
                db.triagens.find(
                    (t) =>
                        t.nome &&
                        t.nome.toLowerCase() ===
                        paciente.toLowerCase() &&
                        t.status ===
                        "aguardando_medico"
                );

        }

        // ----------------------------------------------
        // MARCAR TRIAGEM COMO ATENDIDA
        // ----------------------------------------------

        if (triagem) {

            triagem.status =
                "atendido";

            triagem.atendidoAt =
                new Date().toISOString();

            triagem.consultaId =
                consulta.id;

        }

        // ----------------------------------------------
        // ATUALIZAR PACIENTE
        // ----------------------------------------------

        if (pacienteId) {

            const pacienteBanco =
                db.pacientes.find(
                    (p) =>
                        Number(p.id) ===
                        Number(pacienteId)
                );

            if (pacienteBanco) {

                pacienteBanco.status =
                    "atendido";

            }

        }

        // ----------------------------------------------
        // SALVAR
        // ----------------------------------------------

        if (!writeDB(db)) {

            return res.status(500).json({

                erro:
                    "Não foi possível salvar a consulta"

            });

        }

        return res.status(201).json({

            mensagem:
                "Consulta finalizada com sucesso",

            consulta:
                consulta

        });

    }

    catch (error) {

        console.error(
            "Erro na consulta:",
            error
        );

        return res.status(500).json({

            erro:
                "Erro interno no servidor"

        });

    }

});


// ======================================================
// LISTAR CONSULTAS
// ======================================================

app.get("/consultas", (req, res) => {

    try {

        const db = readDB();

        return res.json(
            db.consultas
        );

    }

    catch (error) {

        console.error(
            "Erro ao listar consultas:",
            error
        );

        return res.status(500).json({

            erro:
                "Não foi possível carregar as consultas"

        });

    }

});


// ======================================================
// INICIAR API
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🩺 Sistema Sentinela API rodando na porta ${PORT}`
    );

});
