// C4 Element
// Solid explosive that detonates when enough heat touches it

const C4Element = {
    name: 'c4',
    label: 'C4',
    description: 'Stable solid explosive that detonates when heated',
    category: 'solid',
    defaultColor: '#F5F5DC', // Beige/off-white color typical of C4
    
    // Physical properties
    density: 1.6,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
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
        particle.stability = 100; // Tracks how stable the explosive is (100 = stable)
        particle.detonating = false; // Flag for when it's about to explode
        particle.detonationTimer = 0; // Countdown to explosion
        
        // Small variations in appearance
        const colorVar = Math.floor(Math.random() * 15);
        particle.color = `rgb(${245 - colorVar}, ${245 - colorVar}, ${220 - colorVar})`;
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if C4 should fall (no support below)
        let hasSupport = false;
        
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && (grid[y + 1][x].isSolid || grid[y + 1][x].isPowder)) {
                hasSupport = true;
            }
        } else {
            // Bottom of grid counts as support
            hasSupport = true;
        }
        
        // If no support, the C4 falls
        if (!hasSupport && y < grid.length - 1 && !grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // If already detonating, handle the detonation sequence
        if (grid[y][x].detonating) {
            grid[y][x].detonationTimer++;
            
            // Visual indication that it's about to explode
            const timerProgress = Math.min(grid[y][x].detonationTimer / 10, 1);
            const r = Math.floor(245 + (timerProgress * 10));
            const g = Math.floor(245 - (timerProgress * 200));
            const b = Math.floor(220 - (timerProgress * 200));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // After a short delay, explode
            if (grid[y][x].detonationTimer >= 10) {
                this.detonate(x, y, grid, isInBounds);
                return;
            }
            
            return;
        }
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Track if C4 is near heat, fire, or other explosions
        let nearHeatCount = 0;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Heat exchange with surrounding elements
            if (grid[ny][nx].temperature !== undefined) {
                // C4 is fairly thermally conductive
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.05;
            }
            
            // Check for heat sources, fire, or other explosions
            if (grid[ny][nx].temperature > 100 || 
                grid[ny][nx].type === 'fire' || 
                (grid[ny][nx].explosive && grid[ny][nx].detonating)) {
                
                nearHeatCount++;
                
                // If nearby element is actively exploding, immediately start detonation
                if (grid[ny][nx].explosive && grid[ny][nx].detonating) {
                    grid[y][x].detonating = true;
                    grid[y][x].stability = 0;
                    grid[y][x].detonationTimer = 5; // Faster detonation when triggered by another explosive
                    return;
                }
            }
            
            // If near fire, chance to start detonating
            if (grid[ny][nx].type === 'fire' && Math.random() < 0.1) {
                grid[y][x].stability -= 20;
            }
        }
        
        // C4 is stable, but decreases stability when consistently near heat
        if (nearHeatCount > 0) {
            // Reduce stability based on heat intensity
            grid[y][x].stability -= 1 * nearHeatCount;
        }
        
        // Check own temperature - C4 becomes unstable at high temperatures
        if (grid[y][x].temperature > 100) {
            // Higher temperatures reduce stability faster
            const tempEffect = Math.max(0, (grid[y][x].temperature - 100) / 10);
            grid[y][x].stability -= tempEffect;
        }
        
        // If stability gets too low, start detonation sequence
        if (grid[y][x].stability <= 0 && !grid[y][x].detonating) {
            grid[y][x].detonating = true;
            grid[y][x].detonationTimer = 0;
        }
    },
    
    // Detonate the C4 with a large explosion
    detonate: function(x, y, grid, isInBounds) {
        // Define explosion radius
        const radius = 8; // C4 has a substantial blast radius
        
        // Create explosion effect
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > radius) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (!isInBounds(nx, ny)) continue;
                
                // Destroy blocks in explosion radius with falloff based on distance
                if (grid[ny][nx]) {
                    // Center of explosion is completely destructive
                    if (distance < radius * 0.3) {
                        // Create fire at center of explosion
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF9900',
                            processed: true,
                            temperature: 800,
                            lifetime: 30 + Math.floor(Math.random() * 50),
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                    }
                    // Middle area of explosion creates smoke and destroys weaker materials
                    else if (distance < radius * 0.7) {
                        // Don't destroy very dense materials
                        if (!grid[ny][nx].density || grid[ny][nx].density < 3) {
                            // Chance to create smoke or completely destroy
                            if (Math.random() < 0.7) {
                                grid[ny][nx] = {
                                    type: 'smoke',
                                    color: '#555555',
                                    processed: true,
                                    temperature: 200,
                                    lifetime: 100 + Math.floor(Math.random() * 100),
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false
                                };
                            } else {
                                grid[ny][nx] = null;
                            }
                        } else {
                            // Just heat up dense materials
                            grid[ny][nx].temperature = (grid[ny][nx].temperature || 25) + 400;
                            
                            // Chance to trigger other explosives in this zone
                            if (grid[ny][nx].explosive && Math.random() < 0.8) {
                                grid[ny][nx].detonating = true;
                                grid[ny][nx].stability = 0;
                            }
                        }
                    }
                    // Outer area of explosion applies force and heat
                    else {
                        // Apply heat
                        if (grid[ny][nx].temperature !== undefined) {
                            grid[ny][nx].temperature += 200 * (1 - distance/radius);
                        }
                        
                        // Push objects away from explosion
                        if (!grid[ny][nx].density || grid[ny][nx].density < 2) {
                            // Calculate push direction away from center
                            const pushDx = nx - x;
                            const pushDy = ny - y;
                            const pushDistance = Math.sqrt(pushDx*pushDx + pushDy*pushDy);
                            
                            if (pushDistance > 0) {
                                const pushX = Math.floor(nx + (pushDx / pushDistance) * 2);
                                const pushY = Math.floor(ny + (pushDy / pushDistance) * 2);
                                
                                if (isInBounds(pushX, pushY) && !grid[pushY][pushX]) {
                                    grid[pushY][pushX] = grid[ny][nx];
                                    grid[ny][nx] = null;
                                }
                            }
                        }
                        
                        // Chance to trigger other explosives in outer zone
                        if (grid[ny][nx] && grid[ny][nx].explosive && Math.random() < 0.4) {
                            grid[ny][nx].detonating = true;
                            grid[ny][nx].stability = 0;
                        }
                    }
                } else {
                    // Fill empty cells with explosion effects
                    if (distance < radius * 0.4 && Math.random() < 0.3) {
                        // Create fire near center
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF9900',
                            processed: true,
                            temperature: 600,
                            lifetime: 10 + Math.floor(Math.random() * 20),
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                    } else if (distance < radius * 0.8 && Math.random() < 0.4) {
                        // Create smoke in middle area
                        grid[ny][nx] = {
                            type: 'smoke',
                            color: '#777777',
                            processed: true,
                            temperature: 150,
                            lifetime: 50 + Math.floor(Math.random() * 50),
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                    }
                }
            }
        }
        
        // Remove the exploded C4
        grid[y][x] = null;
    },
    
    // Render the C4
    render: function(ctx, x, y, particle, cellSize) {
        // Base color is a light beige/off-white
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Fill the cell with C4
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add visual details to make it look like modeling clay
        
        // If it's detonating, add visual indicators
        if (particle.detonating) {
            // Add pulsing red glow as timer progresses
            const pulseIntensity = Math.sin(particle.detonationTimer * 0.8) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(255, 50, 0, ${pulseIntensity * 0.7})`;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // Add small bright spots
            ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
            const spotCount = 3;
            for (let i = 0; i < spotCount; i++) {
                const spotX = x * cellSize + Math.random() * cellSize;
                const spotY = y * cellSize + Math.random() * cellSize;
                const spotSize = cellSize * 0.1 * (Math.random() * 0.5 + 0.5);
                
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Regular C4 appearance
            
            // Add slight texture to simulate clay-like appearance
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            
            // Add some random dots for texture
            const dotCount = 5;
            for (let i = 0; i < dotCount; i++) {
                const dotX = x * cellSize + Math.random() * cellSize;
                const dotY = y * cellSize + Math.random() * cellSize;
                const dotSize = cellSize * 0.05 * (Math.random() * 0.5 + 0.5);
                
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add small impressions/finger marks
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 0.5;
            
            const impressionCount = 2;
            for (let i = 0; i < impressionCount; i++) {
                const startX = x * cellSize + Math.random() * cellSize;
                const startY = y * cellSize + Math.random() * cellSize;
                const controlX = startX + (Math.random() - 0.5) * cellSize * 0.5;
                const controlY = startY + (Math.random() - 0.5) * cellSize * 0.5;
                const endX = startX + (Math.random() - 0.5) * cellSize * 0.8;
                const endY = startY + (Math.random() - 0.5) * cellSize * 0.8;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                ctx.stroke();
            }
        }
    }
};

// Make the element available globally
window.C4Element = C4Element; 