document.addEventListener('DOMContentLoaded', () => {
    const pointForm = document.getElementById('pointForm');
    const messageDiv = document.getElementById('message');
    const modal = document.getElementById('receiptModal');
    const closeBtn = document.querySelector('.close');
    const receiptDiv = document.getElementById('receipt');

    // Fechar o modal quando clicar no X
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Fechar o modal quando clicar fora dele
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    pointForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const registration = document.getElementById('registration').value;

        try {
            const response = await fetch('/api/point', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ registration })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = 'Ponto registrado com sucesso!';
                messageDiv.className = 'message success';
                
                // Exibir o comprovante no modal
                const currentTime = new Date().toLocaleString('pt-BR');
                const currentHour = new Date().getHours();
                let tipoRegistro = '';

                // Lógica para determinar o tipo de registro baseado no horário
                if (currentHour >= 5 && currentHour < 12) {
                    tipoRegistro = 'Entrada';
                } else if (currentHour >= 12 && currentHour < 14) {
                    tipoRegistro = 'Saída Almoço';
                } else if (currentHour >= 14 && currentHour < 18) {
                    tipoRegistro = 'Retorno Almoço';
                } else if (currentHour >= 18) {
                    tipoRegistro = 'Saída';
                } else {
                    tipoRegistro = 'Entrada';
                }

                // Verificar se já existe registro no mesmo dia
                const today = new Date().toLocaleDateString('pt-BR');
                const existingRecords = JSON.parse(localStorage.getItem('pointRecords') || '{}');
                const userRecords = existingRecords[data.registration] || [];
                const todayRecords = userRecords.filter(record => record.date === today);

                // Verificar se já atingiu o limite de 4 marcações
                if (todayRecords.length >= 4) {
                    messageDiv.textContent = 'Todos os pontos diários já foram batidos. Para hora extra, entre em contato com seu gerente.';
                    messageDiv.className = 'message error';
                    return;
                }

                // Determinar o tipo de registro baseado na sequência
                if (todayRecords.length === 0) {
                    tipoRegistro = 'Entrada';
                } else if (todayRecords.length === 1) {
                    tipoRegistro = 'Saída Almoço';
                } else if (todayRecords.length === 2) {
                    tipoRegistro = 'Retorno Almoço';
                } else if (todayRecords.length === 3) {
                    tipoRegistro = 'Saída';
                }

                // Salvar o registro
                const newRecord = {
                    date: today,
                    time: currentTime,
                    type: tipoRegistro
                };
                userRecords.push(newRecord);
                existingRecords[data.registration] = userRecords;
                localStorage.setItem('pointRecords', JSON.stringify(existingRecords));

                receiptDiv.innerHTML = `
                    <div class="receipt">
                        <h3>Comprovante de Registro de Ponto</h3>
                        <div class="company-info">
                            <p>NeoSolution LTDA</p>
                            <p>CNPJ: 57.286.743/0001-97</p>
                        </div>
                        <p><strong>Nome:</strong> ${data.name}</p>
                        <p><strong>Matrícula:</strong> ${data.registration}</p>
                        <p><strong>CPF:</strong> ${data.cpf}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Departamento:</strong> ${data.department}</p>
                        <p><strong>Tipo:</strong> ${tipoRegistro}</p>
                        <p><strong>Data/Hora:</strong> ${currentTime}</p>
                    </div>
                `;
                modal.style.display = 'block';
                
                pointForm.reset();
            } else {
                messageDiv.textContent = data.message || 'Erro ao registrar ponto';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Erro ao registrar ponto';
            messageDiv.className = 'message error';
        }
    });
}); 