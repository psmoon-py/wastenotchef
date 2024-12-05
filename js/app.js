// DOM Elements
const ingredientInput = document.querySelector('#ingredient');
const ingredientList = document.getElementById('ingredient-tags');
const recipeList = document.getElementById('recipe-results');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const tipsGrid = document.getElementById('tips-grid');
const sustainabilityTipsContainer = document.getElementById('sustainability-tips');

// State
let ingredients = [];
let currentPage = 1;
let recipesPerPage = 8;
let allRecipes = [];
let currentSortMethod = 'relevance';
let currentFilters = {
    maxTime: 'any',
    dietary: 'all'
};

// Initialize tips data structure at the top of the file
const sustainabilityTips = {
    default: [
        'Store food properly in airtight containers to extend shelf life',
        'Plan your meals in advance to avoid buying excess food',
        'Use the FIFO (First In, First Out) method when storing food'
    ],
    fruits: [
        'Store fruits in the refrigerator to extend shelf life',
        'Keep bananas separate from other fruits',
        'Use overripe fruits in smoothies or baking'
    ],
    vegetables: [
        'Store vegetables in proper humidity conditions',
        'Keep root vegetables in a cool, dark place',
        'Use vegetable scraps for homemade stock'
    ]
};

// Community recipes storage
let communityRecipes = JSON.parse(localStorage.getItem('communityRecipes')) || [];

// Function to submit a new recipe
function submitRecipe(event) {
    event.preventDefault();
    
    const newRecipe = {
        id: Date.now(),
        name: document.getElementById('recipe-name').value,
        ingredients: document.getElementById('recipe-ingredients').value.split('\n'),
        instructions: document.getElementById('recipe-instructions').value.split('\n'),
        tips: document.getElementById('recipe-tips').value,
        image: document.getElementById('recipe-image').value || 'default-recipe.jpg',
        timestamp: new Date().toISOString(),
        likes: 0
    };

    communityRecipes.push(newRecipe);
    localStorage.setItem('communityRecipes', JSON.stringify(communityRecipes));
    
    document.getElementById('recipe-submit-form').reset();
    document.getElementById('recipe-form-modal').style.display = 'none';
    
    displayCommunityRecipes();
}

// Function to display community recipes
function displayCommunityRecipes() {
    const container = document.getElementById('community-grid');
    if (!container) return;

    container.innerHTML = communityRecipes
        .sort((a, b) => b.likes - a.likes)
        .map(recipe => `
            <div class="community-recipe-card">
                <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='default-recipe.jpg'">
                <div class="recipe-content">
                    <h3>${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-heart"></i> ${recipe.likes}</span>
                        <button onclick="likeRecipe(${recipe.id})" class="like-btn">
                            <i class="fas fa-thumbs-up"></i> Like
                        </button>
                    </div>
                    <div class="zero-waste-tips">
                        <h4>Zero-Waste Tips:</h4>
                        <p>${recipe.tips}</p>
                    </div>
                    <button onclick="viewCommunityRecipe(${recipe.id})" class="view-recipe-btn">
                        View Recipe
                    </button>
                </div>
            </div>
        `).join('');
}

// Function to like a recipe
function likeRecipe(id) {
    const recipe = communityRecipes.find(r => r.id === id);
    if (recipe) {
        recipe.likes++;
        localStorage.setItem('communityRecipes', JSON.stringify(communityRecipes));
        displayCommunityRecipes();
    }
}

