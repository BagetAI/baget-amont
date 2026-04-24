document.addEventListener('DOMContentLoaded', () => {
    const waitlistForm = document.getElementById('waitlistForm');
    const formResponse = document.getElementById('formResponse');

    if (waitlistForm) {
        waitlistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = waitlistForm.querySelector('button');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Vérification...';
            
            const formData = new FormData(waitlistForm);
            const payload = {
                data: {
                    email: formData.get('email'),
                    name: formData.get('name'),
                    firm_name: formData.get('firm_name'),
                    timestamp: new Date().toISOString()
                }
            };

            try {
                // Submit to Waitlist_Signups database
                const response = await fetch('https://baget.ai/api/public/databases/efee23c2-e790-4249-bd5c-b70ecdfae2c3/rows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    formResponse.textContent = 'Merci. Nous analysons la disponibilité de votre zone et vous recontacterons sous 24h.';
                    formResponse.className = 'form-status success';
                    waitlistForm.reset();
                } else {
                    throw new Error('Erreur lors de l\'envoi');
                }
            } catch (error) {
                console.error('Submission error:', error);
                formResponse.textContent = 'Une erreur est survenue. Veuillez réessayer ou nous contacter directement.';
                formResponse.className = 'form-status error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
});
