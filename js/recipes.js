const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Local recipe database
const localRecipes = [
    {
        id: 'butter-chicken',
        name: "Butter Chicken",
        cuisine: "Indian",
        cookingTime: 45, // in minutes
        dietaryTags: ['gluten-free'],
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=480",
        ingredients: [
            "chicken",
            "butter",
            "cream",
            "tomato",
            "onion",
            "garlic",
            "ginger",
            "garam masala",
            "cumin",
            "coriander",
            "turmeric"
        ],
        instructions: [
            "Marinate chicken with yogurt and spices",
            "Cook onion, garlic, and ginger until golden",
            "Add tomatoes and spices, simmer until sauce thickens",
            "Add chicken and cook until done",
            "Finish with butter and cream"
        ]
    },
    {
        id: 'dal-tadka',
        name: "Dal Tadka",
        cuisine: "Indian",
        cookingTime: 40,
        dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=480",
        ingredients: [
            "yellow lentils",
            "onion",
            "tomato",
            "garlic",
            "ginger",
            "cumin",
            "turmeric",
            "ghee"
        ],
        instructions: [
            "Cook lentils until soft",
            "Prepare tadka with ghee, cumin, garlic",
            "Add onions and cook until golden",
            "Add tomatoes and spices",
            "Combine with lentils and simmer"
        ]
    },
    {
        id: 'palak-paneer',
        name: "Palak Paneer",
        cuisine: "Indian",
        cookingTime: 30,
        dietaryTags: ['vegetarian', 'gluten-free'],
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=480",
        ingredients: [
            "spinach",
            "paneer",
            "onion",
            "garlic",
            "ginger",
            "garam masala",
            "cream"
        ],
        instructions: [
            "Blanch and puree spinach",
            "Cook onion, garlic, and ginger",
            "Add spices and spinach puree",
            "Add paneer cubes and cream",
            "Simmer until heated through"
        ]
    },
    {
        id: 'chana-masala',
        name: "Chana Masala",
        cuisine: "Indian",
        cookingTime: 45,
        dietaryTags: ['vegetarian', 'gluten-free'],
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=480",
        ingredients: [
            "chickpeas",
            "onion",
            "tomato",
            "garlic",
            "ginger",
            "garam masala",
            "cumin",
            "coriander"
        ],
        instructions: [
            "Cook onion, garlic, and ginger",
            "Add spices and tomatoes",
            "Add chickpeas and simmer",
            "Garnish with fresh coriander"
        ]
    },
    {
        id: 'vegetable-biryani',
        name: "Vegetable Biryani",
        cuisine: "Indian",
        cookingTime: 50,
        dietaryTags: ['vegetarian', 'gluten-free'],
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=480",
        ingredients: [
            "basmati rice",
            "mixed vegetables",
            "onion",
            "garlic",
            "ginger",
            "biryani masala",
            "saffron",
            "ghee"
        ],
        instructions: [
            "Cook rice with whole spices",
            "Prepare vegetables with spices",
            "Layer rice and vegetables",
            "Steam until fully cooked",
            "Garnish with fried onions"
        ]
    }
];

// Search recipes by ingredients
async function searchRecipesByIngredients(ingredients) {
    try {
        // Local recipes search
        const localMatches = localRecipes.map(recipe => {
            const usedIngredients = recipe.ingredients.filter(ing => 
                ingredients.some(userIng => ing.toLowerCase().includes(userIng.toLowerCase()))
            );
            
            const missedIngredients = recipe.ingredients.filter(ing => 
                !ingredients.some(userIng => ing.toLowerCase().includes(userIng.toLowerCase()))
            );

            return {
                ...recipe,
                usedIngredients,
                missedIngredients,
                matchScore: usedIngredients.length / (usedIngredients.length + missedIngredients.length)
            };
        });

        // MealDB API search
        const mealDbResults = await searchMealDbRecipes(ingredients);
        const formattedMealDbResults = mealDbResults.map(recipe => ({
            ...recipe,
            cookingTime: estimateCookingTime(recipe.instructions), // Estimate cooking time from instructions
            dietaryTags: detectDietaryTags(recipe), // Detect dietary tags from ingredients and instructions
            matchScore: recipe.usedIngredients.length / (recipe.usedIngredients.length + recipe.missedIngredients.length)
        }));

        // Combine and sort results
        return [...localMatches, ...formattedMealDbResults];
    } catch (error) {
        console.error('Error in searchRecipesByIngredients:', error);
        return [];
    }
}

