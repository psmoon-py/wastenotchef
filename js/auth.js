const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = localStorage.getItem('token');

// Event listeners for auth forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Check if user is logged in
    checkAuthStatus();
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            authToken = data.token;
            currentUser = data.user;
            updateUIForLoggedInUser();
            closeAuthModal();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Login failed. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            authToken = data.token;
            currentUser = data.user;
            updateUIForLoggedInUser();
            closeAuthModal();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Registration failed. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    authToken = null;
    currentUser = null;
    updateUIForLoggedOutUser();
}

async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await fetch(`${API_URL}/users/favorites`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                updateUIForLoggedInUser();
            } else {
                handleLogout();
            }
        } catch (error) {
            handleLogout();
        }
    }
}

async function toggleFavorite(recipeId, recipeName, recipeImage, recipeCuisine) {
    if (!authToken) {
        showAuthModal();
        return;
    }

    try {
        const isFavorite = document.querySelector(`[data-recipe-id="${recipeId}"] .favorite-btn`).classList.contains('active');
        const url = `${API_URL}/users/favorites${isFavorite ? `/${recipeId}` : ''}`;
        
        const response = await fetch(url, {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: isFavorite ? null : JSON.stringify({
                recipeId,
                name: recipeName,
                image: recipeImage,
                cuisine: recipeCuisine
            })
        });

        if (response.ok) {
            const favoriteBtn = document.querySelector(`[data-recipe-id="${recipeId}"] .favorite-btn`);
            favoriteBtn.classList.toggle('active');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

async function saveSearchHistory(ingredients) {
    if (!authToken) return;

    try {
        await fetch(`${API_URL}/users/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ingredients })
        });
    } catch (error) {
        console.error('Error saving search history:', error);
    }
}

async function loadSearchHistory() {
    if (!authToken) return [];

    try {
        const response = await fetch(`${API_URL}/users/history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const history = await response.json();
            displaySearchHistory(history);
        }
    } catch (error) {
        console.error('Error loading search history:', error);
    }
}

function updateUIForLoggedInUser() {
    document.body.classList.add('logged-in');
    // Update UI elements for logged-in state
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.textContent = 'Logout';
        authBtn.onclick = handleLogout;
    }
    loadSearchHistory();
}

function updateUIForLoggedOutUser() {
    document.body.classList.remove('logged-in');
    // Update UI elements for logged-out state
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.textContent = 'Login';
        authBtn.onclick = showAuthModal;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Export functions for use in other files
window.auth = {
    toggleFavorite,
    saveSearchHistory,
    loadSearchHistory,
    checkAuthStatus
};
