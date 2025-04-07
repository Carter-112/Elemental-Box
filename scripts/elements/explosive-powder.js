// Explosive Powder Element
// A highly volatile powder that explodes with even a small amount of heat

const ExplosivePowderElement = {
    name: 'explosive-powder',
    label: 'Explosive Powder',
    description: 'A highly volatile powder that explodes with even a small amount of heat',
    category: 'solid-powder',
    defaultColor: '#CC5500', // Burnt orange color

    // Physical properties
    density: 0.65,
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
    explosive: true,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default

    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.stability = 100; // Full stability
        return particle;
    },

    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;

        // Mark as processed
        grid[y][x].processed = true;

        // Check for explosion trigger conditions
        const isHot = grid[y][x].temperature > 50; // Very sensitive to heat
        const isCompressed = this.checkCompression(x, y, grid, isInBounds);

        // Reduce stability when hot or compressed
        if (isHot) {
            grid[y][x].stability -= 5 + (grid[y][x].temperature - 50) / 10;
        }
        if (isCompressed) {
            grid[y][x].stability -= 1;
        }

        // If unstable, explode!
        if (grid[y][x].stability <= 0) {
            this.explode(x, y, grid, isInBounds);
            return;
        }

        // Explosive powder falls with gravity like other powders
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

        // Check for interactions with surrounding cells
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

        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;

            // Interactions with fire - immediate explosion
            if (grid[ny][nx].type === 'fire') {
                this.explode(x, y, grid, isInBounds);
                return;
            }

            // Interactions with lava - immediate explosion
            if (grid[ny][nx].type === 'lava') {
                this.explode(x, y, grid, isInBounds);
                return;
            }

            // Interactions with other explosives - chain reaction
            if (grid[ny][nx].type === 'explosive-powder' || grid[ny][nx].type === 'gunpowder' ||
                grid[ny][nx].type === 'c4' || grid[ny][nx].type === 'dynamite') {

                // If the neighbor is unstable, this powder becomes more unstable too
                if (grid[ny][nx].stability && grid[ny][nx].stability < 50) {
                    grid[y][x].stability -= 2;
                }
            }

            // Transfer heat from hot neighbors
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > grid[y][x].temperature) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.1;
            }
        }

        // If many explosive powder particles are stacked together (pressure), decrease stability
        if (isCompressed && Math.random() < 0.01) {
            grid[y][x].stability -= 1;

            // With enough pressure, explosive powder can form dynamite
            if (isCompressed && Math.random() < 0.005) {
                // Check if there are many explosive powder particles around
                let powderCount = 0;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (isInBounds(nx, ny) && grid[ny][nx] &&
                            grid[ny][nx].type === 'explosive-powder') {
                            powderCount++;
                        }
                    }
                }

                // If there's enough powder, form dynamite
                if (powderCount >= 8) {
                    grid[y][x] = {
                        type: 'dynamite',
                        color: '#FF4136',
                        processed: true,
                        temperature: grid[y][x].temperature,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        isStatic: true,
                        hasGravity: false,
                        fuseLength: 40 + Math.floor(Math.random() * 20),
                        fuseActive: false,
                        fuseTimer: 0
                    };
                    return;
                }
            }
        }

        // Change color based on stability
        const stabilityLevel = Math.min(1, Math.max(0, grid[y][x].stability / 100));
        const r = Math.floor(204 + (255 - 204) * (1 - stabilityLevel));
        const g = Math.floor(85 * stabilityLevel);
        const b = Math.floor(0);
        grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
    },

    // Check if the powder is under pressure (many particles around it)
    checkCompression: function(x, y, grid, isInBounds) {
        let count = 0;
        let threshold = 6; // Need this many neighbors for compression

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (isInBounds(nx, ny) && grid[ny][nx]) {
                    count++;
                    if (count >= threshold) return true;
                }
            }
        }

        return false;
    },

    // Create an explosion
    explode: function(x, y, grid, isInBounds) {
        // Large explosion radius
        const radius = 8;

        // Remove the exploding particle
        grid[y][x] = null;

        // Explosion effect - destroy blocks in radius and create fire/smoke
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > radius) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (!isInBounds(nx, ny)) continue;

                // Force decreases with distance
                const force = 1 - (distance / radius);

                // Clear existing particles with probability based on force
                if (grid[ny][nx] && Math.random() < force * 0.9) {
                    // Certain materials resist explosion (like steel, stone)
                    if (grid[ny][nx].type === 'steel' || grid[ny][nx].type === 'stone') {
                        // Add damage but don't destroy immediately
                        grid[ny][nx].damage = (grid[ny][nx].damage || 0) + force * 50;
                        if (grid[ny][nx].damage > 100) {
                            grid[ny][nx] = null;
                        }
                    } else {
                        // Other materials are destroyed
                        grid[ny][nx] = null;
                    }
                }

                // Create fire and smoke with probability based on force and distance
                if (!grid[ny][nx] && Math.random() < force * 0.6) {
                    const particleType = Math.random() < 0.7 ? 'fire' : 'smoke';

                    grid[ny][nx] = {
                        type: particleType,
                        color: particleType === 'fire' ? '#FF4500' : '#A9A9A9',
                        temperature: particleType === 'fire' ? 500 : 200,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: particleType === 'fire' ?
                            20 + Math.floor(Math.random() * 30) :
                            50 + Math.floor(Math.random() * 100)
                    };
                }
            }
        }
    },

    // Render the explosive powder
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Visual indicator for unstable powder
        if (particle.stability && particle.stability < 50) {
            // Add small dots to indicate instability
            const dotSize = Math.max(1, Math.floor(cellSize / 6));
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(
                x * cellSize + (cellSize / 2) - (dotSize / 2),
                y * cellSize + (cellSize / 2) - (dotSize / 2),
                dotSize,
                dotSize
            );
        }
    }
};

// Make the element available globally
window.ExplosivePowderElement = ExplosivePowderElement;