document.addEventListener('DOMContentLoaded', function () {
    // Get the login form element
    const loginForm = document.getElementById('login-form');

    // Add event listener for form submission
    loginForm.addEventListener('submit', function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Get the username and password values from the form
        const username = loginForm.elements.username.value;
        const password = loginForm.elements.password.value;

        // Send a POST request to the /login route with the username and password
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            // Check if login was successful
            if (data.success) {
                // save the operator in the local storage
                localStorage.setItem('name', data.username)
                localStorage.setItem('role', data.role);

                // Redirect to the appropriate page based on the user role
                if (data.role === 'admin') {
                    window.location.href = '/admin_dashboard';
                } else if (data.role === 'operator') {
                    window.location.href = '/operator_dashboard';
                }
            } else {
                // Display error message if login failed
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

});