// Helper function to estimate cooking time from instructions
function estimateCookingTime(instructions) {
    const timeKeywords = {
        'minute': 1,
        'minutes': 1,
        'hour': 60,
        'hours': 60
    };
    
    let totalMinutes = 0;
    const timePattern = /(\d+)\s*(minute|minutes|hour|hours)/gi;
    
    instructions.forEach(step => {
        const matches = [...step.matchAll(timePattern)];
        matches.forEach(match => {
            const [_, number, unit] = match;
            totalMinutes += parseInt(number) * timeKeywords[unit.toLowerCase()];
        });
    });
    
    return totalMinutes || 30; // Default to 30 minutes if no time found
}

// Helper function to detect dietary tags from recipe
function detectDietaryTags(recipe) {
    const tags = [];
    const ingredients = [...recipe.usedIngredients, ...recipe.missedIngredients];
    const allText = ingredients.join(' ').toLowerCase() + ' ' + recipe.instructions.join(' ').toLowerCase();
    
    // Vegetarian check
    const meatIngredients = ['chicken', 'beef', 'pork', 'fish', 'meat', 'lamb'];
    if (!meatIngredients.some(meat => allText.includes(meat))) {
        tags.push('vegetarian');
        
        // Vegan check
        const dairyIngredients = ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'ghee'];
        if (!dairyIngredients.some(dairy => allText.includes(dairy))) {
            tags.push('vegan');
        }
    }
    
    // Gluten-free check
    const glutenIngredients = ['flour', 'bread', 'pasta', 'wheat'];
    if (!glutenIngredients.some(gluten => allText.includes(gluten))) {
        tags.push('gluten-free');
    }
    
    // Low-carb check
    const highCarbIngredients = ['rice', 'potato', 'bread', 'pasta', 'sugar'];
    if (!highCarbIngredients.some(carb => allText.includes(carb))) {
        tags.push('low-carb');
    }
    
    return tags;
}

