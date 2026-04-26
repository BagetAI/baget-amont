document.addEventListener('DOMContentLoaded', () => {
    const postalCodeInput = document.getElementById('postalCodeInput');
    const checkBtn = document.getElementById('checkBtn');
    const checkResult = document.getElementById('checkResult');
    const lockFormContainer = document.getElementById('lockFormContainer');
    const waitlistForm = document.getElementById('waitlistForm');
    const hiddenPostalCode = document.getElementById('hiddenPostalCode');

    const DB_RESERVED_ZONES = 'ef968f67-d829-4476-8897-766ebed7fd00';
    const DB_WAITLIST = 'efee23c2-e790-4249-bd5c-b70ecdfae2c3';

    // 1. Territory Checker Logic
    if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
            const postalCode = postalCodeInput.value.trim();
            
            if (!/^\d{5}$/.test(postalCode)) {
                showResult('Veuillez entrer un code postal valide (5 chiffres).', 'error');
                return;
            }

            checkBtn.disabled = true;
            checkBtn.textContent = 'Recherche...';
            checkResult.innerHTML = '';
            lockFormContainer.classList.add('hidden');

            try {
                // Fetch existing reserved zones
                const response = await fetch(`https://baget.ai/api/public/databases/${DB_RESERVED_ZONES}/rows`);
                const rows = await response.json();
                
                const isLocked = rows.some(row => row.data.postal_code === postalCode);

                if (isLocked) {
                    showResult(`Le secteur ${postalCode} est déjà réservé par un cabinet partenaire.`, 'locked');
                } else {
                    showResult(`La zone ${postalCode} est disponible.`, 'available');
                    hiddenPostalCode.value = postalCode;
                    lockFormContainer.classList.remove('hidden');
                    // Smooth scroll to form
                    lockFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                console.error('Check error:', error);
                showResult('Erreur de connexion. Veuillez réessayer.', 'error');
            } finally {
                checkBtn.disabled = false;
                checkBtn.textContent = 'Vérifier';
            }
        });
    }

    // 2. Lock Territory Form Logic
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = waitlistForm.querySelector('button');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verrouillage en cours...';
            
            const formData = new FormData(waitlistForm);
            const postalCode = formData.get('postal_code');
            const firmName = formData.get('firm_name');

            const waitlistPayload = {
                data: {
                    email: formData.get('email'),
                    name: formData.get('name'),
                    firm_name: firmName,
                    firm_size: formData.get('firm_size'),
                    postal_code: postalCode,
                    timestamp: new Date().toISOString()
                }
            };

            const reservationPayload = {
                data: {
                    postal_code: postalCode,
                    firm_name: firmName,
                    locked_at: new Date().toISOString(),
                    status: 'PILOTE_ACTIVE'
                }
            };

            try {
                // 1. Save to Waitlist
                const waitlistRes = await fetch(`https://baget.ai/api/public/databases/${DB_WAITLIST}/rows`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(waitlistPayload)
                });

                // 2. Mark Zone as Reserved
                const reserveRes = await fetch(`https://baget.ai/api/public/databases/${DB_RESERVED_ZONES}/rows`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reservationPayload)
                });

                if (waitlistRes.ok && reserveRes.ok) {
                    lockFormContainer.innerHTML = `
                        <div class="success-message">
                            <h3>Territoire Verrouillé.</h3>
                            <p>Le secteur <strong>${postalCode}</strong> vous est réservé pour 21 jours.</p>
                            <p>Un consultant Amont vous contactera sous 24h pour configurer vos Workers W1-W4.</p>
                            <a href="dashboard.html" class="btn btn-primary" style="margin-top: 20px">Accéder au Dashboard</a>
                        </div>
                    `;
                    showResult(`Zone ${postalCode} réservée avec succès.`, 'available');
                } else {
                    throw new Error('Server error');
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    function showResult(message, type) {
        checkResult.textContent = message;
        checkResult.className = `check-result ${type}`;
    }
});