// Function to view a community recipe
function viewCommunityRecipe(id) {
    const recipe = communityRecipes.find(r => r.id === id);
    if (!recipe) return;

    const modal = document.getElementById('recipe-modal');
    const content = document.getElementById('modal-recipe-content');
    
    content.innerHTML = `
        <h2>${recipe.name}</h2>
        <div class="recipe-details">
            <div class="ingredients">
                <h3>Ingredients:</h3>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
            <div class="instructions">
                <h3>Instructions:</h3>
                <ol>
                    ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            <div class="zero-waste-tips">
                <h3>Zero-Waste Tips:</h3>
                <p>${recipe.tips}</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Function to get general tips for any ingredient
function getGeneralTips(ingredient) {
    return [
        `Store ${ingredient} properly to maximize freshness`,
        `Check ${ingredient} regularly for spoilage`,
        `Learn proper storage techniques for ${ingredient}`
    ];
}

// Function to update sustainability tips
function updateSustainabilityTips(ingredients) {
    const tipsContainer = document.getElementById('sustainability-tips');
    if (!tipsContainer) return;

    let allTips = [];
    
    ingredients.forEach(ing => {
        const matchedKey = Object.keys(sustainabilityTips).find(k => 
            ing.toLowerCase().includes(k.toLowerCase())
        );
        
        if (matchedKey) {
            // Get random tip from available tips
            const tips = sustainabilityTips[matchedKey];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            allTips.push({
                ingredient: ing,
                tip: randomTip
            });
        }
        // If no specific tips found, don't add a generic tip
    });

    // Update the tips display
    tipsContainer.innerHTML = allTips.map(({ingredient, tip}) => `
        <div class="tip-card">
            <i class="fas fa-leaf"></i>
            <strong>${ingredient}:</strong> ${tip}
        </div>
    `).join('');
}

// Event Listeners
if (ingredientInput) {
    ingredientInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIngredient();
        }
    });
}

function addIngredient() {
    const input = document.getElementById('ingredient');
    const ingredient = input.value.trim().toLowerCase();
    
    if (ingredient) {
        if (!ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
            updateIngredientTags();
            generateTipsAndGuide(ingredient);
            input.value = '';
        }
    }
}

function removeIngredient(ingredient) {
    ingredients = ingredients.filter(item => item !== ingredient);
    updateIngredientTags();
    updateTipsAndGuides();
}

function updateIngredientTags() {
    const container = document.getElementById('ingredient-tags');
    container.innerHTML = ingredients.map(ingredient => `
        <span class="ingredient-tag">
            ${ingredient}
            <button onclick="removeIngredient('${ingredient}')">&times;</button>
        </span>
    `).join('');
}

function updateTipsAndGuides() {
    document.getElementById('sustainability-tips').innerHTML = '';
    document.getElementById('preservation-advice').innerHTML = '<h3><i class="fas fa-box"></i> Storage & Preservation Guide</h3><div class="preservation-grid"></div>';
    ingredients.forEach(ingredient => generateTipsAndGuide(ingredient));
}

function getSingularForm(ingredient) {
    // Basic pluralization rules
    if (ingredient.endsWith('ies')) {
        return ingredient.slice(0, -3) + 'y';
    } else if (ingredient.endsWith('es')) {
        return ingredient.slice(0, -2);
    } else if (ingredient.endsWith('s')) {
        return ingredient.slice(0, -1);
    }
    return ingredient;
}

function generateTipsAndGuide(ingredient) {
    const singularIngredient = getSingularForm(ingredient);
    const tips = generateSustainabilityTips(singularIngredient);
    const guide = generateStorageGuide(singularIngredient);
    
    // Add sustainability tips
    const tipsContainer = document.getElementById('sustainability-tips');
    const tipElement = document.createElement('div');
    tipElement.className = 'tip';
    tipElement.innerHTML = `
        <h4><i class="fas fa-leaf"></i> ${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</h4>
        <ul>
            ${tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
    `;
    tipsContainer.appendChild(tipElement);

    // Add storage and preservation guide
    const preservationGrid = document.querySelector('.preservation-grid');
    const guideElement = document.createElement('div');
    guideElement.className = 'preservation-item';
    guideElement.innerHTML = `
        <h4><i class="fas fa-box"></i> ${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</h4>
        <ul>
            ${guide.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
    preservationGrid.appendChild(guideElement);
}

function generateSustainabilityTips(ingredient) {
    const commonTips = {
        // Fruits
        'apple': [
            'Save cores for making homemade vinegar',
            'Compost peels for nutrient-rich soil',
            'Use overripe ones in baking or smoothies'
        ],
        'banana': [
            'Use peels as garden fertilizer',
            'Freeze overripe ones for smoothies',
            'Make banana bread when too ripe'
        ],
        'orange': [
            'Use zest in recipes before eating',
            'Make candied peels for snacking',
            'Use peels as natural cleaner'
        ],
        // Vegetables
        'carrot': [
            'Use tops in pesto or soups',
            'Save scraps for vegetable stock',
            'Plant tops to grow new carrots'
        ],
        'potato': [
            'Save peels for crispy snacks',
            'Use sprouted ones as seed potatoes',
            'Compost any green parts'
        ],
        'tomato': [
            'Save seeds for planting',
            'Use overripe ones in sauces',
            'Green ones can ripen on counter'
        ],
        // Herbs
        'basil': [
            'Dry excess for winter use',
            'Freeze in oil for later use',
            'Root cuttings in water'
        ],
        'mint': [
            'Dry for tea blends',
            'Freeze in ice cubes',
            'Use stems in infused water'
        ],
        // Default tips for unknown ingredients
        'default': [
            'Store properly to maximize freshness',
            'Use all parts when possible',
            'Compost any unusable parts'
        ]
    };

    return commonTips[ingredient] || commonTips['default'];
}

function generateStorageGuide(ingredient) {
    const storageGuides = {
        // Fruits
        'apple': [
            'Store in cool, dark place or refrigerator',
            'Keep away from other produce (ethylene producer)',
            'Best temperature: 30-32°F (0°C)'
        ],
        'banana': [
            'Store at room temperature until ripe',
            'Wrap stem in plastic wrap to slow ripening',
            'Refrigerate when ripe (skin will darken)'
        ],
        'orange': [
            'Store in refrigerator crisper drawer',
            'Keep dry to prevent mold',
            'Can last 3-4 weeks when properly stored'
        ],
        // Vegetables
        'carrot': [
            'Remove tops before storing',
            'Store in crisper drawer with high humidity',
            'Wrap in damp paper towel for longer life'
        ],
        'potato': [
            'Store in cool, dark place (not refrigerator)',
            'Keep away from onions',
            'Ideal temperature: 45-50°F (7-10°C)'
        ],
        'tomato': [
            'Store at room temperature until ripe',
            'Keep stem-side up',
            'Never refrigerate unless cut'
        ],
        // Herbs
        'basil': [
            'Store in water like flowers at room temperature',
            'Cover loosely with plastic bag',
            'Change water every 2-3 days'
        ],
        'mint': [
            'Store stems in water with loose plastic cover',
            'Keep in refrigerator',
            'Trim stems occasionally'
        ],
        // Dairy
        'milk': [
            'Store in back of refrigerator, not door',
            'Keep at 40°F (4°C) or below',
            'Use within 7 days of opening'
        ],
        'cheese': [
            'Wrap in cheese paper or wax paper',
            'Store in dedicated container',
            'Allow to breathe but prevent drying'
        ],
        // Bread
        'bread': [
            'Store in bread box or paper bag',
            'Freeze sliced bread for longer storage',
            'Never store in refrigerator'
        ],
        // Default storage guide for unknown ingredients
        'default': [
            'Store in airtight container',
            'Check regularly for freshness',
            'Label with date of storage'
        ]
    };

    // Add more ingredients dynamically based on categories
    const categories = {
        fruits: ['grape', 'strawberry', 'blueberry', 'raspberry', 'pear', 'peach', 'plum', 'mango', 'pineapple'],
        vegetables: ['cucumber', 'lettuce', 'spinach', 'broccoli', 'cauliflower', 'pepper', 'onion', 'garlic', 'celery'],
        herbs: ['parsley', 'cilantro', 'thyme', 'rosemary', 'sage', 'oregano', 'dill'],
        dairy: ['yogurt', 'butter', 'cream', 'sour cream'],
        grains: ['rice', 'pasta', 'quinoa', 'oats']
    };

    // Generate storage guides for category items
    for (const [category, items] of Object.entries(categories)) {
        items.forEach(item => {
            if (!storageGuides[item]) {
                switch(category) {
                    case 'fruits':
                        storageGuides[item] = [
                            'Check for ripeness before storing',
                            'Store in crisper drawer if needed',
                            'Watch for signs of over-ripening'
                        ];
                        break;
                    case 'vegetables':
                        storageGuides[item] = [
                            'Store in high-humidity crisper drawer',
                            'Keep away from ethylene-producing fruits',
                            'Check regularly for freshness'
                        ];
                        break;
                    case 'herbs':
                        storageGuides[item] = [
                            'Store in water or damp paper towel',
                            'Keep in plastic bag in refrigerator',
                            'Trim stems before storing'
                        ];
                        break;
                    case 'dairy':
                        storageGuides[item] = [
                            'Keep in coldest part of refrigerator',
                            'Seal tightly after each use',
                            'Check expiration dates regularly'
                        ];
                        break;
                    case 'grains':
                        storageGuides[item] = [
                            'Store in airtight container',
                            'Keep in cool, dry place',
                            'Check for moisture or pests regularly'
                        ];
                        break;
                }
            }
        });
    }

    return storageGuides[ingredient] || storageGuides['default'];
}

function displayTips() {
    const tipsGrid = document.querySelector('.tips-grid');
    if (!tipsGrid) return;

    try {
        // Get ingredients from tags
        const ingredientTags = document.getElementById('ingredient-tags');
        const ingredients = ingredientTags ? Array.from(ingredientTags.children).map(tag => 
            tag.textContent.replace('×', '').trim().toLowerCase()
        ) : [];

        if (ingredients.length === 0) {
            // Show default tips when no ingredients are added
            const defaultTips = sustainabilityTips.default || [];
            tipsGrid.innerHTML = `
                <div class="tip-card">
                    <h3>General Tips</h3>
                    <ul>
                        ${defaultTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
            return;
        }

        // Generate tips for each ingredient
        const tipsList = ingredients.map(ingredient => {
            const tips = sustainabilityTips[ingredient] || sustainabilityTips.default || [];
            return `
                <div class="tip-card">
                    <h3>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</h3>
                    <ul>
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
        }).join('');

        tipsGrid.innerHTML = tipsList;
    } catch (error) {
        console.error('Error displaying tips:', error);
        // Fallback content in case of error
        tipsGrid.innerHTML = `
            <div class="tip-card">
                <h3>Sustainability Tips</h3>
                <ul>
                    <li>Store food properly to maximize freshness</li>
                    <li>Plan your meals to reduce waste</li>
                    <li>Compost food scraps when possible</li>
                </ul>
            </div>
        `;
    }
}
// Add event listener for page load
document.addEventListener('DOMContentLoaded', function() {
    displayTips();
    
    // Add event listener for ingredient changes
    const ingredientInput = document.getElementById('ingredient');
    if (ingredientInput) {
        ingredientInput.addEventListener('change', displayTips);
    }
});

async function findRecipes() {
    try {
        if (ingredients.length === 0) {
            showError('Please add at least one ingredient');
            return;
        }

        showLoading(true);
        hideError();

        const recipes = await searchRecipesByIngredients(ingredients);
        
        if (!recipes || recipes.length === 0) {
            showError('No recipes found. Try different ingredients!');
            return;
        }

        displayRecipes(recipes);
    } catch (error) {
        console.error('Error in findRecipes:', error);
        showError('Something went wrong. Please try again.');
    } finally {
        showLoading(false);
    }
}

function displayRecipes(recipes) {
    allRecipes = recipes;
    
    if (recipeList) {
        sortRecipes();
        currentPage = 1;
        displayCurrentPage();
    }
}

function sortRecipes() {
    if (allRecipes && allRecipes.length > 0) {
        allRecipes.sort(sortFunctions[currentSortMethod]);
    }
}

function displayCurrentPage() {
    if (!recipeList) return;

    const start = (currentPage - 1) * recipesPerPage;
    const end = start + recipesPerPage;
    const currentRecipes = allRecipes.slice(start, end);
    
    recipeList.innerHTML = '';
    
    currentRecipes.forEach(recipe => {
        // Ensure recipe has dietary tags
        if (!recipe.dietaryTags) {
            recipe.dietaryTags = detectDietaryTags(recipe);
        }

        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        const imageUrl = recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=480';
        
        // Format cooking time
        const hours = Math.floor(recipe.cookingTime / 60);
        const minutes = recipe.cookingTime % 60;
        const timeString = hours > 0 
            ? `${hours}h ${minutes}m` 
            : `${minutes}m`;

        card.innerHTML = `
            <div class="recipe-image" style="background-image: url('${imageUrl}')">
                <div class="recipe-time">
                    <i class="fas fa-clock"></i>
                    ${timeString}
                </div>
                <div class="recipe-overlay">
                    <h3>${recipe.name}</h3>
                    <span class="recipe-cuisine">${recipe.cuisine || 'International'}</span>
                </div>
            </div>
            <div class="recipe-content">
                <div class="recipe-stats">
                    <div class="stat">
                        <span class="stat-label">Have</span>
                        <span class="stat-value">${recipe.usedIngredients.length}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Need</span>
                        <span class="stat-value">${recipe.missedIngredients.length}</span>
                    </div>
                </div>
                <div class="ingredients-section">
                    <div class="ingredient-list">
                        <h4>You Have:</h4>
                        <ul class="used-ingredients">
                            ${recipe.usedIngredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    ${recipe.missedIngredients.length > 0 ? `
                        <div class="ingredient-list">
                            <h4>You Need:</h4>
                            <ul class="missed-ingredients">
                                ${recipe.missedIngredients.map(ing => `<li>${ing}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="dietary-tags">
                    ${recipe.dietaryTags && recipe.dietaryTags.length > 0 ? recipe.dietaryTags.map(tag => `<span class="dietary-tag">${tag}</span>`).join('') : ''}
                </div>
                <button onclick="showRecipeDetails('${recipe.id}')" class="view-recipe-btn">View Recipe</button>
            </div>
        `;
        
        recipeList.appendChild(card);
    });
    
    updatePaginationControls();
}

function showRecipeDetails(recipeId) {
    const recipe = findRecipeById(recipeId);
    if (!recipe) return;

    const modal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-recipe-content');

    if (modal && modalContent) {
        modalContent.innerHTML = `
            <h2>${recipe.name}</h2>
            <div class="modal-image" style="background-image: url('${recipe.image}')"></div>
            <div class="modal-details">
                <div class="recipe-info">
                    <p><strong>Cuisine:</strong> ${recipe.cuisine || 'International'}</p>
                    <p><strong>Source:</strong> ${recipe.source}</p>
                </div>
                
                <div class="ingredients-section">
                    <div class="ingredient-list">
                        <h3>Ingredients You Have:</h3>
                        <ul class="used-ingredients">
                            ${recipe.usedIngredients.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                    
                    ${recipe.missedIngredients.length > 0 ? `
                        <div class="ingredient-list">
                            <h3>Additional Ingredients Needed:</h3>
                            <ul class="missed-ingredients">
                                ${recipe.missedIngredients.map(ing => `<li>${ing}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="instructions-section">
                    <h3>Instructions:</h3>
                    <ol class="instructions-list">
                        ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>

                ${recipe.video ? `
                    <div class="video-section">
                        <h3>Video Tutorial:</h3>
                        <a href="${recipe.video}" target="_blank" class="video-link">Watch on YouTube</a>
                    </div>
                ` : ''}
            </div>
        `;
        modal.style.display = 'block';
    }
}

function findRecipeById(recipeId) {
    return allRecipes.find(recipe => recipe.id === recipeId);
}

function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
    if (recipeList) {
        recipeList.style.opacity = show ? '0.5' : '1';
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    if (recipeList) {
        recipeList.innerHTML = '';
    }
}

function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Sorting functions
const sortFunctions = {
    relevance: (a, b) => b.matchScore - a.matchScore,
    extraAsc: (a, b) => a.missedIngredients.length - b.missedIngredients.length,
    extraDesc: (a, b) => b.missedIngredients.length - a.missedIngredients.length,
    totalAsc: (a, b) => (a.usedIngredients.length + a.missedIngredients.length) - 
                        (b.usedIngredients.length + b.missedIngredients.length),
    totalDesc: (a, b) => (b.usedIngredients.length + b.missedIngredients.length) - 
                        (a.usedIngredients.length + a.missedIngredients.length),
    nameAsc: (a, b) => a.name.localeCompare(b.name),
    nameDesc: (a, b) => b.name.localeCompare(a.name),
    matchScore: (a, b) => {
        const matchDiff = b.usedIngredients.length - a.usedIngredients.length;
        if (matchDiff !== 0) return matchDiff;
        return a.missedIngredients.length - b.missedIngredients.length;
    },
    time: (a, b) => a.cookingTime - b.cookingTime,
    timeDesc: (a, b) => b.cookingTime - a.cookingTime
};

function filterAndDisplayRecipes() {
    if (!allRecipes || !Array.isArray(allRecipes)) return;

    let filteredRecipes = allRecipes.filter(recipe => {
        // Filter by cooking time
        if (currentFilters.maxTime !== 'any') {
            const maxMinutes = parseInt(currentFilters.maxTime);
            if (recipe.cookingTime > maxMinutes) return false;
        }

        // Filter by dietary preference
        if (currentFilters.dietary && currentFilters.dietary !== 'all') {
            return recipe.dietaryTags && recipe.dietaryTags.includes(currentFilters.dietary);
        }

        return true;
    });

    displayRecipes(filteredRecipes);
}

function updatePaginationControls() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (!prevButton || !nextButton || !pageInfo) return;

    const maxPages = Math.ceil(allRecipes.length / recipesPerPage);
    
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= maxPages;
    
    pageInfo.textContent = `Page ${currentPage} of ${maxPages}`;
}

// Helper function to detect dietary tags
function detectDietaryTags(recipe) {
    const tags = new Set();
    const ingredients = [...(recipe.usedIngredients || []), ...(recipe.missedIngredients || [])];
    const allText = ingredients.join(' ').toLowerCase() + ' ' + (recipe.instructions || []).join(' ').toLowerCase();
    
    // Vegetarian check
    const meatIngredients = ['chicken', 'beef', 'pork', 'fish', 'meat', 'lamb', 'shrimp', 'seafood'];
    if (!meatIngredients.some(meat => allText.includes(meat))) {
        tags.add('vegetarian');
        
        // Vegan check
        const dairyIngredients = ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'ghee', 'egg'];
        if (!dairyIngredients.some(dairy => allText.includes(dairy))) {
            tags.add('vegan');
        }
    }
    
    // Gluten-free check
    const glutenIngredients = ['flour', 'bread', 'pasta', 'wheat', 'barley', 'rye'];
    if (!glutenIngredients.some(gluten => allText.includes(gluten))) {
        tags.add('gluten-free');
    }
    
    // Dairy-free check
    const dairyIngredients = ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'ghee'];
    if (!dairyIngredients.some(dairy => allText.includes(dairy))) {
        tags.add('dairy-free');
    }
    
    // Low-carb check
    const highCarbIngredients = ['rice', 'potato', 'bread', 'pasta', 'sugar', 'flour', 'corn'];
    if (!highCarbIngredients.some(carb => allText.includes(carb))) {
        tags.add('low-carb');
    }
    
    return Array.from(tags);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal elements
    const modal = document.getElementById('recipe-modal');
    const closeBtn = document.getElementsByClassName('close')[0];
    
    // Modal close button
    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Pagination controls
    const prevPageButton = document.getElementById('prev-page');
    if (prevPageButton) {
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
            }
        });
    }
    
    const nextPageButton = document.getElementById('next-page');
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => {
            const maxPages = Math.ceil(allRecipes.length / recipesPerPage);
            if (currentPage < maxPages) {
                currentPage++;
                displayCurrentPage();
            }
        });
    }
    
    // Initialize sort dropdown
    const sortDropdown = document.getElementById('sort-recipes');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (e) => {
            currentSortMethod = e.target.value;
            sortRecipes();
            currentPage = 1;
            displayCurrentPage();
        });
    }

    // Time filter
    const timeFilter = document.getElementById('max-time');
    if (timeFilter) {
        timeFilter.addEventListener('change', (e) => {
            currentFilters.maxTime = e.target.value;
            filterAndDisplayRecipes();
        });
    }

    // Dietary preferences filter
    const dietaryFilter = document.getElementById('dietary-pref');
    if (dietaryFilter) {
        dietaryFilter.addEventListener('change', (e) => {
            currentFilters.dietary = e.target.value;
            filterAndDisplayRecipes();
        });
    }

    // Display waste-saving tips
    displayTips();
    
    // Initialize community recipes on page load
    displayCommunityRecipes();
    
    // Modal handling for recipe submission
    const recipeModal = document.getElementById('recipe-form-modal');
    const recipeCloseBtn = recipeModal.querySelector('.close');
    
    window.openRecipeForm = function() {
        recipeModal.style.display = 'block';
    }
    
    recipeCloseBtn.onclick = function() {
        recipeModal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    }
});

