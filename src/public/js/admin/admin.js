document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const searchForm = document.getElementById('searchForm');
    const logoutButton = document.getElementById('logoutButton');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Verificar se já está logado
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        showAdminSection();
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Tentando fazer login com:', { username, password });

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Resposta do servidor:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Login bem-sucedido, token recebido');
                localStorage.setItem('adminToken', data.token);
                showAdminSection();
            } else {
                const errorData = await response.json();
                console.error('Erro no login:', errorData);
                alert('Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro ao fazer login');
        }
    });

    // Cadastro de usuário
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Verificar se os elementos existem
        const nameInput = document.getElementById('name');
        const cpfInput = document.getElementById('cpf');
        const emailInput = document.getElementById('email');
        const roleInput = document.getElementById('role');
        const departmentInput = document.getElementById('department');

        console.log('Elementos do formulário:', {
            nameInput,
            cpfInput,
            emailInput,
            roleInput,
            departmentInput
        });

        // Verificar se os elementos foram encontrados
        if (!nameInput || !cpfInput || !emailInput || !roleInput || !departmentInput) {
            console.error('Elementos do formulário não encontrados');
            alert('Erro ao encontrar elementos do formulário');
            return;
        }

        const userData = {
            name: nameInput.value,
            cpf: cpfInput.value,
            email: emailInput.value,
            role: roleInput.value,
            department: departmentInput.value
        };

        console.log('Dados do usuário a serem cadastrados:', userData);

        // Validar se todos os campos estão preenchidos
        if (!userData.name || !userData.cpf || !userData.email || !userData.role || !userData.department) {
            console.log('Campos vazios:', userData);
            alert('Por favor, preencha todos os campos');
            return;
        }

        const adminToken = localStorage.getItem('adminToken');
        console.log('Token do admin:', adminToken);

        if (!adminToken) {
            console.error('Token não encontrado');
            alert('Sessão expirada. Por favor, faça login novamente.');
            return;
        }

        try {
            console.log('Enviando requisição para cadastro...');
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(userData)
            });

            console.log('Resposta do servidor:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Resposta do servidor:', data);
                alert('Usuário cadastrado com sucesso!');
                registerForm.reset();
            } else {
                const errorData = await response.json();
                console.error('Erro no cadastro:', errorData);
                alert(errorData.message || 'Erro ao cadastrar usuário');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert('Erro ao cadastrar usuário');
        }
    });

    // Busca de usuários
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const department = document.getElementById('searchDepartment').value;
        const searchResults = document.getElementById('searchResults');

        try {
            const response = await fetch(`/api/admin/users?department=${department}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const users = await response.json();
                displaySearchResults(users);
            } else {
                alert('Erro ao buscar usuários');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            alert('Erro ao buscar usuários');
        }
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        showLoginSection();
    });

    // Navegação entre tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    function showAdminSection() {
        loginSection.style.display = 'none';
        adminSection.style.display = 'block';
    }

    function showLoginSection() {
        loginSection.style.display = 'block';
        adminSection.style.display = 'none';
    }

    function displaySearchResults(users) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';

        if (users.length === 0) {
            searchResults.innerHTML = '<p>Nenhum usuário encontrado</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Email</th>
                    <th>Cargo</th>
                    <th>Departamento</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.cpf}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.department}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        searchResults.appendChild(table);
    }
}); 