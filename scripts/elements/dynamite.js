// Dynamite Element
// A powerful explosive that can be ignited

const DynamiteElement = {
    name: 'dynamite',
    label: 'Dynamite',
    description: 'Powerful explosive that detonates when ignited',
    category: 'solid',
    defaultColor: '#FF4136', // Bright red
    
    // Physical properties
    density: 1.6,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Make it stay in place
    hasGravity: false,
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
        particle.isStatic = true;
        particle.hasGravity = false;
        particle.fuseLength = 40 + Math.floor(Math.random() * 20); // Random fuse length
        particle.fuseActive = false;
        particle.fuseTimer = 0;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Dynamite is static and doesn't fall
        
        // Process active fuse
        if (grid[y][x].fuseActive) {
            grid[y][x].fuseTimer++;
            
            // Visual indication that fuse is burning
            const fuseProgress = grid[y][x].fuseTimer / grid[y][x].fuseLength;
            const r = Math.min(255, Math.floor(255 * (1 + fuseProgress * 0.2)));
            const g = Math.max(0, Math.floor(65 - fuseProgress * 65));
            const b = Math.max(0, Math.floor(54 - fuseProgress * 54));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Create smoke particles as fuse burns
            if (grid[y][x].fuseTimer % 3 === 0) {
                // Try to place smoke above
                if (isInBounds(x, y - 1) && !grid[y - 1][x]) {
                    grid[y - 1][x] = {
                        type: 'smoke',
                        color: '#888888',
                        processed: true,
                        temperature: 100,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifespan: 30 + Math.random() * 20
                    };
                }
            }
            
            // Explode when timer reaches fuse length
            if (grid[y][x].fuseTimer >= grid[y][x].fuseLength) {
                this.explode(x, y, grid, isInBounds);
                return;
            }
        }
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Ignite fuse when exposed to fire or other explosions
            if (!grid[y][x].fuseActive && 
                (grid[ny][nx].type === 'fire' || 
                 grid[ny][nx].type === 'lava' ||
                 (grid[ny][nx].temperature && grid[ny][nx].temperature > 200) ||
                 (grid[ny][nx].explosive && grid[ny][nx].detonating))) {
                grid[y][x].fuseActive = true;
                grid[y][x].fuseTimer = 0;
            }
            
            // Heat transfer
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > grid[y][x].temperature) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.05;
                
                // High enough temperature can auto-ignite
                if (grid[y][x].temperature > 150 && !grid[y][x].fuseActive) {
                    grid[y][x].fuseActive = true;
                    grid[y][x].fuseTimer = 0;
                }
            }
        }
    },
    
    // Explode the dynamite
    explode: function(x, y, grid, isInBounds) {
        // Explosion radius
        const radius = 10;
        
        // Remove the original dynamite
        grid[y][x] = null;
        
        // Create explosion effect in radius
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > radius) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (!isInBounds(nx, ny)) continue;
                
                // Calculate explosion intensity based on distance
                const intensity = 1 - (distance / radius);
                
                // Destroy or affect existing cells with diminishing effect by distance
                if (grid[ny][nx]) {
                    // Core explosion - destroy everything
                    if (distance < radius * 0.3) {
                        // Create fire/plasma in center of explosion
                        grid[ny][nx] = {
                            type: distance < radius * 0.1 ? 'plasma' : 'fire',
                            color: distance < radius * 0.1 ? '#FFFFFF' : '#FF4500',
                            processed: true,
                            temperature: distance < radius * 0.1 ? 3000 : 800,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifespan: 10 + Math.random() * 20
                        };
                    }
                    // Medium range - damage and chance to ignite flammables
                    else if (distance < radius * 0.7) {
                        if (Math.random() < intensity * 0.8) {
                            // Ignite flammables
                            if (grid[ny][nx].flammable) {
                                grid[ny][nx] = {
                                    type: 'fire',
                                    color: '#FF4500',
                                    processed: true,
                                    temperature: 500,
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false,
                                    lifespan: 20 + Math.random() * 30
                                };
                            } 
                            // Just destroy non-flammables with certain probability
                            else if (Math.random() < intensity * 0.6) {
                                grid[ny][nx] = null;
                            }
                        }
                    }
                    // Outer range - push light objects, ignite some flammables
                    else {
                        // Heat up everything in blast radius
                        if (grid[ny][nx].temperature !== undefined) {
                            grid[ny][nx].temperature += 200 * intensity;
                        }
                        
                        // Small chance to ignite flammables
                        if (grid[ny][nx].flammable && Math.random() < intensity * 0.3) {
                            grid[ny][nx] = {
                                type: 'fire',
                                color: '#FF4500',
                                processed: true,
                                temperature: 300,
                                isGas: true,
                                isLiquid: false,
                                isPowder: false,
                                isSolid: false,
                                lifespan: 15 + Math.random() * 25
                            };
                        }
                    }
                } 
                // Fill empty cells with explosion effects
                else if (Math.random() < intensity * 0.5) {
                    // Create fire, smoke or debris
                    if (distance < radius * 0.2 && Math.random() < 0.7) {
                        // Core explosion
                        grid[ny][nx] = {
                            type: 'plasma',
                            color: '#FFFFFF',
                            processed: true,
                            temperature: 2000,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifespan: 5 + Math.random() * 10
                        };
                    } else if (distance < radius * 0.5 && Math.random() < 0.6) {
                        // Fire in middle area
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF4500',
                            processed: true,
                            temperature: 500,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifespan: 10 + Math.random() * 20
                        };
                    } else if (Math.random() < 0.4) {
                        // Smoke in outer areas
                        grid[ny][nx] = {
                            type: 'smoke',
                            color: '#555555',
                            processed: true,
                            temperature: 150,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifespan: 30 + Math.random() * 50
                        };
                    }
                }
            }
        }
    },
    
    // Render the dynamite
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw dynamite stick
        ctx.fillStyle = '#8B0000'; // Dark red for stick
        ctx.fillRect(
            x * cellSize + cellSize * 0.1, 
            y * cellSize + cellSize * 0.1, 
            cellSize * 0.8, 
            cellSize * 0.8
        );
        
        // Draw fuse
        ctx.strokeStyle = '#A0522D'; // Brown fuse
        ctx.lineWidth = cellSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(
            x * cellSize + cellSize * 0.5, 
            y * cellSize + cellSize * 0.1
        );
        
        // Wavy fuse
        ctx.bezierCurveTo(
            x * cellSize + cellSize * 0.7, 
            y * cellSize, 
            x * cellSize + cellSize * 0.9, 
            y * cellSize - cellSize * 0.1, 
            x * cellSize + cellSize * 0.9, 
            y * cellSize - cellSize * 0.3
        );
        ctx.stroke();
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.DynamiteElement = DynamiteElement;
} 
                }
            }
        }
    },
    
    // Render the dynamite
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw dynamite stick
        ctx.fillStyle = '#8B0000'; // Dark red for stick
        ctx.fillRect(
            x * cellSize + cellSize * 0.1, 
            y * cellSize + cellSize * 0.1, 
            cellSize * 0.8, 
            cellSize * 0.8
        );
        
        // Draw fuse
        ctx.strokeStyle = '#A0522D'; // Brown fuse
        ctx.lineWidth = cellSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(
            x * cellSize + cellSize * 0.5, 
            y * cellSize + cellSize * 0.1
        );
        
        // Wavy fuse
        ctx.bezierCurveTo(
            x * cellSize + cellSize * 0.7, 
            y * cellSize, 
            x * cellSize + cellSize * 0.9, 
            y * cellSize - cellSize * 0.1, 
            x * cellSize + cellSize * 0.9, 
            y * cellSize - cellSize * 0.3
        );
        ctx.stroke();
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.DynamiteElement = DynamiteElement;
} 
        // If ignited, count down to explosion
        if (grid[y][x].ignited) {
            // Visual indication of ignition
            grid[y][x].color = '#FF0000';
            
            // Tick the fuse timer
            grid[y][x].fuseTimer++;
            
            // Create smoke while waiting to explode
            if (Math.random() < 0.1) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 1;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#999999',
                        temperature: 60,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Explode after fuse timer reaches threshold
            if (grid[y][x].fuseTimer >= 30) {
                // Explode!
                grid[y][x] = null;
                
                // Large blast radius
                const blastRadius = 8;
                
                // Create explosion effect
                for (let dy = -blastRadius; dy <= blastRadius; dy++) {
                    for (let dx = -blastRadius; dx <= blastRadius; dx++) {
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance <= blastRadius) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (!isInBounds(nx, ny)) continue;
                            
                            // Destroy elements in blast radius with falloff based on distance
                            if (grid[ny][nx] && Math.random() < (1 - distance / blastRadius)) {
                                // Some chance to create fire
                                if (Math.random() < 0.3 && distance < blastRadius * 0.7) {
                                    grid[ny][nx] = {
                                        type: 'fire',
                                        color: '#FF9900',
                                        temperature: 120,
                                        processed: true,
                                        isGas: true,
                                        isLiquid: false,
                                        isPowder: false,
                                        isSolid: false
                                    };
                                } else {
                                    grid[ny][nx] = null;
                                }
                            }
                            
                            // Add smoke and fire at the edge of explosion
                            if (!grid[ny][nx] && Math.random() < 0.4 && distance > blastRadius * 0.5) {
                                grid[ny][nx] = {
                                    type: 'smoke',
                                    color: '#AAAAAA',
                                    temperature: 80,
                                    processed: true,
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false
                                };
                            }
                        }
                    }
                }
                
                return;
            }
        }
        
        // Dynamite falls with gravity
        if (y < grid.length - 1 && !grid[y][x].ignited) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base dynamite color
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw the dynamite stick
        ctx.fillRect(
            x * cellSize + cellSize * 0.2, 
            y * cellSize + cellSize * 0.1, 
            cellSize * 0.6, 
            cellSize * 0.8
        );
        
        // Draw fuse on top
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x * cellSize + cellSize * 0.5, y * cellSize + cellSize * 0.1);
        
        // Make the fuse wiggle if ignited
        if (particle.ignited) {
            const wiggle = Math.sin(Date.now() * 0.01) * cellSize * 0.1;
            ctx.lineTo(
                x * cellSize + cellSize * 0.5 + wiggle, 
                y * cellSize - cellSize * 0.3
            );
            
            // Add orange glow to fuse tip
            ctx.strokeStyle = '#FF7700';
        } else {
            ctx.lineTo(
                x * cellSize + cellSize * 0.5, 
                y * cellSize - cellSize * 0.2
            );
        }
        
        ctx.stroke();
        
        // Add "TNT" label
        if (cellSize >= 6) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${Math.max(8, cellSize * 0.4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('TNT', x * cellSize + cellSize / 2, y * cellSize + cellSize * 0.6);
        }
        
        // Show glow if ignited
        if (particle.ignited) {
            const fuseProgress = particle.fuseTimer / 30;
            
            // Make dynamite flash faster as it's about to explode
            if (fuseProgress > 0.7 && Math.random() < fuseProgress) {
                ctx.fillStyle = '#FFFF00';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                ctx.globalAlpha = 1.0;
            }
        }
    }
};

// Make the element available globally