async function fetchAccessToken() 
{
    const response = await fetch('/api/token');
    
    if (!response.ok) 
    {
        throw new Error('failed to fetch access token');
    }

    const data = await response.json();
    return data.accessToken;
}

async function generateTicket()
{
    const form = document.getElementById('ticketForm');
    const data = 
    {
        vatin: form.vatin.value,
        firstName: form.firstName.value,
        lastName: form.lastName.value
    };

    const messageDiv = document.getElementById('message');
    messageDiv.textContent = ''

    try 
    {
        const accessToken = await fetchAccessToken();
        console.log(accessToken);

        const response = await fetch('/api/ticket/generate',
        {
            method: 'POST',
            headers: 
            {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) 
        {
            const html = await response.text(); 
            document.open();
            document.write(html); 
            document.close(); 
        }
        else 
        {
            const errorData = await response.json(); 
            messageDiv.textContent = 'error generating ticket: ' + errorData.error;
        }

    } 
    catch (error) 
    {
        console.error('error:', error);
        messageDiv.textContent = 'error: ' + error.message;
    }
};


