// Glass Element
// A transparent solid that can break into shards

const GlassElement = {
    name: 'glass',
    label: 'Glass',
    description: 'A transparent solid that can shatter under pressure',
    category: 'solid',
    defaultColor: 'rgba(140, 210, 240, 0.5)', // Semi-transparent blue

    // Physical properties
    density: 2.5,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,    // Make sure glass stays in place
    hasGravity: false, // Ensure it doesn't have gravity
    isSpawner: false,
    isElectrical: false,

    // Behavior properties
    flammable: false,
    conductive: true, // Glass can conduct sparks
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default

    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.integrity = 100; // Glass integrity (breaks when low)
        particle.isStatic = true;
        particle.hasGravity = false;
        return particle;
    },

    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;

        // Mark as processed
        grid[y][x].processed = true;

        // Glass is static and doesn't fall

        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        // Track impacts on glass
        let impactForce = 0;

        // Check for static charge/sparks to conduct
        let hasStaticCharge = false;

        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;

            // Acid corrodes glass
            if (grid[ny][nx].type === 'acid') {
                grid[y][x].integrity -= 0.5;

                // Acid is slightly consumed
                if (Math.random() < 0.1) {
                    grid[ny][nx].acidity = (grid[ny][nx].acidity || 1) - 0.1;
                    if (grid[ny][nx].acidity <= 0) {
                        grid[ny][nx] = null;
                    }
                }
            }

            // Extreme heat can crack glass
            if (grid[ny][nx].temperature > 800) {
                grid[y][x].integrity -= 0.2;
            }

            // Explosions or heavy impacts damage glass
            if (grid[ny][nx].explosive && grid[ny][nx].detonated) {
                grid[y][x].integrity -= 50;
            }

            // Moving particles cause impacts
            if (grid[ny][nx].justMoved && grid[ny][nx].density > 1) {
                impactForce += grid[ny][nx].density * 0.2;
            }

            // Conduct static charge/sparks across glass
            if (grid[ny][nx].type === 'static-charge') {
                hasStaticCharge = true;
            }
        }

        // Apply impact damage
        if (impactForce > 0) {
            grid[y][x].integrity -= impactForce;
        }

        // Conduct static charge/sparks across glass
        if (hasStaticCharge) {
            // Find an empty cell to propagate the spark to
            const emptyNeighbors = [];

            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;

                if (isInBounds(nx, ny) && !grid[ny][nx]) {
                    emptyNeighbors.push({ x: nx, y: ny });
                }
            }

            // If there's an empty cell, create a new static charge there
            if (emptyNeighbors.length > 0 && Math.random() < 0.3) {
                const targetCell = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];

                grid[targetCell.y][targetCell.x] = {
                    type: 'static-charge',
                    color: '#FFFF33',
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false,
                    lifetime: 10 + Math.floor(Math.random() * 10),
                    temperature: 40
                };
            }
        }

        // Check if glass breaks
        if (grid[y][x].integrity <= 0) {
            this.breakGlass(x, y, grid, isInBounds);
            return;
        }
    },

    // Break glass into shards
    breakGlass: function(x, y, grid, isInBounds) {
        // Replace with a glass shard
        const shard = {
            type: 'glass-shard',
            color: 'rgba(140, 210, 240, 0.7)',
            processed: true,
            isSolid: false,
            isPowder: true,
            isGas: false,
            isLiquid: false,
            temperature: grid[y][x].temperature,
            density: 2.2
        };

        grid[y][x] = shard;

        // Create glass shards in surrounding empty cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];

        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (!isInBounds(nx, ny) || grid[ny][nx]) continue;

            // 40% chance to create a shard
            if (Math.random() < 0.4) {
                const shard = {
                    type: 'glass-shard',
                    color: 'rgba(140, 210, 240, 0.7)',
                    processed: true,
                    isSolid: false,
                    isPowder: true,
                    isGas: false,
                    isLiquid: false,
                    temperature: grid[y][x].temperature,
                    density: 2.2
                };

                grid[ny][nx] = shard;
            }
        }
    },

    // Render the glass
    render: function(x, y, ctx, cellSize) {
        // Make glass semi-transparent
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Add slight reflection highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

        // Draw a small highlight in the top-left corner
        const highlightSize = cellSize * 0.3;
        ctx.fillRect(x * cellSize, y * cellSize, highlightSize, highlightSize);

        // Add a subtle edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.GlassElement = GlassElement;
}