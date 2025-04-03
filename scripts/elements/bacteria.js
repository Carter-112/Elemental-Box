// Bacteria Element
// A powder that spreads over "living" materials and consumes them

const BacteriaElement = {
    name: 'bacteria',
    label: 'Bacteria',
    description: 'A powder that spreads over and consumes living materials',
    category: 'solid-powder',
    defaultColor: '#5C8D2A', // Greenish color
    
    // Physical properties
    density: 0.7,
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
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
        particle.age = 0;
        particle.energy = 100; // Initial energy level for reproduction
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Bacteria falls with gravity like other powders
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to slide to bottom-left or bottom-right
            const randomDirection = Math.random() < 0.5;
            
            if (randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Increment age
        grid[y][x].age = (grid[y][x].age || 0) + 1;
        
        // Bacteria has a limited lifespan
        if (grid[y][x].age > 1000) {
            if (Math.random() < 0.1) {
                grid[y][x] = null; // Bacteria dies
                return;
            }
        }
        
        // Bacteria needs to find food to survive and reproduce
        let foundFood = false;
        
        // Check neighbors for food
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
        
        // Shuffle neighbors to make growth pattern more natural
        for (let i = neighbors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
        }
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Check if the neighbor is "food" (something living or organic)
            const isFood = grid[ny][nx].type === 'plant' || 
                          grid[ny][nx].type === 'wood' || 
                          grid[ny][nx].type === 'soil';
            
            if (isFood) {
                // Consume the food
                foundFood = true;
                grid[y][x].energy += 10;
                
                // Slowly consume the food
                if (Math.random() < 0.1) {
                    grid[ny][nx] = {
                        type: 'bacteria',
                        color: this.defaultColor,
                        processed: true,
                        age: 0,
                        energy: 50, // Less energy for newly converted bacteria
                        isPowder: true,
                        isGas: false,
                        isLiquid: false,
                        isSolid: false,
                        flammable: true
                    };
                }
                break;
            }
        }
        
        // If bacteria has enough energy, it can reproduce into an empty neighboring cell
        if (grid[y][x].energy > 150) {
            // Find an empty cell to reproduce into
            const emptyNeighbors = [];
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (isInBounds(nx, ny) && !grid[ny][nx]) {
                    emptyNeighbors.push({ x: nx, y: ny });
                }
            }
            
            // If there's an empty cell, reproduce
            if (emptyNeighbors.length > 0 && Math.random() < 0.2) {
                const targetCell = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                
                // Create a new bacteria with half the parent's energy
                grid[targetCell.y][targetCell.x] = {
                    type: 'bacteria',
                    color: this.defaultColor,
                    processed: true,
                    age: 0,
                    energy: grid[y][x].energy / 2,
                    isPowder: true,
                    isGas: false,
                    isLiquid: false,
                    isSolid: false,
                    flammable: true
                };
                
                // Parent loses energy used for reproduction
                grid[y][x].energy /= 2;
            }
        }
        
        // If bacteria doesn't find food, it slowly loses energy
        if (!foundFood) {
            grid[y][x].energy -= 1;
            
            // If energy depletes, bacteria dies
            if (grid[y][x].energy <= 0) {
                grid[y][x] = null;
                return;
            }
            
            // Change color based on energy level to show health
            const energyPercent = grid[y][x].energy / 100;
            const r = Math.floor(92 * (1 - energyPercent));
            const g = Math.floor(141 * energyPercent);
            const b = Math.floor(42 * energyPercent);
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
        }
    },
    
    // Render the bacteria with slight variation in color based on age
    render: function(ctx, x, y, particle, cellSize) {
        // Base color with variations based on energy/age
        let color = particle.color || this.defaultColor;
        
        // For bacteria with energy data, show different colors
        if (particle.energy !== undefined) {
            const energyLevel = Math.min(1, Math.max(0, particle.energy / 100));
            // We already set the color in the process function based on energy
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
};

// Make the element available globally
window.BacteriaElement = BacteriaElement; 