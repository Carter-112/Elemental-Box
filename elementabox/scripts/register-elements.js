// register-elements.js
// This file ensures all elements are properly registered in the application

// Define element categories
const categories = {
    "eraser": ["Eraser"],
    "solid-powder": ["Bacteria", "Fertilizer", "ExplosivePowder", "Gunpowder", "GlassShard", "Salt", "Sand", "Snow", "Ash", "StaticCharge"],
    "solid": ["Brick", "Fuse", "Glass", "Ice", "C4", "Crystal", "Dynamite", "Metal", "Stone", "SolidSalt", "Plant", "Resin", "Steel", "SolidAsh", "Battery", "Bulb", "Switch", "Wire", "Wood"],
    "gas": ["Fire", "Bubble", "Balloon", "Steam", "Smoke"],
    "solid-spawner": ["Faucet", "Torch"],
    "liquid": ["Acid", "Glue", "Lava", "Napalm", "Oil", "Tar", "Water", "Sludge"]
};

// Function to register all elements
function registerAllElements() {
    console.log("Registering all elements...");
    
    // This will hold the count of successfully registered elements
    let registeredCount = 0;
    
    // Track any missing elements
    const missingElements = [];
    
    // Iterate through each category
    for (const [category, elements] of Object.entries(categories)) {
        console.log(`Registering ${category} elements...`);
        
        // Iterate through each element in the category
        for (const element of elements) {
            const elementName = element + "Element";
            
            // Check if the element is available in the global scope
            if (window[elementName]) {
                console.log(`✓ Registered: ${element}`);
                registeredCount++;
                
                // Ensure category is set correctly
                window[elementName].category = category;
                
                // Make sure the element is registered in the simulation
                if (window.registerElement && typeof window.registerElement === 'function') {
                    window.registerElement(window[elementName]);
                }
            } else {
                console.error(`✗ Missing: ${element}`);
                missingElements.push(element);
            }
        }
    }
    
    console.log(`Registration complete. ${registeredCount}/45 elements registered.`);
    
    if (missingElements.length > 0) {
        console.error(`Missing elements: ${missingElements.join(', ')}`);
        alert(`Warning: ${missingElements.length} elements are missing: ${missingElements.join(', ')}`);
    }
}

// Run the registration function when the document is loaded
document.addEventListener('DOMContentLoaded', registerAllElements);

// Export the function in case it needs to be called manually
window.registerAllElements = registerAllElements; 
// This file ensures all elements are properly registered in the application

// Define element categories
const categories = {
    "eraser": ["Eraser"],
    "solid-powder": ["Bacteria", "Fertilizer", "ExplosivePowder", "Gunpowder", "GlassShard", "Salt", "Sand", "Snow", "Ash", "StaticCharge"],
    "solid": ["Brick", "Fuse", "Glass", "Ice", "C4", "Crystal", "Dynamite", "Metal", "Stone", "SolidSalt", "Plant", "Resin", "Steel", "SolidAsh", "Battery", "Bulb", "Switch", "Wire", "Wood"],
    "gas": ["Fire", "Bubble", "Balloon", "Steam", "Smoke"],
    "solid-spawner": ["Faucet", "Torch"],
    "liquid": ["Acid", "Glue", "Lava", "Napalm", "Oil", "Tar", "Water", "Sludge"]
};

// Function to register all elements
function registerAllElements() {
    console.log("Registering all elements...");
    
    // This will hold the count of successfully registered elements
    let registeredCount = 0;
    
    // Track any missing elements
    const missingElements = [];
    
    // Iterate through each category
    for (const [category, elements] of Object.entries(categories)) {
        console.log(`Registering ${category} elements...`);
        
        // Iterate through each element in the category
        for (const element of elements) {
            const elementName = element + "Element";
            
            // Check if the element is available in the global scope
            if (window[elementName]) {
                console.log(`✓ Registered: ${element}`);
                registeredCount++;
                
                // Ensure category is set correctly
                window[elementName].category = category;
                
                // Make sure the element is registered in the simulation
                if (window.registerElement && typeof window.registerElement === 'function') {
                    window.registerElement(window[elementName]);
                }
            } else {
                console.error(`✗ Missing: ${element}`);
                missingElements.push(element);
            }
        }
    }
    
    console.log(`Registration complete. ${registeredCount}/45 elements registered.`);
    
    if (missingElements.length > 0) {
        console.error(`Missing elements: ${missingElements.join(', ')}`);
        alert(`Warning: ${missingElements.length} elements are missing: ${missingElements.join(', ')}`);
    }
}

// Run the registration function when the document is loaded
document.addEventListener('DOMContentLoaded', registerAllElements);

// Export the function in case it needs to be called manually
window.registerAllElements = registerAllElements; 
 