// Steel element module
window.SteelElement = {
    name: 'steel',
    defaultColor: '#71797E',  // Steel gray
    density: 7.8,             // Very high density
    durability: 0.95,         // Extremely durable
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.2,          // Sticky for building structures
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 0.9,        // Very high thermal conductivity
    
    // Process steel particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const steel = grid[y][x];
        steel.processed = true;
        
        // Check if we can fall
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
            return;
        }
        
        // Steel conducts heat very well
        this.conductHeat(x, y, grid, isInBounds);
        
        // Steel can melt at extremely high temperatures (higher than regular metal)
        if (steel.temperature >= 1500) {
            // 3% chance to melt per frame at high temperature
            if (Math.random() < 0.03) {
                grid[y][x] = this.createMoltenSteelParticle();
                return;
            }
        }
        
        // Steel can conduct electricity
        if (steel.charged) {
            this.conductElectricity(x, y, grid, isInBounds);
            
            // Charge dissipates over time
            if (Math.random() < 0.1) {
                steel.charged = false;
                steel.chargeLevel = 0;
            }
        }
    },
    
    // Check if the steel is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x] && this.isSolidSupport(grid[y+1][x].type)) {
            return true;
        }
        
        // Check if supports exist on all sides
        let supportCount = 0;
        
        // Check left, right, up, and corners
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX] && this.isSolidSupport(grid[newY][newX].type)) {
                supportCount++;
            }
        }
        
        // Steel can stay in place if supported by at least 2 sides
        // This allows for more complex structures
        return supportCount >= 2;
    },
    
    // Check if a material type can support steel
    isSolidSupport: function(type) {
        return ['steel', 'metal', 'brick', 'stone'].includes(type);
    },
    
    // Try to make steel fall
    tryToFall: function(x, y, grid, isInBounds) {
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down to the left or right
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
        
        // Steel is heavy and can displace lighter materials below it
        if (y < grid.length - 1) {
            const particleBelow = grid[y+1][x];
            if (particleBelow && this.shouldDisplace(particleBelow)) {
                // Swap positions
                grid[y][x] = particleBelow;
                grid[y+1][x] = steel;
                particleBelow.processed = true;
                return;
            }
        }
    },
    
    // Helper function to determine if steel should displace a particle
    shouldDisplace: function(particle) {
        // Steel displaces particles with lower density
        return particle.density !== undefined && particle.density < this.density && 
               (particle.isLiquid || particle.isGas || particle.isPowder);
    },
    
    // Heat conductivity for steel
    conductHeat: function(x, y, grid, isInBounds) {
        const steel = grid[y][x];
        let totalTemp = steel.temperature;
        let count = 1;
        
        // Check all 8 directions (steel conducts heat very well)
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
        
        // Collect temperatures from neighbors
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                totalTemp += grid[newY][newX].temperature;
                count++;
            }
        }
        
        // Calculate new temperature with conductivity factor
        const avgTemp = totalTemp / count;
        steel.temperature = steel.temperature * (1 - this.conductivity) + avgTemp * this.conductivity;
    },
    
    // Steel conducts electricity
    conductElectricity: function(x, y, grid, isInBounds) {
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
        
        // Chance to create sparks if highly charged
        const steel = grid[y][x];
        if (steel.chargeLevel && steel.chargeLevel > 3 && Math.random() < 0.1) {
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (isInBounds(newX, newY) && !grid[newY][newX]) {
                    // Create electric spark
                    grid[newY][newX] = {
                        type: 'fire',
                        color: '#AADDFF', // Bluish-white color for electric spark
                        temperature: 100,
                        processed: false,
                        burnDuration: 3, // Very short duration
                        flammable: false,
                        isElectricSpark: true
                    };
                    break;
                }
            }
        }
        
        // Conduct charge to other metals and activate nearby electrical components
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                
                // Charge other metals
                if ((neighbor.type === 'metal' || neighbor.type === 'steel') && !neighbor.charged) {
                    neighbor.charged = true;
                    neighbor.chargeLevel = (steel.chargeLevel || 1) - 1;
                }
                
                // Activate wires
                if (neighbor.type === 'wire' && !neighbor.active) {
                    neighbor.active = true;
                    neighbor.activeDuration = 5;
                }
                
                // Light up bulbs
                if (neighbor.type === 'bulb' && !neighbor.lit) {
                    neighbor.lit = true;
                    neighbor.litDuration = 10;
                }
                
                // Activate switches
                if (neighbor.type === 'switch' && !neighbor.on) {
                    neighbor.on = true;
                }
            }
        }
    },
    
    // Create molten steel particle when steel melts
    createMoltenSteelParticle: function() {
        return {
            type: 'lava',
            color: '#FF6A00', // Brighter orange for molten steel
            temperature: 1600,
            processed: false,
            flammable: false,
            density: 7.0, // Slightly less dense than solid steel
            isLiquid: true,
            isMoltenMetal: true,
            isMoltenSteel: true // Special flag
        };
    },
    
    // Custom rendering for steel
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base steel color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add metallic highlights for steel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.4, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.4);
        ctx.fill();
        
        // Draw a darker shade on the bottom-right
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.6);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.6, y * CELL_SIZE + CELL_SIZE);
        ctx.fill();
        
        // Add occasional rivets for steel texture
        if ((x + y) % 3 === 0) {
            ctx.fillStyle = '#555555';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.5, 
                y * CELL_SIZE + CELL_SIZE * 0.5, 
                CELL_SIZE * 0.1, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            // Highlight on rivet
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.45, 
                y * CELL_SIZE + CELL_SIZE * 0.45, 
                CELL_SIZE * 0.05, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Show temperature effects
        if (particle.temperature > 500) {
            const temp = Math.min(1, (particle.temperature - 500) / 1000);
            
            // Steel goes through color changes as it heats up
            let r = 128 + Math.floor(127 * temp);
            let g = 128 - Math.floor(64 * temp);
            let b = 128 - Math.floor(64 * temp);
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Show electric charge effect
        if (particle.charged) {
            const chargeIntensity = Math.min(0.7, ((particle.chargeLevel || 1) / 5));
            
            // Pulsing electricity effect
            const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
            
            ctx.fillStyle = `rgba(100, 200, 255, ${chargeIntensity * pulse})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.charged = false;
        particle.chargeLevel = 0;
        return particle;
    }
}; 