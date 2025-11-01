export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold">Política de Privacidade</h1>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">1. Informações que Coletamos</h2>
            <p>
              O Gestor Financeiro coleta informações necessárias para fornecer nossos serviços de gestão de ordens de
              serviço, orçamentos e controle financeiro. Isso inclui:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Nome, telefone e endereço de clientes</li>
              <li>Informações de ordens de serviço e orçamentos</li>
              <li>Dados financeiros relacionados aos serviços prestados</li>
              <li>Mensagens enviadas via WhatsApp para criação de ordens de serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">2. Como Usamos suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Gerenciar ordens de serviço e orçamentos</li>
              <li>Processar pagamentos e emitir boletos</li>
              <li>Comunicar sobre o status dos serviços</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Atender requisitos legais e regulatórios</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">3. Integração com WhatsApp</h2>
            <p>
              Nosso sistema integra com o WhatsApp Business API para facilitar a criação de ordens de serviço. Quando
              você interage com nosso número do WhatsApp:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Suas mensagens são processadas automaticamente pelo nosso sistema</li>
              <li>Armazenamos o histórico de conversas relacionadas às ordens de serviço</li>
              <li>Seu número de telefone é usado para identificação e comunicação</li>
              <li>Não compartilhamos suas mensagens com terceiros não autorizados</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing.
              Podemos compartilhar dados apenas quando:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Necessário para prestação dos serviços contratados</li>
              <li>Exigido por lei ou ordem judicial</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso
              não autorizado, alteração, divulgação ou destruição. Isso inclui:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Monitoramento e auditoria de sistemas</li>
              <li>Backups regulares dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incorretos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimentos previamente dados</li>
              <li>Solicitar a portabilidade de seus dados</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">7. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pelo tempo necessário para cumprir as finalidades descritas nesta política, a
              menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">8. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar a experiência do usuário, analisar o uso do
              sistema e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do seu
              navegador.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas
              através do sistema ou por email. A data da última atualização será sempre indicada no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">10. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados pessoais, entre
              em contato conosco através dos canais de atendimento disponíveis no sistema.
            </p>
          </section>

          <div className="mt-8 border-t pt-6">
            <p className="text-sm">
              <strong>Última atualização:</strong> {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
