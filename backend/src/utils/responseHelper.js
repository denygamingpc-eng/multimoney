// Centraliza como o servidor responde ao cliente
const sendSuccess = (res, data, message = 'Operação realizada com sucesso', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, error, statusCode = 500) => {
    const message = error.message || 'Erro interno no servidor';
    console.error(`[ERROR]: ${message}`);
    return res.status(statusCode).json({
        success: false,
        error: message
    });
};

module.exports = { sendSuccess, sendError };