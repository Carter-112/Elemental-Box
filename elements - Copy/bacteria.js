// Bacteria element module
window.BacteriaElement = {
    name: 'bacteria',
    defaultColor: '#97bd8a', // Light green
    density: 0.8,
    durability: 0.2,
    flammable: true,
    burnTemperature: 70,
    defaultTemperature: 25,
    stickiness: 0.1,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    spreadRate: 0.05, // Chance to spread to neighboring cells
    growthRate: 0.02, // Rate at which bacteria colony grows
    consumptionRate: 0.01, // Rate at which it consumes organic matter
    temperatureRange: { min: 0, max: 60 }, // Temperature range for activity
    
    // Process bacteria particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const bacteria = grid[y][x];
        bacteria.processed = true;
        
        // Initialize bacteria properties if not set
        if (bacteria.age === undefined) {
            bacteria.age = 0;
        }
        if (bacteria.energy === undefined) {
            bacteria.energy = 50; // Initial energy
        }
        if (bacteria.colony === undefined) {
            bacteria.colony = 1; // Start with 1 unit
        }
        
        // Age the bacteria
        bacteria.age++;
        
        // Check if bacteria is in suitable temperature range
        const isActive = this.isInSuitableTemperature(bacteria);
        
        // Check if bacteria should die from unsuitable conditions
        if (this.shouldDie(bacteria)) {
            this.die(x, y, grid);
            return;
        }
        
        // If active, bacteria can spread, consume, and grow
        if (isActive) {
            // Consume energy for activity
            bacteria.energy -= 0.2;
            
            // Try to consume nearby organic matter
            if (Math.random() < this.consumptionRate * bacteria.colony) {
                this.consumeNearby(x, y, grid, isInBounds);
            }
            
            // Try to spread to nearby cells
            if (Math.random() < this.spreadRate * (bacteria.colony / 5)) {
                this.spread(x, y, grid, isInBounds);
            }
            
            // Try to grow
            if (Math.random() < this.growthRate && bacteria.energy > 30) {
                this.grow(bacteria);
            }
            
            // Update appearance based on colony size and activity
            this.updateAppearance(bacteria);
        }
        
        // If bacteria is in water, it can move with the water
        if (this.isInLiquid(x, y, grid, isInBounds)) {
            this.moveWithLiquid(x, y, grid, isInBounds);
        } else if (!this.isSupported(x, y, grid, isInBounds)) {
            // If not supported, fall downward
            this.tryToFall(x, y, grid, isInBounds);
        }
    },
    
    // Check if temperature is suitable for bacteria
    isInSuitableTemperature: function(bacteria) {
        return bacteria.temperature >= this.temperatureRange.min && 
               bacteria.temperature <= this.temperatureRange.max;
    },
    
    // Check if bacteria should die
    shouldDie: function(bacteria) {
        // Die if out of energy
        if (bacteria.energy <= 0) {
            return true;
        }
        
        // Die if temperature is way outside viable range
        if (bacteria.temperature < this.temperatureRange.min - 20 || 
            bacteria.temperature > this.temperatureRange.max + 20) {
            return true;
        }
        
        // Die of old age with increasing probability
        const ageDeathChance = Math.max(0, (bacteria.age - 1000) / 5000);
        if (Math.random() < ageDeathChance) {
            return true;
        }
        
        return false;
    },
    
    // Process bacteria death
    die: function(x, y, grid) {
        // Convert to decayed matter
        grid[y][x] = {
            type: 'decayedMatter',
            color: '#7a7a57', // Grayish-green
            density: 0.6,
            temperature: grid[y][x].temperature,
            processed: true,
            flammable: true,
            isPowder: true,
            durability: 0.1,
            fertility: 0.5 // Dead bacteria makes good fertilizer
        };
    },
    
    // Consume nearby organic matter
    consumeNearby: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        // Shuffle directions for more natural behavior
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Check if the target is consumable organic matter
            if (this.isConsumable(neighbor)) {
                // Gain energy from consuming
                grid[y][x].energy += 20;
                
                // Replace with partly consumed matter or remove completely
                if (Math.random() < 0.7) {
                    grid[newY][newX] = {
                        type: 'decayedMatter',
                        color: '#7a7a57',
                        density: 0.6,
                        temperature: neighbor.temperature,
                        processed: true,
                        flammable: true,
                        isPowder: true,
                        durability: 0.1
                    };
                } else {
                    grid[newY][newX] = null;
                }
                
                return; // Only consume one thing per turn
            }
        }
    },
    
    // Check if a particle is consumable by bacteria
    isConsumable: function(particle) {
        const consumableTypes = [
            'plant', 'grass', 'seed', 'wood', 'leaf',
            'fruit', 'meat', 'deadMatter'
        ];
        
        // Check if it's one of the consumable types
        if (consumableTypes.includes(particle.type)) {
            return true;
        }
        
        // Check if it's organic (has the property)
        if (particle.isOrganic) {
            return true;
        }
        
        return false;
    },
    
    // Spread to nearby empty spaces or suitable mediums
    spread: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 }    // down-right
        ];
        
        // Shuffle directions for more natural behavior
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        const bacteria = grid[y][x];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const target = grid[newY][newX];
            
            // Spread to empty space
            if (!target) {
                // Create new bacteria colony if energy permits
                if (bacteria.energy >= 10) {
                    // Create a new colony with part of the parent's energy and colony size
                    grid[newY][newX] = {
                        type: 'bacteria',
                        color: this.defaultColor,
                        density: this.density,
                        temperature: bacteria.temperature,
                        processed: false,
                        flammable: true,
                        energy: 20,
                        colony: Math.ceil(bacteria.colony * 0.5),
                        age: 0
                    };
                    
                    // Parent loses some energy
                    bacteria.energy -= 10;
                    
                    return; // Only spread once per turn
                }
            }
            // Infect suitable medium (like water or organic matter that's not fully consumed)
            else if (target.type === 'water' || 
                    (this.isConsumable(target) && Math.random() < 0.3)) {
                
                // Transform the target into bacteria if energy permits
                if (bacteria.energy >= 15) {
                    grid[newY][newX] = {
                        type: 'bacteria',
                        color: this.defaultColor,
                        density: this.density,
                        temperature: bacteria.temperature,
                        processed: false,
                        flammable: true,
                        energy: 25, // More energy from consuming the host
                        colony: Math.ceil(bacteria.colony * 0.3),
                        age: 0
                    };
                    
                    // Parent loses some energy
                    bacteria.energy -= 15;
                    
                    return; // Only spread once per turn
                }
            }
        }
    },
    
    // Grow the bacterial colony
    grow: function(bacteria) {
        // Increase colony size but consume energy
        bacteria.colony = Math.min(10, bacteria.colony + 1);
        bacteria.energy -= 10;
    },
    
    // Update appearance based on colony size and activity
    updateAppearance: function(bacteria) {
        // Adjust color based on colony size
        const greenValue = Math.min(255, 140 + 10 * bacteria.colony);
        const blueValue = Math.max(100, 138 - 5 * bacteria.colony);
        bacteria.color = `rgb(151, ${greenValue}, ${blueValue})`;
        
        // Adjust appearance scale based on colony size
        bacteria.scale = 0.8 + (bacteria.colony / 10) * 0.4;
    },
    
    // Check if bacteria is in a liquid
    isInLiquid: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (neighbor && neighbor.isLiquid) {
                return true;
            }
        }
        
        return false;
    },
    
    // Move with surrounding liquid
    moveWithLiquid: function(x, y, grid, isInBounds) {
        // Only move occasionally to simulate being carried by currents
        if (Math.random() < 0.3) {
            const directions = [
                { dx: 0, dy: 1 },   // down
                { dx: -1, dy: 0 },  // left
                { dx: 1, dy: 0 },   // right
                { dx: -1, dy: 1 },  // down-left
                { dx: 1, dy: 1 }    // down-right
            ];
            
            // Shuffle directions
            for (let i = directions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [directions[i], directions[j]] = [directions[j], directions[i]];
            }
            
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (!isInBounds(newX, newY)) continue;
                
                const target = grid[newY][newX];
                if (!target || target.isLiquid) {
                    // Move the bacteria
                    const temp = grid[y][x];
                    grid[y][x] = target;
                    grid[newY][newX] = temp;
                    return;
                }
            }
        }
    },
    
    // Check if particle is supported
    isSupported: function(x, y, grid, isInBounds) {
        // Check if at bottom of grid
        if (y >= grid.length - 1) return true;
        
        // Check if there's something below
        return grid[y+1][x] !== null;
    },
    
    // Try to fall if not supported
    tryToFall: function(x, y, grid, isInBounds) {
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
        }
    },
    
    // Custom rendering for bacteria
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        
        // Scale based on colony size
        const scale = particle.scale || 1.0;
        const padding = CELL_SIZE * (1 - scale) / 2;
        
        ctx.fillRect(
            x * CELL_SIZE + padding, 
            y * CELL_SIZE + padding, 
            CELL_SIZE * scale, 
            CELL_SIZE * scale
        );
        
        // Draw colony pattern
        if (particle.colony > 1) {
            // Darker shade for colony pattern
            const darkColor = this.adjustColorBrightness(particle.color, -30);
            ctx.fillStyle = darkColor;
            
            // Draw dots representing colony
            const dotCount = Math.min(7, particle.colony + 1);
            const dotSize = CELL_SIZE * 0.1;
            
            for (let i = 0; i < dotCount; i++) {
                const dotX = (Math.random() * 0.8 + 0.1) * CELL_SIZE;
                const dotY = (Math.random() * 0.8 + 0.1) * CELL_SIZE;
                
                ctx.beginPath();
                ctx.arc(
                    x * CELL_SIZE + dotX,
                    y * CELL_SIZE + dotY,
                    dotSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Show glow effect for active colonies
        if (particle.colony > 5 && this.isInSuitableTemperature(particle)) {
            ctx.fillStyle = `rgba(50, 255, 50, ${particle.colony / 30})`;
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE/2,
                y * CELL_SIZE + CELL_SIZE/2,
                CELL_SIZE * 0.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    },
    
    // Helper function to adjust color brightness
    adjustColorBrightness: function(color, amount) {
        // Convert RGB to hex
        const hexToRgb = (hex) => {
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Handle non-hex colors (like rgb format)
        if (!color.startsWith('#')) {
            const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                
                const adjustedR = Math.max(0, Math.min(255, r + amount));
                const adjustedG = Math.max(0, Math.min(255, g + amount));
                const adjustedB = Math.max(0, Math.min(255, b + amount));
                
                return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
            }
            return color; // Return original if format not recognized
        }
        
        // Adjust hex color
        const rgb = hexToRgb(color);
        if (!rgb) return color;
        
        rgb.r = Math.max(0, Math.min(255, rgb.r + amount));
        rgb.g = Math.max(0, Math.min(255, rgb.g + amount));
        rgb.b = Math.max(0, Math.min(255, rgb.b + amount));
        
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.age = 0;
        particle.energy = 50;
        particle.colony = 1;
        particle.scale = 1.0;
        return particle;
    }
}; 