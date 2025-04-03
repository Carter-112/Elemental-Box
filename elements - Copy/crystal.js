// Crystal element module
window.CrystalElement = {
    name: 'crystal',
    defaultColor: '#A4F9F3', // Light turquoise
    density: 2.8,            // High density
    durability: 0.6,         // Fairly durable
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,         // Not very sticky
    isLiquid: false,
    isGas: false,
    isPowder: false,
    reflectivity: 0.9,       // Highly reflective
    growthChance: 0.005,     // Small chance to grow
    
    // Process crystal particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const crystal = grid[y][x];
        crystal.processed = true;
        
        // Initialize crystal properties if they don't exist
        if (crystal.size === undefined) {
            crystal.size = 1;  // Base size
            crystal.facets = Math.floor(Math.random() * 3) + 3;  // 3-5 facets
            crystal.hue = Math.random() < 0.3 ? 
                this.getRandomHue() : 
                (180 + Math.floor(Math.random() * 40) - 20); // Usually turquoise, sometimes random
        }
        
        // Check if we can fall (for isolated crystals)
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
            return;
        }
        
        // Handle temperature effects
        this.handleTemperatureEffects(x, y, grid, isInBounds);
        
        // Attempt to grow the crystal
        this.tryToGrow(x, y, grid, isInBounds);
        
        // Handle light/energy interactions (like prism effects)
        this.handleLightInteractions(x, y, grid, isInBounds);
    },
    
    // Get a random hue for crystal variants
    getRandomHue: function() {
        const hues = [
            0,    // Red
            60,   // Yellow
            120,  // Green
            240,  // Blue
            280,  // Purple
            320   // Pink
        ];
        return hues[Math.floor(Math.random() * hues.length)];
    },
    
    // Check if the crystal is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x] && this.isSolidSupport(grid[y+1][x].type)) {
            return true;
        }
        
        // Check if part of a crystal structure
        if (this.isPartOfCrystalStructure(x, y, grid, isInBounds)) {
            return true;
        }
        
        return false;
    },
    
    // Check if crystal is part of a larger structure
    isPartOfCrystalStructure: function(x, y, grid, isInBounds) {
        // Check all 8 directions for connected crystals
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
        
        // For a crystal to be part of a structure, it needs at least 2 neighboring crystals
        let connectedCrystals = 0;
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX] && 
                (grid[newY][newX].type === 'crystal' || 
                 this.isSolidSupport(grid[newY][newX].type))) {
                connectedCrystals++;
                
                // Connected to at least 2 crystals or solid supports
                if (connectedCrystals >= 2) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Check if a material type can support crystal
    isSolidSupport: function(type) {
        return ['crystal', 'stone', 'brick', 'metal', 'steel', 'glass', 'salt'].includes(type);
    },
    
    // Try to make isolated crystal fall
    tryToFall: function(x, y, grid, isInBounds) {
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down diagonally (less likely as it's a crystal)
        if (Math.random() < 0.3) {  // 30% chance to try sliding
            const directions = [
                { dx: -1, dy: 1 }, // down-left
                { dx: 1, dy: 1 }   // down-right
            ];
            
            // Randomize direction to avoid bias
            if (Math.random() < 0.5) {
                directions.reverse();
            }
            
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (isInBounds(newX, newY) && !grid[newY][newX]) {
                    grid[newY][newX] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Handle temperature effects on crystal
    handleTemperatureEffects: function(x, y, grid, isInBounds) {
        const crystal = grid[y][x];
        let totalTemp = crystal.temperature;
        let count = 1;
        
        // Check surrounding cells for temperature influence
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                totalTemp += grid[newY][newX].temperature;
                count++;
                
                // Extreme heat can melt crystal
                if (grid[newY][newX].temperature > 1200) {
                    if (Math.random() < 0.05) { // 5% chance to melt per frame at extreme temp
                        grid[y][x] = this.createMoltenCrystal(crystal);
                        return;
                    }
                }
                
                // Extreme cold can make crystal grow faster
                if (grid[newY][newX].temperature < 0 && Math.random() < 0.1) {
                    crystal.growthChance = (crystal.growthChance || this.growthChance) * 1.5;
                }
            }
        }
        
        // Update temperature (crystals conduct heat slowly)
        crystal.temperature = (crystal.temperature * 0.8) + (totalTemp / count * 0.2);
    },
    
    // Try to grow the crystal in open directions
    tryToGrow: function(x, y, grid, isInBounds) {
        const crystal = grid[y][x];
        const growthChance = crystal.growthChance || this.growthChance;
        
        // Base chance for growth
        if (Math.random() > growthChance) return;
        
        // Crystals need support to grow
        if (!this.isSupported(x, y, grid, isInBounds)) return;
        
        // Prefer to grow toward water/salt water if present
        let waterDirection = null;
        
        // Check all 8 directions for growth possibilities
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
        
        // Shuffle directions to randomize growth
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        // First scan for water to preferentially grow toward
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                if (grid[newY][newX].type === 'water' || 
                    (grid[newY][newX].type === 'salt_water')) {
                    waterDirection = dir;
                    break;
                }
            }
        }
        
        // If water found, try to grow in that direction
        if (waterDirection) {
            const newX = x + waterDirection.dx;
            const newY = y + waterDirection.dy;
            
            if (grid[newY][newX].type === 'salt_water') {
                // Higher chance to grow into salt water
                if (Math.random() < 0.3) {
                    grid[newY][newX] = this.createCrystalParticle(crystal);
                    // Consume the salt water
                    return;
                }
            } else if (grid[newY][newX].type === 'water') {
                // Lower chance to grow into regular water
                if (Math.random() < 0.1) {
                    grid[newY][newX] = this.createCrystalParticle(crystal);
                    // Consume the water
                    return;
                }
            }
        }
        
        // Otherwise try to grow in any empty direction
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                // Growth more likely upward
                const growthProbability = dir.dy < 0 ? 0.7 : 0.3;
                
                if (Math.random() < growthProbability) {
                    grid[newY][newX] = this.createCrystalParticle(crystal);
                    return;
                }
            }
        }
    },
    
    // Create a new crystal particle for growth
    createCrystalParticle: function(parent) {
        return {
            type: 'crystal',
            color: parent.color || this.getCrystalColor(parent.hue || 180),
            temperature: parent.temperature,
            processed: false,
            flammable: false,
            density: this.density,
            hue: parent.hue || 180,
            facets: parent.facets || Math.floor(Math.random() * 3) + 3,
            size: Math.max(1, (parent.size || 1) - 0.2 + (Math.random() * 0.4)),
            growthChance: Math.max(0.001, (parent.growthChance || this.growthChance) * 0.9)
        };
    },
    
    // Create molten crystal when melted
    createMoltenCrystal: function(crystal) {
        return {
            type: 'lava',
            color: this.adjustColorBrightness(this.getCrystalColor(crystal.hue || 180), 50),
            temperature: 1300,
            processed: false,
            flammable: false,
            density: 2.2, // Slightly less dense than solid crystal
            isLiquid: true,
            isMoltenCrystal: true
        };
    },
    
    // Get crystal color based on hue
    getCrystalColor: function(hue) {
        return `hsl(${hue}, 70%, 80%)`;
    },
    
    // Adjust color brightness
    adjustColorBrightness: function(color, percent) {
        // A simple implementation for HSL colors
        if (color.startsWith('hsl')) {
            // Extract hue from hsl(h, s%, l%)
            const hue = parseInt(color.substring(4, color.indexOf(',')));
            return `hsl(${hue}, 100%, ${Math.min(90, 50 + percent)}%)`;
        }
        return color; // Return original if not HSL
    },
    
    // Handle light interactions (prism effects)
    handleLightInteractions: function(x, y, grid, isInBounds) {
        const crystal = grid[y][x];
        
        // Crystal reflects light and energy
        // Check for nearby light sources (fire, lava, electricity)
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        let lightSource = false;
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                
                // Check for light sources
                if (neighbor.type === 'fire' || 
                    neighbor.type === 'lava' || 
                    neighbor.charged || 
                    neighbor.lit) {
                    
                    lightSource = true;
                    
                    // Save info about light for rendering
                    crystal.illuminated = true;
                    crystal.lightColor = neighbor.color || 
                        (neighbor.type === 'fire' ? '#FF9900' : 
                        (neighbor.type === 'lava' ? '#FF4500' : '#FFFFFF'));
                    
                    // If not already reflecting, find where to reflect light
                    if (!crystal.reflecting && Math.random() < 0.3) {
                        this.createLightReflection(x, y, grid, isInBounds, neighbor, dir);
                    }
                }
            }
        }
        
        // Reset illumination if no light sources nearby
        if (!lightSource) {
            crystal.illuminated = false;
            crystal.reflecting = false;
            crystal.lightColor = null;
        }
    },
    
    // Create light reflection/refraction effect
    createLightReflection: function(x, y, grid, isInBounds, lightSource, incidentDir) {
        const crystal = grid[y][x];
        
        // Determine refraction direction (opposite of incident)
        let refractionDir = {
            dx: -incidentDir.dx,
            dy: -incidentDir.dy
        };
        
        // Randomize slightly for crystal facets
        if (Math.random() < 0.5) {
            if (Math.random() < 0.5) {
                refractionDir = { dx: refractionDir.dy, dy: refractionDir.dx };
            } else {
                refractionDir = { dx: -refractionDir.dy, dy: -refractionDir.dx };
            }
        }
        
        // Find the cell to refract light into
        const newX = x + refractionDir.dx;
        const newY = y + refractionDir.dy;
        
        if (isInBounds(newX, newY) && !grid[newY][newX]) {
            // Create a temporary light effect particle
            grid[newY][newX] = {
                type: 'light',
                color: this.getPrismColor(crystal.hue || 180),
                temperature: 30,
                processed: true,
                density: 0.1,
                isGas: true,
                lifetime: 3 + Math.floor(Math.random() * 5),
                age: 0,
                isTemporary: true
            };
            
            // Mark the crystal as reflecting
            crystal.reflecting = true;
        }
    },
    
    // Get a prism-refracted color
    getPrismColor: function(baseHue) {
        // Shift the hue based on refraction
        const hueShift = Math.floor(Math.random() * 360);
        return `hsl(${hueShift}, 100%, 70%)`;
    },
    
    // Custom rendering for crystal
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base crystal appearance
        ctx.fillStyle = particle.color || this.getCrystalColor(particle.hue || 180);
        
        if (particle.size && particle.size < 0.9) {
            // Smaller crystals appear as individual gems
            const padding = CELL_SIZE * (1 - particle.size) / 2;
            ctx.fillRect(
                x * CELL_SIZE + padding, 
                y * CELL_SIZE + padding, 
                CELL_SIZE - padding * 2, 
                CELL_SIZE - padding * 2
            );
        } else {
            // Full-sized crystals
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Draw crystal facets/structure
        const facets = particle.facets || 4;
        
        // Draw facet lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        
        const centerX = x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2;
        
        for (let i = 0; i < facets; i++) {
            const angle = (i / facets) * Math.PI * 2;
            const edgeX = centerX + Math.cos(angle) * (CELL_SIZE * 0.4);
            const edgeY = centerY + Math.sin(angle) * (CELL_SIZE * 0.4);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(edgeX, edgeY);
            ctx.stroke();
        }
        
        // Add sparkle effect
        ctx.fillStyle = 'white';
        const sparkleSize = CELL_SIZE * 0.1;
        ctx.fillRect(
            centerX - sparkleSize / 2,
            centerY - sparkleSize / 2,
            sparkleSize,
            sparkleSize
        );
        
        // If crystal is illuminated, add glow effect
        if (particle.illuminated) {
            // Create a radial gradient for the glow
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, CELL_SIZE
            );
            
            const lightColor = particle.lightColor || 'white';
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(
                x * CELL_SIZE - CELL_SIZE / 2,
                y * CELL_SIZE - CELL_SIZE / 2,
                CELL_SIZE * 2,
                CELL_SIZE * 2
            );
            ctx.globalAlpha = 1.0;
        }
        
        // Show temperature effects
        if (particle.temperature > 200) {
            const temp = Math.min(1, (particle.temperature - 200) / 1000);
            
            // Crystal glows red-orange as it heats up
            let r = 255;
            let g = 100 + Math.floor(155 * (1 - temp));
            let b = 100 + Math.floor(155 * (1 - temp));
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${temp * 0.7})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.hue = particle.hue || (Math.random() < 0.3 ? 
            this.getRandomHue() : 
            (180 + Math.floor(Math.random() * 40) - 20));
        particle.color = this.getCrystalColor(particle.hue);
        particle.facets = particle.facets || Math.floor(Math.random() * 3) + 3;
        particle.size = particle.size || 1;
        particle.growthChance = particle.growthChance || this.growthChance;
        return particle;
    }
}; 