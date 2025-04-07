document.addEventListener('DOMContentLoaded', () => {
    const registrationInput = document.getElementById('registration');
    const markPointButton = document.getElementById('markPoint');
    const receiptPopup = document.getElementById('receipt');
    const closeReceiptButton = document.getElementById('closeReceipt');

    markPointButton.addEventListener('click', async () => {
        const registration = registrationInput.value.trim();
        
        if (!registration) {
            alert('Por favor, digite sua matrícula');
            return;
        }

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
                showReceipt(data);
                registrationInput.value = '';
            } else {
                alert(data.message || 'Erro ao marcar ponto');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao marcar ponto');
        }
    });

    closeReceiptButton.addEventListener('click', () => {
        receiptPopup.style.display = 'none';
    });

    function showReceipt(data) {
        const employeeName = document.getElementById('employeeName');
        const employeeRegistration = document.getElementById('employeeRegistration');
        const currentDate = document.getElementById('currentDate');
        const currentTime = document.getElementById('currentTime');
        const recordType = document.getElementById('recordType');

        const now = new Date();
        const date = now.toLocaleDateString('pt-BR');
        const time = now.toLocaleTimeString('pt-BR');
        
        // Determinar o tipo de registro com base na hora
        const hour = now.getHours();
        const recordTypeText = determineRecordType(hour);

        employeeName.textContent = data.name;
        employeeRegistration.textContent = data.registration;
        currentDate.textContent = date;
        currentTime.textContent = time;
        recordType.textContent = recordTypeText;

        receiptPopup.style.display = 'flex';
    }
    
    function determineRecordType(hour) {
        if (hour >= 5 && hour < 12) {
            return 'Entrada';
        } else if (hour >= 12 && hour < 14) {
            return 'Saída Almoço';
        } else if (hour >= 14 && hour < 18) {
            return 'Retorno Almoço';
        } else if (hour >= 18 && hour < 23) {
            return 'Saída';
        } else {
            return 'Entrada (Madrugada)';
        }
    }
}); 