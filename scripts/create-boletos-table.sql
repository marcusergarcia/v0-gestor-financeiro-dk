CREATE TABLE boletos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_boleto VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL AFTER data_vencimento,
    status VARCHAR(50) NOT NULL
);
