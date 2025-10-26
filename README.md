# Central de Imagens Médicas

Este projeto contém todo o boilerplate necessário para configurar uma **API de centralização de imagens médicas** com autenticação e autorização baseada em papéis (RBAC), integrando múltiplas clínicas via servidor Orthanc.

📘 Documentação Swagger

## Funcionalidades

### Autenticação

- [ ] Criar conta por convite (e-mail, nome e senha)
- [ ] Autenticar usando e-mail e senha
- [ ] Recuperar senha via e-mail

### Clínicas (Organizações)

- [ ] Super Admin pode criar uma nova clínica
- [ ] Super Admin pode listar todas as clínicas
- [ ] Super Admin pode atualizar informações de uma clínica
- [ ] Super Admin pode desativar/excluir uma clínica
- [ ] Super Admin pode transferir propriedade de uma clínica (condicional)
- [ ] Admin só pode visualizar sua própria clínica

### Convites

- [ ] Super Admin pode convidar um novo usuário (e-mail, função)
- [ ] Usuário pode aceitar um convite para criar conta

### Usuários/Membros

- [ ] Listar membros de uma clínica
- [ ] Admin pode visualizar membros de sua clínica
- [ ] Super Admin pode atualizar função ou remover membros

### Pacientes e Exames

- [ ] Listar pacientes e exames por clínica
- [ ] Paciente acessa apenas seus próprios exames
- [ ] Adicionar observações ou laudos aos exames
- [ ] Excluir exames (Admin/Super Admin, respeitando regras de clínica)

---

### Controle de Acesso (RBAC)

- **Super Admin (TI)** – acesso total, gerencia clínicas, usuários e alterna entre clínicas
- **Admin (Clínica)** – acesso restrito à própria clínica, seus pacientes e exames
- **Paciente** – acesso apenas aos próprios exames

### Tabela de permissões

| Ação                              | Super Admin | Admin           | Paciente        |
| --------------------------------- | ----------- | --------------- | --------------- |
| Criar clínica                     | ✅          | ❌              | ❌              |
| Editar/excluir clínica            | ✅          | ❌              | ❌              |
| Visualizar todas as clínicas      | ✅          | ❌              | ❌              |
| Alternar entre clínicas           | ✅          | ❌              | ❌              |
| Convidar usuário                  | ✅          | ❌              | ❌              |
| Revogar convite                   | ✅          | ❌              | ❌              |
| Listar membros da clínica         | ✅          | ✅              | ❌              |
| Atualizar função de usuário       | ✅          | ❌              | ❌              |
| Excluir usuário                   | ✅          | ⚠️ (se próprio) | ❌              |
| Listar pacientes e exames         | ✅          | ✅              | ✅ (se próprio) |
| Visualizar exame de outra clínica | ✅          | ❌              | ❌              |
| Excluir exame                     | ✅          | ⚠️ (se próprio) | ❌              |

> ✅ = permitido
> ❌ = não permitido
> ⚠️ = permitido com condições

### Condições

- Admin só pode gerenciar pacientes e exames da própria clínica
- Pacientes só podem acessar seus próprios exames
- Todos os convites são enviados por e-mail e requerem criação da conta manualmente

---

## Integração com Orthanc

- A API se conecta ao **Orthanc** para sincronizar pacientes e exames em formato DICOM
- Fluxo básico:
  1. Orthanc recebe o exame (via DICOM Store ou modal)
  2. A API detecta o novo exame e vincula ao paciente e clínica corretos
  3. O exame aparece automaticamente no painel da clínica ou na página do paciente
