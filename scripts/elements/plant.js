// Plant Element
// A solid that grows with water and grows faster with fertilizer

const PlantElement = {
    name: 'plant',
    label: 'Plant',
    description: 'A living plant that grows with water and fertilizer',
    category: 'solid',
    defaultColor: '#33AA44',
    
    // Physical properties
    density: 0.7,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.hydration = 0; // Plant's water level
        particle.nutrition = 0; // Plant's fertilizer level
        particle.growthProgress = 0; // Progress towards growing
        particle.age = 0; // Plant's age in simulation steps
        particle.burning = false; // Whether the plant is on fire
        particle.burnTimer = 0; // How long it's been burning
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].hydration === undefined) {
            grid[y][x].hydration = 0;
        }
        
        if (grid[y][x].nutrition === undefined) {
            grid[y][x].nutrition = 0;
        }
        
        if (grid[y][x].growthProgress === undefined) {
            grid[y][x].growthProgress = 0;
        }
        
        if (grid[y][x].age === undefined) {
            grid[y][x].age = 0;
        }
        
        if (grid[y][x].burning === undefined) {
            grid[y][x].burning = false;
        }
        
        if (grid[y][x].burnTimer === undefined) {
            grid[y][x].burnTimer = 0;
        }
        
        // Age the plant
        grid[y][x].age++;
        
        // Check surroundings for water, fertilizer, and fire
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // top-left
            { dx: 1, dy: -1 },  // top-right
            { dx: -1, dy: 1 },  // bottom-left
            { dx: 1, dy: 1 }    // bottom-right
        ];
        
        // Check for interactions with neighboring elements
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Water increases hydration
            if (grid[ny][nx].type === 'water' && grid[y][x].hydration < 10) {
                grid[y][x].hydration += 0.5;
                
                // Small chance to consume water
                if (Math.random() < 0.05) {
                    grid[ny][nx] = null;
                }
            }
            
            // Fertilizer increases nutrition
            if (grid[ny][nx].type === 'fertilizer' && grid[y][x].nutrition < 10) {
                grid[y][x].nutrition += 1.0;
                
                // Consume fertilizer
                grid[ny][nx] = null;
            }
            
            // Fire ignites the plant
            if ((grid[ny][nx].type === 'fire' || grid[ny][nx].temperature > 100) && !grid[y][x].burning) {
                grid[y][x].burning = true;
                grid[y][x].temperature += 30;
            }
        }
        
        // Burning plant behavior
        if (grid[y][x].burning) {
            // Increase temperature
            grid[y][x].temperature = Math.min(grid[y][x].temperature + 3, 150);
            
            // Change color as it burns
            const burnProgress = Math.min(1.0, grid[y][x].burnTimer / 50);
            const r = 51 + Math.floor(burnProgress * 150);
            const g = 170 - Math.floor(burnProgress * 120);
            const b = 68 - Math.floor(burnProgress * 60);
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Increment burn timer
            grid[y][x].burnTimer++;
            
            // Create fire particles above
            if (y > 0 && Math.random() < 0.2) {
                const fireX = x;
                const fireY = y - 1;
                
                if (!grid[fireY][fireX]) {
                    grid[fireY][fireX] = {
                        type: 'fire',
                        color: '#FF9900',
                        temperature: grid[y][x].temperature + 20,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: 3 + Math.floor(Math.random() * 5)
                    };
                }
            }
            
            // Create smoke occasionally
            if (y > 1 && Math.random() < 0.05) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 2;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#777777',
                        temperature: grid[y][x].temperature - 20,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Plant eventually burns up
            if (grid[y][x].burnTimer > 60) {
                // Turn to ash
                grid[y][x] = {
                    type: 'ash',
                    color: '#777777',
                    temperature: grid[y][x].temperature - 30,
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false
                };
                return;
            }
            
            // Don't grow if burning
            return;
        }
        
        // Plant growth
        if (grid[y][x].hydration > 0) {
            // Calculate growth rate based on hydration and nutrition
            let growthRate = 0.02 * Math.min(grid[y][x].hydration, 1.0);
            
            // Fertilizer speeds up growth
            if (grid[y][x].nutrition > 0) {
                growthRate *= (1 + grid[y][x].nutrition * 0.3);
                grid[y][x].nutrition -= 0.01; // Fertilizer gets consumed
            }
            
            // Add progress towards growth
            grid[y][x].growthProgress += growthRate;
            
            // Consume some hydration
            grid[y][x].hydration -= 0.01;
            
            // Update color based on hydration level
            const hydrationFactor = Math.min(1.0, grid[y][x].hydration / 5.0);
            const baseG = 170;
            const g = Math.max(120, baseG * hydrationFactor);
            grid[y][x].color = `rgb(51, ${g}, 68)`;
            
            // Try to grow new plant segments when growth threshold is reached
            if (grid[y][x].growthProgress >= 1.0) {
                // Reset growth progress
                grid[y][x].growthProgress = 0;
                
                // Prioritize growing upward if possible
                const growDirections = [
                    { dx: 0, dy: -1, priority: 1 },   // up
                    { dx: -1, dy: 0, priority: 2 },   // left
                    { dx: 1, dy: 0, priority: 2 },    // right
                    { dx: -1, dy: -1, priority: 3 },  // up-left
                    { dx: 1, dy: -1, priority: 3 },   // up-right
                ];
                
                // Sort by priority
                growDirections.sort((a, b) => a.priority - b.priority);
                
                // Try directions in order of priority
                let grew = false;
                for (const dir of growDirections) {
                    const nx = x + dir.dx;
                    const ny = y + dir.dy;
                    
                    if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
                    
                    // Create a new plant particle
                    grid[ny][nx] = {
                        type: 'plant',
                        color: grid[y][x].color,
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        isStatic: true,
                        hydration: grid[y][x].hydration * 0.7,
                        nutrition: grid[y][x].nutrition * 0.5,
                        growthProgress: 0,
                        age: 0
                    };
                    
                    grew = true;
                    break;
                }
                
                // If couldn't grow in any direction, store extra growth for later
                if (!grew) {
                    grid[y][x].growthProgress = 0.5;
                }
            }
        } else {
            // Plant looks slightly wilted when dry
            grid[y][x].color = '#2E8B57';
        }
        
        // Temperature effects
        if (grid[y][x].temperature > 80 && !grid[y][x].burning) {
            // Hot temperatures can ignite plants
            if (Math.random() < 0.05) {
                grid[y][x].burning = true;
            }
        } else if (grid[y][x].temperature < 0) {
            // Cold temperatures slow growth
            grid[y][x].growthProgress *= 0.5;
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base plant color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add plant details
        if (!particle.burning) {
            // Draw stem and leaves
            ctx.fillStyle = '#228833';
            
            // Calculate variations based on age
            const age = particle.age || 0;
            const offset = (Math.sin(age * 0.05) * cellSize * 0.1);
            
            // Draw stem
            ctx.fillRect(
                x * cellSize + cellSize * 0.45, 
                y * cellSize, 
                cellSize * 0.1, 
                cellSize
            );
            
            // Draw leaves
            ctx.beginPath();
            ctx.ellipse(
                x * cellSize + cellSize * 0.3 + offset, 
                y * cellSize + cellSize * 0.3, 
                cellSize * 0.2, 
                cellSize * 0.1, 
                Math.PI * 0.25, 
                0, Math.PI * 2
            );
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(
                x * cellSize + cellSize * 0.7 - offset, 
                y * cellSize + cellSize * 0.6, 
                cellSize * 0.2, 
                cellSize * 0.1, 
                -Math.PI * 0.25, 
                0, Math.PI * 2
            );
            ctx.fill();
        } else {
            // Burning effect
            const burnProgress = particle.burnTimer / 60;
            
            // Add flames
            const flameCount = 3;
            for (let i = 0; i < flameCount; i++) {
                const flameX = x * cellSize + (i / flameCount) * cellSize;
                const flameHeight = (0.5 + Math.random() * 0.5) * cellSize * (1 - burnProgress);
                
                const gradient = ctx.createLinearGradient(
                    flameX, 
                    y * cellSize, 
                    flameX, 
                    y * cellSize - flameHeight
                );
                
                gradient.addColorStop(0, 'rgba(255, 153, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                
                // Draw triangular flame
                ctx.beginPath();
                ctx.moveTo(flameX, y * cellSize);
                ctx.lineTo(flameX + cellSize * 0.1, y * cellSize - flameHeight);
                ctx.lineTo(flameX - cellSize * 0.1, y * cellSize - flameHeight);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
};

// Make the element available globally
window.PlantElement = PlantElement; 