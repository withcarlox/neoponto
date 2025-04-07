document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  const adminPanel = document.getElementById('adminPanel');
  const logoutBtn = document.getElementById('logoutBtn');
  const userForm = document.getElementById('userForm');
  const searchForm = document.getElementById('searchForm');
  const searchResults = document.getElementById('searchResults');

  // Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin123') {
      document.getElementById('loginForm').classList.add('hidden');
      adminPanel.classList.remove('hidden');
    } else {
      alert('Usuário ou senha incorretos');
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    loginForm.reset();
  });

  // Cadastrar usuário
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const cpf = document.getElementById('cpf').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, cpf, email, role, department })
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar usuário');
      }

      alert('Usuário cadastrado com sucesso');
      userForm.reset();
    } catch (error) {
      alert(error.message);
    }
  });

  // Buscar usuários
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const department = document.getElementById('searchDepartment').value;

    try {
      const response = await fetch(`/api/users/department/${department}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }

      const users = await response.json();
      displayUsers(users);
    } catch (error) {
      alert(error.message);
    }
  });

  // Exibir usuários
  function displayUsers(users) {
    if (users.length === 0) {
      searchResults.innerHTML = '<p>Nenhum usuário encontrado</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Departamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    users.forEach(user => {
      html += `
        <tr>
          <td>${user.name}</td>
          <td>${user.cpf}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.department}</td>
          <td>
            <button onclick="downloadReport(${user.id})">Relatório</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    searchResults.innerHTML = html;
  }
});

// Função para download do relatório
async function downloadReport(userId) {
  try {
    const response = await fetch(`/api/time-records/${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar registros');
    }

    const records = await response.json();
    
    // Criar CSV
    let csv = 'Data,Hora,Tipo\n';
    records.forEach(record => {
      const date = new Date(record.timestamp);
      csv += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${record.recordType}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${userId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
} 