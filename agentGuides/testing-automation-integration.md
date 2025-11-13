# Guia de Teste - Integração de Automação (Task 8.3)

## Status
✅ Backend rodando em: http://localhost:3000
✅ PostgreSQL rodando na porta 5432
✅ Redis rodando na porta 6379

## O que foi implementado

A integração do motor de automação com o processamento de mensagens. Quando uma mensagem chega:
1. O sistema busca o bot e suas automações
2. Compara o conteúdo da mensagem com os triggers das automações
3. Se houver match, envia resposta automática via Instagram API
4. Armazena tanto a mensagem recebida quanto a resposta no banco de dados

## Como testar

### 1. Criar um Tenant
```bash
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "domain": "test.com"
  }'
```

Salve o `id` do tenant retornado.

### 2. Registrar um usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123!",
    "tenantId": "SEU_TENANT_ID"
  }'
```

### 3. Fazer login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123!"
  }'
```

Salve o `accessToken` retornado.

### 4. Criar um Bot
```bash
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -d '{
    "name": "Test Bot",
    "instagramUserId": "123456789",
    "accessToken": "fake-instagram-token-for-testing"
  }'
```

Salve o `id` do bot retornado.

### 5. Criar Automações
```bash
# Automação 1: Responde "oi"
curl -X POST http://localhost:3000/automations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -d '{
    "botId": "SEU_BOT_ID",
    "trigger": "oi",
    "response": "Olá! Como posso ajudar você hoje?",
    "priority": 10
  }'

# Automação 2: Responde "preço"
curl -X POST http://localhost:3000/automations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -d '{
    "botId": "SEU_BOT_ID",
    "trigger": "preço",
    "response": "Nossos preços começam em R$ 99/mês. Quer saber mais?",
    "priority": 5
  }'

# Automação 3: Responde "horário"
curl -X POST http://localhost:3000/automations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -d '{
    "botId": "SEU_BOT_ID",
    "trigger": "horário",
    "response": "Atendemos de segunda a sexta, das 9h às 18h.",
    "priority": 5
  }'
```

### 6. Simular mensagem recebida (Webhook)
```bash
curl -X POST http://localhost:3000/instagram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "messaging": [{
        "sender": { "id": "987654321" },
        "recipient": { "id": "123456789" },
        "timestamp": 1699900000000,
        "message": {
          "mid": "msg_001",
          "text": "Oi, qual o preço?"
        }
      }]
    }]
  }'
```

### 7. Verificar os logs do backend

No terminal onde o backend está rodando, você verá:
- ✅ Mensagem recebida e armazenada
- ✅ Automação encontrada (trigger: "oi" com prioridade 10)
- ✅ Tentativa de envio via Instagram API (vai falhar porque o token é fake)
- ✅ Resposta armazenada no banco mesmo com falha no envio

### 8. Verificar no banco de dados

```bash
# Conectar ao PostgreSQL
docker exec -it instagram_chatbot_db psql -U postgres -d instagram_chatbot

# Ver chats criados
SELECT * FROM "Chat";

# Ver mensagens (user e bot)
SELECT * FROM "Message" ORDER BY "createdAt" DESC;

# Ver automações
SELECT * FROM "Automation";
```

## Comportamento esperado

1. **Match de automação**: O sistema encontra a primeira automação cujo trigger está contido na mensagem (case-insensitive)
2. **Prioridade**: Se múltiplas automações fazem match, a de maior prioridade é escolhida
3. **Envio via API**: Tenta enviar via Instagram API usando o access token do bot
4. **Fallback**: Se o envio falhar (token inválido, API offline, etc), a mensagem é armazenada localmente
5. **Persistência**: Todas as mensagens (recebidas e enviadas) são armazenadas no banco

## Testando com token real do Instagram

Para testar com envio real:
1. Configure um app no Facebook Developers
2. Obtenha um access token válido
3. Atualize o bot com o token real:
```bash
curl -X PATCH http://localhost:3000/bots/SEU_BOT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -d '{
    "accessToken": "SEU_TOKEN_REAL_DO_INSTAGRAM"
  }'
```

## Parar o ambiente

```bash
# Parar o backend (Ctrl+C no terminal ou via Kiro)

# Parar os containers Docker
docker-compose down

# Parar e remover volumes (limpa o banco)
docker-compose down -v
```