// Search local recipe database
async function searchLocalRecipes(ingredients) {
    try {
        // Convert ingredients to lowercase for case-insensitive matching
        const normalizedIngredients = ingredients.map(ing => ing.toLowerCase().trim());
        
        // Filter and score recipes based on matching ingredients
        const matchedRecipes = localRecipes.map(recipe => {
            const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
            
            // Count matching ingredients
            const usedIngredients = normalizedIngredients.filter(ing => 
                recipeIngredients.some(recipeIng => recipeIng.includes(ing))
            );

            const missedIngredients = recipeIngredients.filter(ing => 
                !normalizedIngredients.some(userIng => ing.includes(userIng))
            );

            // Calculate match score (percentage of recipe ingredients matched)
            const matchScore = usedIngredients.length / recipeIngredients.length;

            return {
                id: `local_${recipe.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                source: 'Local Database',
                name: recipe.name,
                image: recipe.image,
                missedIngredients,
                usedIngredients,
                instructions: recipe.instructions,
                cuisine: recipe.cuisine,
                cookingTime: recipe.cookingTime,
                dietaryTags: recipe.dietaryTags,
                matchScore
            };
        }).filter(recipe => recipe.usedIngredients.length > 0);

        // Sort by match score
        return matchedRecipes.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
        console.error('Error searching local recipes:', error);
        return [];
    }
}

// Search MealDB API
async function searchMealDbRecipes(ingredients) {
    try {
        // MealDB doesn't support multiple ingredient search, so we'll search for each ingredient
        const searchPromises = ingredients.map(async ingredient => {
            try {
                // Use www.themealdb.com instead of themealdb.com and add mode: 'cors'
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.warn(`MealDB search failed for ingredient: ${ingredient}`);
                    return [];
                }

                const data = await response.json();
                return data.meals || [];
            } catch (error) {
                console.warn(`Error searching MealDB for ingredient: ${ingredient}`, error);
                return [];
            }
        });

        const searchResults = await Promise.all(searchPromises);
        
        // Find recipes that appear in multiple ingredient searches
        const recipeMap = new Map();
        searchResults.forEach((meals, index) => {
            meals.forEach(meal => {
                if (!recipeMap.has(meal.idMeal)) {
                    recipeMap.set(meal.idMeal, {
                        meal,
                        ingredients: [ingredients[index]],
                        count: 1
                    });
                } else {
                    const entry = recipeMap.get(meal.idMeal);
                    entry.ingredients.push(ingredients[index]);
                    entry.count++;
                }
            });
        });

        // Get details for recipes that use at least 2 ingredients
        const potentialRecipes = Array.from(recipeMap.entries())
            .filter(([_, data]) => data.count >= 2)
            .map(([_, data]) => data.meal);

        // Fetch recipe details with CORS headers
        const detailedRecipes = await Promise.all(potentialRecipes.map(async recipe => {
            try {
                const detailsResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!detailsResponse.ok) {
                    console.warn(`Failed to fetch details for recipe ${recipe.idMeal}`);
                    return null;
                }
                
                const detailsData = await detailsResponse.json();
                if (!detailsData.meals || !detailsData.meals[0]) {
                    console.warn(`No details found for recipe ${recipe.idMeal}`);
                    return null;
                }

                const mealDetails = detailsData.meals[0];
                
                // Extract ingredients and measures
                const recipeIngredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ingredient = mealDetails[`strIngredient${i}`];
                    const measure = mealDetails[`strMeasure${i}`];
                    if (ingredient && ingredient.trim()) {
                        recipeIngredients.push(`${measure.trim()} ${ingredient.trim()}`.toLowerCase());
                    }
                }

                // Categorize ingredients
                const usedIngredients = ingredients.filter(ing => 
                    recipeIngredients.some(recipeIng => recipeIng.includes(ing.toLowerCase()))
                );

                const missedIngredients = recipeIngredients.filter(ing => 
                    !ingredients.some(userIng => ing.includes(userIng.toLowerCase()))
                );

                // YouTube video ID extraction
                const youtubeId = mealDetails.strYoutube ? 
                    mealDetails.strYoutube.split('v=')[1] : null;

                return {
                    id: `mealdb_${recipe.idMeal}`,
                    source: 'MealDB',
                    name: mealDetails.strMeal,
                    image: mealDetails.strMealThumb,
                    missedIngredients,
                    usedIngredients,
                    instructions: mealDetails.strInstructions.split('\r\n').filter(step => step.trim()),
                    cuisine: mealDetails.strArea || 'International',
                    url: mealDetails.strSource || null,
                    video: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null
                };
            } catch (error) {
                console.error('Error fetching MealDB recipe details:', error);
                return null;
            }
        }));

        // Filter out null results and return valid recipes
        return detailedRecipes.filter(recipe => recipe !== null);
    } catch (error) {
        console.error('Error fetching MealDB recipes:', error);
        return [];
    }
}

// Waste-saving tips
const wasteSavingTips = [
    {
        ingredient: "vegetables",
        tips: [
            "Store vegetables properly in the crisper drawer",
            "Use wilted vegetables in soups or stews",
            "Freeze excess vegetables for later use",
            "Make vegetable stock from scraps"
        ]
    },
    {
        ingredient: "fruits",
        tips: [
            "Store fruits in the right place (some need refrigeration, others don't)",
            "Use overripe fruits in smoothies or baking",
            "Freeze fruits for smoothies or desserts",
            "Make jam or preserves with excess fruits"
        ]
    },
    {
        ingredient: "bread",
        tips: [
            "Store bread in a bread box or freezer",
            "Make breadcrumbs from stale bread",
            "Use stale bread for French toast or bread pudding",
            "Make croutons for salads and soups"
        ]
    },
    {
        ingredient: "dairy",
        tips: [
            "Check expiration dates before purchasing",
            "Store dairy products in the back of the fridge",
            "Use sour milk in baking",
            "Freeze cheese and butter if needed"
        ]
    },
    {
        ingredient: "herbs",
        tips: [
            "Store herbs with stems in water like flowers",
            "Dry excess herbs for later use",
            "Freeze herbs in oil in ice cube trays",
            "Make herb-infused oils or vinegars"
        ]
    }
];
