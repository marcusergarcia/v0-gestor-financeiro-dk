-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS layout_impressao_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  font_size INT(11) NOT NULL DEFAULT 11,
  title_font_size INT(11) NOT NULL DEFAULT 16,
  header_font_size INT(11) NOT NULL DEFAULT 10,
  footer_font_size INT(11) NOT NULL DEFAULT 9,
  signature_font_size INT(11) NOT NULL DEFAULT 10,
  line_height DECIMAL(3,1) NOT NULL DEFAULT 1.5,
  page_margin INT(11) NOT NULL DEFAULT 15,
  margin_top INT(11) NOT NULL DEFAULT 10,
  margin_bottom INT(11) NOT NULL DEFAULT 10,
  show_logo TINYINT(1) NOT NULL DEFAULT 1,
  show_header TINYINT(1) NOT NULL DEFAULT 1,
  show_footer TINYINT(1) NOT NULL DEFAULT 1,
  logo_size INT(11) NOT NULL DEFAULT 50,
  custom_page_breaks TEXT,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir configuração padrão se não existir
INSERT INTO layout_impressao_config (
  id, nome, font_size, title_font_size, header_font_size, footer_font_size,
  signature_font_size, line_height, page_margin, margin_top, margin_bottom,
  show_logo, show_header, show_footer, logo_size, custom_page_breaks, ativo
)
SELECT 1, 'Padrão', 11, 16, 10, 9, 10, 1.5, 15, 10, 10, 1, 1, 1, 50,
       'CLÁUSULA TERCEIRA\nOS EQUIPAMENTOS INCLUSOS:', 1
WHERE NOT EXISTS (SELECT 1 FROM layout_impressao_config WHERE id = 1);
