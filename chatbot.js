let chatHistory = [
    { role: "user", parts: [{ text: "Hello" }] },
    { role: "model", parts: [{ text: "Hi! I am the Keyown Habitat AI Hiring Assistant. Which role are you interested in applying for?" }] }
];

function selectRole(roleName, element) {
    // Update UI
    document.querySelectorAll('.job-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');

    // Update hidden form field
    document.getElementById('applicant-role').value = roleName;

    // Trigger AI Chat
    const msg = `I am interested in applying for the ${roleName} position.`;
    document.getElementById('chat-input').value = msg;
    sendMessage();
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage(message, 'user');
    inputField.value = '';

    // Add to history
    chatHistory.push({ role: "user", parts: [{ text: message }] });

    // Show loading
    document.getElementById('loading-indicator').style.display = 'flex';

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: chatHistory })
        });
        
        const data = await response.json();
        
        // Hide loading
        document.getElementById('loading-indicator').style.display = 'none';

        if (data.reply) {
            appendMessage(data.reply, 'bot');
            chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

            // If the AI says to upload resume, show the form
            if (data.reply.toLowerCase().includes('upload') && data.reply.toLowerCase().includes('resume')) {
                document.getElementById('apply-form').classList.add('visible');
                document.getElementById('chat-input-area').style.display = 'none';
                appendMessage("Please use the form below to submit your details and resume.", "bot");
            }
        }
    } catch (error) {
        document.getElementById('loading-indicator').style.display = 'none';
        console.error("Chat error:", error);
        appendMessage("Sorry, I'm having trouble connecting to the server.", "bot");
    }
}

function appendMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function submitApplication() {
    const name = document.getElementById('applicant-name').value;
    const email = document.getElementById('applicant-email').value;
    const role = document.getElementById('applicant-role').value;
    const resumeFile = document.getElementById('applicant-resume').files[0];

    if (!name || !email || !resumeFile) {
        alert("Please fill in all fields and select a resume file.");
        return;
    }

    // Show loading instead of form
    const form = document.getElementById('apply-form');
    form.innerHTML = '<div style="color:white; text-align:center;">Submitting application... Please wait.</div>';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('role', role);
    formData.append('resume', resumeFile);

    try {
        const response = await fetch('http://localhost:3000/api/apply', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            form.innerHTML = `<div style="color:var(--primary-color); text-align:center; font-weight:bold;">${data.message}</div>`;
            appendMessage(`Application submitted successfully for ${role}! Check your email for next steps.`, 'bot');
        } else {
            form.innerHTML = `<div style="color:red; text-align:center;">Error: ${data.error}</div>`;
        }
    } catch (error) {
        console.error("Apply error:", error);
        form.innerHTML = `<div style="color:red; text-align:center;">Failed to submit application. Server error.</div>`;
    }
}
